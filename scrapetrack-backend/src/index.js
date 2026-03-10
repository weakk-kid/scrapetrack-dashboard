require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobs');
const redis = require('./services/redis');
const queue = require('./services/queue');
const scraper = require('./services/scraper');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  let redisStatus = 'disconnected';
  let queueStatus = 'disconnected';
  
  try {
    const redisClient = redis.getRedis();
    await redisClient.ping();
    redisStatus = 'connected';
  } catch (e) {
    redisStatus = 'error: ' + e.message;
  }

  try {
    const stats = await queue.getQueueStats();
    queueStatus = `connected (${stats.messageCount} messages, ${stats.consumerCount} consumers)`;
  } catch (e) {
    queueStatus = 'error: ' + e.message;
  }

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisStatus,
      rabbitmq: queueStatus
    }
  });
});

// Connect to services and start server
async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Initialize Redis
    redis.initRedis();

    // Initialize RabbitMQ
    await queue.initQueue();

    // Start worker (consume jobs in same process)
    await queue.consumeJobs(async (message) => {
      const { jobId } = message;
      console.log(`\n🔧 Processing job: ${jobId}`);
      await scraper.processJob(jobId);
    });
    console.log('👷 Worker started - processing jobs in-process');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await redis.closeRedis();
  await queue.closeQueue();
  await mongoose.connection.close();
  process.exit(0);
});

start();
