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

    // Check cache first
    const cachedResult = await redis.getCachedResult(job.url);
    if (cachedResult) {
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
      // Try Puppeteer-extra with stealth plugin for sites that block bots
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 30000 });
      html = await page.content();
      await browser.close();
      usedPuppeteer = true;
    } catch (err) {
      console.warn('Puppeteer-extra failed, falling back to axios:', err.message);
      // Fallback to axios if Puppeteer fails
      const response = await httpClient.get(job.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

    // Extract data
    const title = $('title').text().trim() || null;
    
    const metaDescription = 
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      null;

    // Extract all paragraphs (filter out very short ones)
    const paragraphs = [];
    
    $('p').each((_, element) => {
      const text = $(element).text().trim();
      // Only include paragraphs with meaningful content (more than 20 chars)
      if (text && text.length > 20) {
        paragraphs.push(text);
      }
    });

    // Extract all images
    const images = [];
    const baseUrl = new URL(job.url);
    
    $('img').each((_, element) => {
      let src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src');
      const alt = $(element).attr('alt')?.trim() || '';
      
      if (src) {
        // Convert relative URLs to absolute
        if (src.startsWith('//')) {
          src = baseUrl.protocol + src;
        } else if (src.startsWith('/')) {
          src = baseUrl.origin + src;
        } else if (!src.startsWith('http')) {
          src = new URL(src, job.url).href;
        }
        
        // Filter out tiny images (likely icons/trackers) and data URIs
        if (!src.startsWith('data:') && !src.includes('1x1') && !src.includes('pixel')) {
          images.push({ src, alt });
        }
      }
    });

    console.log('📝 Extracted paragraphs:', paragraphs.length);
    console.log('🖼️  Extracted images:', images.length);
    if (usedPuppeteer) {
      console.log('✅ Used Puppeteer for scraping');
    }

    const result = {
      title,
      metaDescription,
      paragraphs: paragraphs.slice(0, 100), // Limit to 100 paragraphs
      images: images.slice(0, 50) // Limit to 50 images
    };

    // Update job with results
    await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      result
    });

    // Cache the result in Redis for 1 hour
    await redis.cacheResult(job.url, result, 3600);
    await redis.setJobStatus(jobId, { status: 'completed', fromCache: false });

    console.log(`✅ Completed job: ${job._id} - Found ${paragraphs.length} paragraphs, ${images.length} images`);

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
