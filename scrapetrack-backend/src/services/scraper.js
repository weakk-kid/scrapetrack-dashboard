const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const Job = require('../models/Job');

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

    // Fetch the webpage
    const response = await httpClient.get(job.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5
    });

    // Parse HTML with Cheerio
    const $ = cheerio.load(response.data);

    // Extract data
    const title = $('title').text().trim() || null;
    
    const metaDescription = 
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      null;

    // Extract all links
    const links = [];
    const baseUrl = new URL(job.url);
    
    $('a[href]').each((_, element) => {
      let href = $(element).attr('href');
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }

      // Convert relative URLs to absolute
      try {
        const absoluteUrl = new URL(href, baseUrl.origin).href;
        if (!links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    });

    // Update job with results
    await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      result: {
        title,
        metaDescription,
        links: links.slice(0, 100) // Limit to 100 links
      }
    });

    console.log(`✅ Completed job: ${job._id} - Found ${links.length} links`);

  } catch (error) {
    console.error(`❌ Failed job ${jobId}:`, error.message);

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
