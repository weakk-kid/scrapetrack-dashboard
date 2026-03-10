const amqp = require('amqplib');

const QUEUE_NAME = 'scrape_jobs';
const RECONNECT_DELAY_MS = 5000; // Start with 5 seconds
const MAX_RECONNECT_DELAY_MS = 60000; // Max 60 seconds

let connection = null;
let channel = null;
let isReconnecting = false;
let currentReconnectDelay = RECONNECT_DELAY_MS;
let consumerHandler = null; // Store handler for reconnection

/**
 * Initialize RabbitMQ connection and channel with auto-reconnect
 */
async function initQueue() {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    // Add heartbeat to detect dead connections faster
    const url = new URL(process.env.RABBITMQ_URL);
    url.searchParams.set('heartbeat', '30'); // 30 second heartbeat
    
    connection = await amqp.connect(url.toString());
    channel = await connection.createChannel();
    
    // Ensure queue exists with durability
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    // Prefetch 1 message at a time for fair distribution
    await channel.prefetch(1);

    console.log('🐰 Connected to RabbitMQ (CloudAMQP)');
    
    // Reset reconnect delay on successful connection
    currentReconnectDelay = RECONNECT_DELAY_MS;
    isReconnecting = false;

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      handleDisconnect();
    });

    // Handle connection close
    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      handleDisconnect();
    });

    // Handle channel errors
    channel.on('error', (err) => {
      console.error('RabbitMQ channel error:', err.message);
    });

    channel.on('close', () => {
      console.log('RabbitMQ channel closed');
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error.message);
    connection = null;
    channel = null;
    throw error;
  }
}

/**
 * Handle disconnection and trigger reconnection
 */
function handleDisconnect() {
  connection = null;
  channel = null;
  
  if (!isReconnecting) {
    scheduleReconnect();
  }
}

/**
 * Schedule a reconnection attempt with exponential backoff
 */
function scheduleReconnect() {
  if (isReconnecting) return;
  
  isReconnecting = true;
  
  console.log(`🔄 Reconnecting to RabbitMQ in ${currentReconnectDelay / 1000}s...`);
  
  setTimeout(async () => {
    try {
      await initQueue();
      
      // Re-register consumer if we had one
      if (consumerHandler) {
        console.log('🔄 Re-registering job consumer...');
        await consumeJobs(consumerHandler);
      }
      
      console.log('✅ Reconnected to RabbitMQ successfully');
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message);
      
      // Exponential backoff (double the delay, up to max)
      currentReconnectDelay = Math.min(currentReconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
      isReconnecting = false;
      scheduleReconnect();
    }
  }, currentReconnectDelay);
}

/**
 * Check if connected to RabbitMQ
 */
function isConnected() {
  return connection !== null && channel !== null;
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
    persistent: true,
    priority: options.priority || 0
  });

  console.log(`📤 Published job to queue: ${jobId}`);
}

/**
 * Consume jobs from the queue
 * @param {function} handler - Async function to process each job
 */
async function consumeJobs(handler) {
  // Store handler for reconnection
  consumerHandler = handler;
  
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
      channel.ack(msg);
      console.log(`✅ Job completed and acknowledged: ${content.jobId}`);
    } catch (error) {
      console.error(`❌ Job failed: ${content.jobId}`, error.message);
      
      if (!msg.fields.redelivered) {
        channel.nack(msg, false, true);
        console.log(`🔄 Job requeued: ${content.jobId}`);
      } else {
        channel.nack(msg, false, false);
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
  consumerHandler = null;
  isReconnecting = false;
  
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
  isConnected,
  QUEUE_NAME
};
