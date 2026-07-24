/**
 * Redis Connection Module
 * 
 * Provides Redis client for caching, session management, and rate limiting.
 */

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
};

// Create Redis client
const redis = new Redis(REDIS_CONFIG);

// Event handlers
redis.on('connect', () => {
  console.log('🔴 Redis: Connected successfully');
});

redis.on('ready', () => {
  console.log('🔴 Redis: Ready to accept commands');
});

redis.on('error', (err) => {
  console.error('🔴 Redis Error:', err.message);
});

redis.on('close', () => {
  console.log('🔴 Redis: Connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔴 Redis: Reconnecting...');
});

/**
 * Connect to Redis
 */
export async function connectRedis() {
  try {
    await redis.connect();
    return true;
  } catch (error) {
    if (error.message.includes('Already')) {
      console.log('🔴 Redis: Already connected');
      return true;
    }
    console.error('🔴 Redis connection failed:', error.message);
    return false;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis() {
  try {
    await redis.quit();
    console.log('🔴 Redis: Disconnected gracefully');
  } catch (error) {
    console.error('🔴 Redis disconnect error:', error.message);
  }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected() {
  return redis.status === 'ready';
}

/**
 * Redis key prefixes for organization
 */
export const REDIS_KEYS = {
  SESSION: 'session:',
  RATE_LIMIT: 'ratelimit:',
  CACHE: 'cache:',
  REFRESH_TOKEN: 'refresh:',
  PASSWORD_RESET: 'reset:',
  VERIFICATION: 'verify:',
  OAUTH_STATE: 'oauth:',
  ACTIVE_USERS: 'active:',
  LEADERBOARD: 'leaderboard:',
  NOTIFICATIONS: 'notif:',
  CURSOR: 'cursor:'
};

export default redis;
