/**
 * Redis Caching Service
 * 
 * Provides caching functionality for API responses and data.
 * Falls back to in-memory cache when Redis is unavailable.
 */

import redis, { REDIS_KEYS, isRedisConnected } from '../db/redis.js';
import { inMemoryCache } from '../db/memoryFallback.js';

/**
 * Cache a value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export async function setCache(key, value, ttl = 300) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemoryCache.set(key, value, ttl);
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
    await redis.setex(cacheKey, ttl, serialized);
    return true;
  } catch (error) {
    console.error('Set cache error:', error.message);
    return false;
  }
}

/**
 * Get cached value
 * @param {string} key - Cache key
 */
export async function getCache(key) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemoryCache.get(key);
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    const value = await redis.get(cacheKey);
    
    if (!value) {
      return null;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Get cache error:', error.message);
    return null;
  }
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
export async function deleteCache(key) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemoryCache.delete(key);
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Delete cache error:', error.message);
    return false;
  }
}

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern (e.g., 'users:*')
 */
export async function deleteCachePattern(pattern) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    // In-memory doesn't support patterns well, just return 0
    return 0;
  }
  
  try {
    const cachePattern = `${REDIS_KEYS.CACHE}${pattern}`;
    const keys = await redis.keys(cachePattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return keys.length;
  } catch (error) {
    console.error('Delete cache pattern error:', error.message);
    return 0;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 */
export async function hasCache(key) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemoryCache.has(key);
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    return await redis.exists(cacheKey) === 1;
  } catch (error) {
    console.error('Has cache error:', error.message);
    return false;
  }
}

/**
 * Get remaining TTL for cache key
 * @param {string} key - Cache key
 */
export async function getCacheTTL(key) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return -1; // Not supported in memory fallback
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    return await redis.ttl(cacheKey);
  } catch (error) {
    console.error('Get cache TTL error:', error.message);
    return -1;
  }
}

/**
 * Increment a cached counter
 * @param {string} key - Cache key
 * @param {number} amount - Amount to increment
 */
export async function incrementCache(key, amount = 1) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return null; // Not supported in memory fallback
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    return await redis.incrby(cacheKey, amount);
  } catch (error) {
    console.error('Increment cache error:', error.message);
    return null;
  }
}

/**
 * Decrement a cached counter
 * @param {string} key - Cache key
 * @param {number} amount - Amount to decrement
 */
export async function decrementCache(key, amount = 1) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return null; // Not supported in memory fallback
  }
  
  try {
    const cacheKey = `${REDIS_KEYS.CACHE}${key}`;
    return await redis.decrby(cacheKey, amount);
  } catch (error) {
    console.error('Decrement cache error:', error.message);
    return null;
  }
}

/**
 * Cached function wrapper
 * @param {Function} fn - Function to cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate key from fn args
 */
export async function withCache(fn, key, ttl = 300, keyGenerator = null) {
  try {
    const cacheKey = keyGenerator ? keyGenerator(...arguments.slice(3)) : key;
    
    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    // Execute function
    const data = await fn();
    
    // Cache the result
    await setCache(cacheKey, data, ttl);
    
    return { data, fromCache: false };
  } catch (error) {
    console.error('With cache error:', error.message);
    const data = await fn();
    return { data, fromCache: false };
  }
}

/**
 * Invalidate related caches
 * @param {string[]} keys - Array of cache keys
 */
export async function invalidateCaches(keys) {
  try {
    for (const key of keys) {
      await deleteCache(key);
    }
    return true;
  } catch (error) {
    console.error('Invalidate caches error:', error.message);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  // Use in-memory fallback stats if Redis is not connected
  if (!isRedisConnected()) {
    const { getMemoryStats } = await import('../db/memoryFallback.js');
    const stats = getMemoryStats();
    return {
      totalKeys: stats.cache,
      estimatedSize: 0,
      sampleSize: stats.cache,
      mode: 'memory'
    };
  }
  
  try {
    const pattern = `${REDIS_KEYS.CACHE}*`;
    const keys = await redis.keys(pattern);
    
    let totalSize = 0;
    for (const key of keys.slice(0, 100)) { // Sample first 100
      const size = await redis.memory('USAGE', key);
      if (size) totalSize += size;
    }

    return {
      totalKeys: keys.length,
      estimatedSize: totalSize * (keys.length / 100),
      sampleSize: Math.min(keys.length, 100),
      mode: 'redis'
    };
  } catch (error) {
    console.error('Get cache stats error:', error.message);
    return { totalKeys: 0, estimatedSize: 0, sampleSize: 0 };
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemoryCache.clear();
  }
  
  try {
    const pattern = `${REDIS_KEYS.CACHE}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return keys.length;
  } catch (error) {
    console.error('Clear all cache error:', error.message);
    return 0;
  }
}

// Cache key builders for common patterns
export const CacheKeys = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:${userId}:profile`,
  userStats: (userId) => `user:${userId}:stats`,
  tickets: (filter) => `tickets:${JSON.stringify(filter)}`,
  ticket: (ticketId) => `ticket:${ticketId}`,
  leaderboard: (period) => `leaderboard:${period}`,
  stats: (type) => `stats:${type}`,
  dashboard: (userId) => `dashboard:${userId}`,
  notifications: (userId) => `notifications:${userId}`,
  categories: () => 'categories:all',
  settings: () => 'settings:platform'
};

export default {
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  hasCache,
  getCacheTTL,
  incrementCache,
  decrementCache,
  withCache,
  invalidateCaches,
  getCacheStats,
  clearAllCache,
  CacheKeys
};
