/**
 * Redis-based Rate Limiter Middleware
 * 
 * Provides distributed rate limiting using Redis for horizontal scaling.
 */

import redis, { REDIS_KEYS } from '../db/redis.js';

/**
 * Create a Redis-based rate limiter
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.keyPrefix - Redis key prefix
 * @param {Function} options.keyGenerator - Custom key generator
 * @param {boolean} options.skipSuccessfulRequests - Skip counting successful requests
 * @returns {Function} Express middleware
 */
export function createRedisRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100,
    keyPrefix = REDIS_KEYS.RATE_LIMIT,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    skipSuccessfulRequests = false
  } = options;

  const windowSec = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}${keyGenerator(req)}`;
      const currentTime = Math.floor(Date.now() / 1000);
      const windowStart = currentTime - windowSec;

      // Use Redis transaction for atomic operations
      const multi = redis.multi();
      
      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      multi.zcard(key);
      
      // Add current request
      multi.zadd(key, currentTime, `${currentTime}-${Math.random()}`);
      
      // Set expiry on the key
      multi.expire(key, windowSec + 1);

      const results = await multi.exec();
      const requestCount = results[1][1]; // zcard result

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestCount - 1));
      res.setHeader('X-RateLimit-Reset', currentTime + windowSec);

      if (requestCount >= max) {
        const retryAfter = windowSec;
        res.setHeader('Retry-After', retryAfter);
        
        return res.status(429).json({
          error: 'Too many requests, please try again later.',
          retryAfter: `${Math.ceil(retryAfter / 60)} minutes`
        });
      }

      next();
    } catch (error) {
      console.error('Redis rate limiter error:', error.message);
      // Fail open - allow request if Redis is unavailable
      next();
    }
  };
}

/**
 * Sliding window rate limiter with Redis
 * More accurate than fixed window, uses less memory
 */
export function createSlidingWindowLimiter(options = {}) {
  const {
    windowMs = 60 * 1000,
    max = 60,
    keyPrefix = REDIS_KEYS.RATE_LIMIT,
    keyGenerator = (req) => req.ip
  } = options;

  const windowSec = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}sliding:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const multi = redis.multi();
      
      // Remove old entries
      multi.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in window
      multi.zcard(key);
      
      // Add new request
      multi.zadd(key, now, `${now}:${Math.random()}`);
      
      // Set expiry
      multi.expire(key, windowSec + 1);

      const results = await multi.exec();
      const requestCount = results[1][1];

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestCount - 1));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      if (requestCount >= max) {
        return res.status(429).json({
          error: 'Too many requests, please try again later.'
        });
      }

      next();
    } catch (error) {
      console.error('Sliding window limiter error:', error.message);
      next();
    }
  };
}

/**
 * Token bucket rate limiter
 * Smooth rate limiting with burst support
 */
export function createTokenBucketLimiter(options = {}) {
  const {
    bucketSize = 100,
    refillRate = 10, // tokens per second
    keyPrefix = REDIS_KEYS.RATE_LIMIT,
    keyGenerator = (req) => req.ip
  } = options;

  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}bucket:${keyGenerator(req)}`;
      const now = Date.now();

      // Lua script for atomic token bucket operation
      const script = `
        local key = KEYS[1]
        local bucketSize = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1]) or bucketSize
        local lastRefill = tonumber(bucket[2]) or now
        
        -- Calculate tokens to add based on time elapsed
        local elapsed = (now - lastRefill) / 1000
        tokens = math.min(bucketSize, tokens + (elapsed * refillRate))
        
        local allowed = 0
        if tokens >= 1 then
          tokens = tokens - 1
          allowed = 1
        end
        
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        
        return {allowed, math.floor(tokens)}
      `;

      const [allowed, remaining] = await redis.eval(
        script, 1, key, bucketSize, refillRate, now
      );

      res.setHeader('X-RateLimit-Limit', bucketSize);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (!allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please slow down.',
          retryAfter: '1 second'
        });
      }

      next();
    } catch (error) {
      console.error('Token bucket limiter error:', error.message);
      next();
    }
  };
}

// Pre-configured rate limiters
export const redisApiLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: `${REDIS_KEYS.RATE_LIMIT}api:`
});

export const redisAuthLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: `${REDIS_KEYS.RATE_LIMIT}auth:`
});

export const redisPasswordResetLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: `${REDIS_KEYS.RATE_LIMIT}reset:`
});

export const redisRegistrationLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: `${REDIS_KEYS.RATE_LIMIT}register:`
});

export const redisPaymentLimiter = createSlidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: `${REDIS_KEYS.RATE_LIMIT}payment:`
});

export default {
  createRedisRateLimiter,
  createSlidingWindowLimiter,
  createTokenBucketLimiter,
  redisApiLimiter,
  redisAuthLimiter,
  redisPasswordResetLimiter,
  redisRegistrationLimiter,
  redisPaymentLimiter
};
