const Redis = require('ioredis');

let redis = null;

/**
 * Initialize Redis connection
 */
function initRedis() {
  if (redis) return redis;

  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  });

  redis.on('connect', () => {
    console.log('🔴 Connected to Redis (Upstash)');
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  return redis;
}

/**
 * Get Redis client instance
 */
function getRedis() {
  if (!redis) {
    initRedis();
  }
  return redis;
}

/**
 * Cache scrape result for a URL
 * @param {string} url - The URL that was scraped
 * @param {object} result - The scrape result
 * @param {number} ttl - Time to live in seconds (default 1 hour)
 */
async function cacheResult(url, result, ttl = 3600) {
  const client = getRedis();
  const key = `scrape:${url}`;
  await client.setex(key, ttl, JSON.stringify(result));
  console.log(`📦 Cached result for: ${url} (TTL: ${ttl}s)`);
}

/**
 * Get cached result for a URL
 * @param {string} url - The URL to check
 * @returns {object|null} - Cached result or null
 */
async function getCachedResult(url) {
  const client = getRedis();
  const key = `scrape:${url}`;
  const cached = await client.get(key);
  
  if (cached) {
    console.log(`✅ Cache HIT for: ${url}`);
    return JSON.parse(cached);
  }
  
  console.log(`❌ Cache MISS for: ${url}`);
  return null;
}

/**
 * Check rate limit for a domain
 * @param {string} domain - The domain to check
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowSeconds - Window size in seconds
 * @returns {boolean} - True if allowed, false if rate limited
 */
async function checkRateLimit(domain, maxRequests = 10, windowSeconds = 60) {
  const client = getRedis();
  const key = `ratelimit:${domain}`;
  
  const current = await client.incr(key);
  
  if (current === 1) {
    await client.expire(key, windowSeconds);
  }
  
  if (current > maxRequests) {
    console.log(`🚫 Rate limited: ${domain} (${current}/${maxRequests})`);
    return false;
  }
  
  console.log(`✅ Rate limit OK: ${domain} (${current}/${maxRequests})`);
  return true;
}

/**
 * Store job status in Redis for fast polling
 * @param {string} jobId - Job ID
 * @param {object} status - Status object
 */
async function setJobStatus(jobId, status) {
  const client = getRedis();
  const key = `job:${jobId}`;
  await client.setex(key, 86400, JSON.stringify(status)); // 24 hour TTL
}

/**
 * Get job status from Redis
 * @param {string} jobId - Job ID
 * @returns {object|null} - Status or null
 */
async function getJobStatus(jobId) {
  const client = getRedis();
  const key = `job:${jobId}`;
  const status = await client.get(key);
  return status ? JSON.parse(status) : null;
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis connection closed');
  }
}

module.exports = {
  initRedis,
  getRedis,
  cacheResult,
  getCachedResult,
  checkRateLimit,
  setJobStatus,
  getJobStatus,
  closeRedis
};
