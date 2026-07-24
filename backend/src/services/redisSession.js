/**
 * Redis Session Management Service
 * 
 * Provides session storage and management using Redis.
 * Falls back to in-memory storage when Redis is unavailable.
 */

import redis, { REDIS_KEYS, isRedisConnected } from '../db/redis.js';
import { inMemorySession } from '../db/memoryFallback.js';

/**
 * Create a new session
 * @param {string} sessionId - Unique session ID
 * @param {Object} data - Session data
 * @param {number} ttl - Time to live in seconds (default: 24 hours)
 */
export async function createSession(sessionId, data, ttl = 86400) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.create(sessionId, data, ttl);
  }
  
  try {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    await redis.hmset(key, {
      data: JSON.stringify(data),
      createdAt: Date.now(),
      lastAccess: Date.now()
    });
    await redis.expire(key, ttl);
    return true;
  } catch (error) {
    console.error('Create session error:', error.message);
    return false;
  }
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @param {boolean} updateAccess - Update last access time
 */
export async function getSession(sessionId, updateAccess = true) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.get(sessionId, updateAccess);
  }
  
  try {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    const session = await redis.hgetall(key);
    
    if (!session || !session.data) {
      return null;
    }

    if (updateAccess) {
      await redis.hset(key, 'lastAccess', Date.now());
    }

    return JSON.parse(session.data);
  } catch (error) {
    console.error('Get session error:', error.message);
    return null;
  }
}

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} data - Updated session data
 */
export async function updateSession(sessionId, data) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.update(sessionId, data);
  }
  
  try {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    const exists = await redis.exists(key);
    
    if (!exists) {
      return false;
    }

    await redis.hset(key, 'data', JSON.stringify(data), 'lastAccess', Date.now());
    return true;
  } catch (error) {
    console.error('Update session error:', error.message);
    return false;
  }
}

/**
 * Delete session
 * @param {string} sessionId - Session ID
 */
export async function deleteSession(sessionId) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.delete(sessionId);
  }
  
  try {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Delete session error:', error.message);
    return false;
  }
}

/**
 * Extend session TTL
 * @param {string} sessionId - Session ID
 * @param {number} ttl - New TTL in seconds
 */
export async function extendSession(sessionId, ttl = 86400) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.extend(sessionId, ttl);
  }
  
  try {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    await redis.expire(key, ttl);
    return true;
  } catch (error) {
    console.error('Extend session error:', error.message);
    return false;
  }
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 */
export async function getUserSessions(userId) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return [];
  }
  
  try {
    const pattern = `${REDIS_KEYS.SESSION}*`;
    const keys = await redis.keys(pattern);
    const sessions = [];

    for (const key of keys) {
      const session = await redis.hgetall(key);
      if (session && session.data) {
        const data = JSON.parse(session.data);
        if (data.userId === userId) {
          sessions.push({
            id: key.replace(REDIS_KEYS.SESSION, ''),
            ...data,
            createdAt: parseInt(session.createdAt),
            lastAccess: parseInt(session.lastAccess)
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    console.error('Get user sessions error:', error.message);
    return [];
  }
}

/**
 * Delete all sessions for a user
 * @param {string} userId - User ID
 */
export async function deleteUserSessions(userId) {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return inMemorySession.deleteUserSessions(userId);
  }
  
  try {
    const sessions = await getUserSessions(userId);
    
    for (const session of sessions) {
      await deleteSession(session.id);
    }

    return true;
  } catch (error) {
    console.error('Delete user sessions error:', error.message);
    return false;
  }
}

/**
 * Count active sessions
 */
export async function countActiveSessions() {
  // Use in-memory fallback if Redis is not connected
  if (!isRedisConnected()) {
    return 0;
  }
  
  try {
    const pattern = `${REDIS_KEYS.SESSION}*`;
    const keys = await redis.keys(pattern);
    return keys.length;
  } catch (error) {
    console.error('Count sessions error:', error.message);
    return 0;
  }
}

export default {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  extendSession,
  getUserSessions,
  deleteUserSessions,
  countActiveSessions
};
