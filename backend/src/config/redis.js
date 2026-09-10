const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUri = process.env.REDIS_URI;
    
    console.log('Connecting to Redis at:', redisUri.replace(/:[^@]*@/, ':****@')); // Hide password in logs

    redisClient = new Redis(redisUri, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis retry exhausted, stopping.');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: false,
      // Upstash requires TLS
      tls: {
        rejectUnauthorized: false
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully (singleton)');
    });

    redisClient.on('ready', () => {
      console.log('Redis is ready to accept commands');
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      console.error('Full error:', err);
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }
  return redisClient;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed gracefully');
  }
}

module.exports = { getRedisClient, closeRedis };