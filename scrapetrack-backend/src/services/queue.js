const amqp = require('amqplib');

const QUEUE_NAME = 'scrape_jobs';
let connection = null;
let channel = null;

/**
 * Initialize RabbitMQ connection and channel
 */
async function initQueue() {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Ensure queue exists with durability
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // Queue survives broker restart
    });

    // Prefetch 1 message at a time for fair distribution among workers
    await channel.prefetch(1);

    console.log('🐰 Connected to RabbitMQ (CloudAMQP)');
    
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error.message);
    throw error;
  }
}

/**
 * Publish a job to the queue
 * @param {string} jobId - The job ID to process
 * @param {object} options - Additional options
 */
async function publishJob(jobId, options = {}) {
  if (!channel) {
    await initQueue();
  }

  const message = JSON.stringify({
    jobId,
    timestamp: new Date().toISOString(),
    ...options
  });

  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
    persistent: true, // Message survives broker restart
    priority: options.priority || 0
  });

  console.log(`📤 Published job to queue: ${jobId}`);
}

/**
 * Consume jobs from the queue
 * @param {function} handler - Async function to process each job
 */
async function consumeJobs(handler) {
  if (!channel) {
    await initQueue();
  }

  console.log(`👷 Worker waiting for jobs on queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const content = JSON.parse(msg.content.toString());
    console.log(`📥 Received job: ${content.jobId}`);

    try {
      await handler(content);
      channel.ack(msg); // Acknowledge successful processing
      console.log(`✅ Job completed and acknowledged: ${content.jobId}`);
    } catch (error) {
      console.error(`❌ Job failed: ${content.jobId}`, error.message);
      
      // Reject and requeue if it hasn't been redelivered too many times
      // This prevents infinite loops for permanently failing jobs
      if (!msg.fields.redelivered) {
        channel.nack(msg, false, true); // Requeue
        console.log(`🔄 Job requeued: ${content.jobId}`);
      } else {
        channel.nack(msg, false, false); // Don't requeue (send to DLQ if configured)
        console.log(`☠️ Job moved to dead letter: ${content.jobId}`);
      }
    }
  });
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  if (!channel) {
    await initQueue();
  }

  const queueInfo = await channel.checkQueue(QUEUE_NAME);
  return {
    name: queueInfo.queue,
    messageCount: queueInfo.messageCount,
    consumerCount: queueInfo.consumerCount
  };
}

/**
 * Close RabbitMQ connection
 */
async function closeQueue() {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  console.log('RabbitMQ connection closed');
}

module.exports = {
  initQueue,
  publishJob,
  consumeJobs,
  getQueueStats,
  closeQueue,
  QUEUE_NAME
};
