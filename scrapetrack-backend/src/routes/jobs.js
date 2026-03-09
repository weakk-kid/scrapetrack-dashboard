const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const queue = require('../services/queue');
const redis = require('../services/redis');

// POST /api/jobs - Create a new scraping job
router.post('/', async (req, res) => {
  try {
    const { url, priority } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Create job in pending state
    const job = await Job.create({ url, status: 'pending' });

    // Publish to RabbitMQ queue instead of processing directly
    await queue.publishJob(job._id.toString(), { priority: priority || 0 });

    // Set initial status in Redis for fast polling
    await redis.setJobStatus(job._id.toString(), { status: 'pending', url });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// GET /api/jobs - List all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get job details with results
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Job not found' });
    }
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Job not found' });
    }
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// GET /api/jobs/:id/status - Fast status polling from Redis
router.get('/:id/status', async (req, res) => {
  try {
    // Try Redis first for fast response
    const redisStatus = await redis.getJobStatus(req.params.id);
    if (redisStatus) {
      return res.json({ source: 'redis', ...redisStatus });
    }

    // Fallback to MongoDB
    const job = await Job.findById(req.params.id).select('status');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ source: 'mongodb', status: job.status });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Job not found' });
    }
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// GET /api/jobs/queue/stats - Get queue statistics
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await queue.getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

module.exports = router;
