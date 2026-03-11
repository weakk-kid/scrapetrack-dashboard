const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
async function testCodeforcesScrape() {
  const url = 'https://codeforces.com/profile/weakk_kid';
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    await browser.close();
    // Simple check: print page title
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'No title found';
    console.log('Page title:', title);
  } catch (err) {
    console.error('Puppeteer scrape failed:', err);
  }
}

testCodeforcesScrape();
