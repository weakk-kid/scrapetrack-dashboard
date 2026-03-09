/**
 * Worker Process
 * 
 * This runs as a separate process that consumes jobs from RabbitMQ
 * and processes them using the scraper service.
 * 
 * Run with: npm run worker
 */

require('dotenv').config();
const mongoose = require('mongoose');
const queue = require('./services/queue');
const scraper = require('./services/scraper');
const redis = require('./services/redis');

const WORKER_ID = `worker-${process.pid}`;

async function start() {
  console.log(`🚀 Starting ${WORKER_ID}...`);

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }

  // Initialize Redis
  try {
    redis.initRedis();
    console.log('✅ Redis initialized');
  } catch (error) {
    console.error('⚠️ Redis initialization warning:', error.message);
    // Continue without Redis - caching will be disabled
  }

  // Initialize RabbitMQ and start consuming
  try {
    await queue.initQueue();
    
    // Process jobs from the queue
    await queue.consumeJobs(async (message) => {
      const { jobId } = message;
      console.log(`\n${WORKER_ID} processing job: ${jobId}`);
      
      await scraper.processJob(jobId);
    });

    console.log(`\n👷 ${WORKER_ID} is ready and waiting for jobs...`);
    console.log('Press Ctrl+C to stop\n');

  } catch (error) {
    console.error('❌ Failed to start worker:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down worker...');
  
  try {
    await queue.closeQueue();
    await redis.closeRedis();
    await mongoose.connection.close();
    console.log('✅ Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the worker
start();
