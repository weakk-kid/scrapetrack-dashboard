const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const Job = require('../models/Job');
const redis = require('./redis');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Create axios instance that ignores SSL certificate errors
const httpClient = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

/**
 * Process a scraping job
 * @param {string} jobId - Job ID
 */
async function processJob(jobId) {
  try {
    // Update status to running
    const job = await Job.findByIdAndUpdate(jobId, { status: 'running' }, { new: true });

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    console.log(`🔄 Processing job: ${job._id} - ${job.url}`);

    // Update Redis with job status
    await redis.setJobStatus(jobId, { status: 'running', url: job.url });

    // Check cache first (only use if it has the new elements format)
    const cachedResult = await redis.getCachedResult(job.url);
    if (cachedResult && cachedResult.elements) {
      await Job.findByIdAndUpdate(jobId, {
        status: 'completed',
        result: cachedResult
      });
      await redis.setJobStatus(jobId, { status: 'completed', fromCache: true });
      console.log(`✅ Completed job from cache: ${job._id}`);
      return;
    }

    // Check rate limit for the domain
    const domain = new URL(job.url).hostname;
    const canProceed = await redis.checkRateLimit(domain, 10, 60); // 10 requests per minute per domain
    
    if (!canProceed) {
      // Rate limited - requeue with delay (will be handled by the caller)
      throw new Error(`Rate limited for domain: ${domain}. Please retry later.`);
    }

    let html;
    let usedPuppeteer = false;
    try {
      // Launch Puppeteer-extra with stealth plugin and realistic browser args
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-size=1920,1080',
          '--start-maximized',
          '--disable-dev-shm-usage',
          '--lang=en-US,en',
        ],
      });
      const page = await browser.newPage();

      // Set realistic viewport and user-agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      // Navigate and wait for content to load
      await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 45000 });

      // Small random delay to mimic human behavior
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

      // Scroll down to trigger lazy-loaded content
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a bit after scrolling for lazy content
      await new Promise(r => setTimeout(r, 1500));

      html = await page.content();
      await browser.close();
      usedPuppeteer = true;
    } catch (err) {
      console.warn('Puppeteer-extra failed, falling back to axios:', err.message);
      // Fallback to axios if Puppeteer fails
      const response = await httpClient.get(job.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 30000,
        maxRedirects: 5
      });
      html = response.data;
    }

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);
    const baseUrl = new URL(job.url);

    // Skip non-visible / structural tags
    const skipTags = new Set([
      'html', 'head', 'body', 'script', 'style', 'noscript', 'link',
      'meta', 'br', 'hr', 'wbr', 'col', 'colgroup', 'source', 'track',
      'param', 'area', 'base', 'embed', 'object', 'template', 'slot',
      'svg', 'path', 'g', 'defs', 'clippath', 'circle', 'rect', 'line',
      'polygon', 'polyline', 'ellipse', 'use', 'symbol', 'lineargradient',
      'radialgradient', 'stop', 'filter', 'mask', 'pattern', 'title',
    ]);

    // Extract data
    const pageTitle = $('title').text().trim() || null;

    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      null;

    // Extract ALL elements grouped by tag
    const elements = {};
    const seen = new Set();

    $('body *').each((_, el) => {
      const tag = $(el).prop('tagName')?.toLowerCase();
      if (!tag || skipTags.has(tag)) return;

      const entry = {};

      // Get direct text (not children's text) for leaf-like content
      const ownText = $(el).contents().filter(function () {
        return this.type === 'text';
      }).text().trim();
      const fullText = $(el).text().trim();
      const text = ownText.length > 5 ? ownText : fullText;

      // Tag-specific attribute extraction
      if (tag === 'a') {
        const href = $(el).attr('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        let url = href;
        if (url.startsWith('//')) url = baseUrl.protocol + url;
        else if (url.startsWith('/')) url = baseUrl.origin + url;
        else if (!url.startsWith('http')) try { url = new URL(url, job.url).href; } catch { return; }
        entry.href = url;
        if (text) entry.text = text;
      } else if (tag === 'img') {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (!src || src.startsWith('data:')) return;
        if (src.startsWith('//')) src = baseUrl.protocol + src;
        else if (src.startsWith('/')) src = baseUrl.origin + src;
        else if (!src.startsWith('http')) try { src = new URL(src, job.url).href; } catch { return; }
        entry.src = src;
        const alt = $(el).attr('alt')?.trim();
        if (alt) entry.alt = alt;
      } else if (tag === 'video' || tag === 'audio') {
        const src = $(el).attr('src') || $(el).find('source').first().attr('src');
        if (src) entry.src = src;
        if (!src && !text) return;
        if (text) entry.text = text;
      } else if (tag === 'iframe') {
        const src = $(el).attr('src');
        if (src) entry.src = src;
        else return;
      } else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
        const type = $(el).attr('type');
        const name = $(el).attr('name');
        const placeholder = $(el).attr('placeholder');
        if (type) entry.type = type;
        if (name) entry.name = name;
        if (placeholder) entry.placeholder = placeholder;
        if (!type && !name && !placeholder) return;
      } else if (tag === 'form') {
        const action = $(el).attr('action');
        const method = $(el).attr('method');
        if (action) entry.action = action;
        if (method) entry.method = method;
        if (!action && !method) return;
      } else if (tag === 'table') {
        // Extract table as rows of cells
        const rows = [];
        $(el).find('tr').each((_, tr) => {
          const cells = [];
          $(tr).find('td, th').each((_, cell) => {
            cells.push($(cell).text().trim());
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) entry.rows = rows.slice(0, 100);
        else return;
      } else {
        // All other tags — extract text content
        if (!text || text.length < 2) return;
        entry.text = text;
      }

      // Deduplicate by stringified entry
      const key = JSON.stringify(entry);
      if (seen.has(key)) return;
      seen.add(key);

      if (!elements[tag]) elements[tag] = [];
      elements[tag].push(entry);
    });

    // Count totals
    let totalElements = 0;
    for (const tag in elements) {
      totalElements += elements[tag].length;
    }

    console.log(`📝 Extracted ${totalElements} elements across ${Object.keys(elements).length} tag types`);
    if (usedPuppeteer) {
      console.log('✅ Used Puppeteer for scraping');
    }

    const result = {
      title: pageTitle,
      metaDescription,
      elements,
      totalElements,
      tagTypes: Object.keys(elements),
    };

    // Update job with results (use native MongoDB update to preserve Mixed type fields)
    await Job.collection.updateOne(
      { _id: job._id },
      { $set: { status: 'completed', result } }
    );

    // Cache the result in Redis for 1 hour
    await redis.cacheResult(job.url, result, 3600);
    await redis.setJobStatus(jobId, { status: 'completed', fromCache: false });

    console.log(`✅ Completed job: ${job._id} - ${totalElements} elements across ${Object.keys(elements).length} tags`);

  } catch (error) {
    console.error(`❌ Failed job ${jobId}:`, error.message);

    // Update Redis status
    await redis.setJobStatus(jobId, { status: 'failed', error: error.message });

    // Update job as failed
    await Job.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message
    });
  }
}

module.exports = {
  processJob
};
