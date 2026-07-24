/**
 * In-Memory Fallback Implementations
 * 
 * Provides in-memory alternatives when Redis is unavailable.
 */

import { isRedisConnected } from './redis.js';

// In-memory storage for fallback
const memoryStore = {
  cache: new Map(),
  sessions: new Map(),
  rateLimit: new Map(),
  tokens: new Map()
};

// Cache cleanup interval (every 5 minutes)
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer = null;

/**
 * Start cleanup timer for expired cache entries
 */
export function startCleanupTimer() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    
    // Clean up cache
    for (const [key, entry] of memoryStore.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        memoryStore.cache.delete(key);
      }
    }
    
    // Clean up rate limit entries
    for (const [key, entry] of memoryStore.rateLimit.entries()) {
      if (entry.windowStart + entry.windowMs < now) {
        memoryStore.rateLimit.delete(key);
      }
    }
    
    // Clean up expired tokens
    for (const [key, entry] of memoryStore.tokens.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        memoryStore.tokens.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);
}

/**
 * Stop cleanup timer
 */
export function stopCleanupTimer() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// ============================================================================
// In-Memory Rate Limiter Fallback
// ============================================================================

const rateLimitStore = new Map();

export function createInMemoryRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyGenerator = (req) => req.ip
  } = options;

  return (req, res, next) => {
    // Skip if Redis is connected (use Redis version)
    if (isRedisConnected()) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimitStore.get(key);

    if (!record || record.windowStart < windowStart) {
      // New window
      record = {
        count: 1,
        windowStart: now
      };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.windowStart + windowMs) / 1000));

    if (record.count > max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.'
      });
    }

    next();
  };
}

// ============================================================================
// In-Memory Session Store Fallback
// ============================================================================

const sessionStore = new Map();

export const inMemorySession = {
  async create(sessionId, data, ttl = 86400) {
    if (isRedisConnected()) return false; // Use Redis instead
    
    sessionStore.set(sessionId, {
      data,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    });
    return true;
  },

  async get(sessionId, updateAccess = true) {
    if (isRedisConnected()) return null;
    
    const session = sessionStore.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt && session.expiresAt < Date.now()) {
      sessionStore.delete(sessionId);
      return null;
    }
    
    if (updateAccess) {
      session.lastAccess = Date.now();
    }
    
    return session.data;
  },

  async update(sessionId, data) {
    if (isRedisConnected()) return false;
    
    const session = sessionStore.get(sessionId);
    if (!session) return false;
    
    session.data = data;
    session.lastAccess = Date.now();
    return true;
  },

  async delete(sessionId) {
    if (isRedisConnected()) return false;
    return sessionStore.delete(sessionId);
  },

  async extend(sessionId, ttl = 86400) {
    if (isRedisConnected()) return false;
    
    const session = sessionStore.get(sessionId);
    if (!session) return false;
    
    session.expiresAt = Date.now() + (ttl * 1000);
    return true;
  },

  async deleteUserSessions(userId) {
    if (isRedisConnected()) return false;
    
    let count = 0;
    for (const [id, session] of sessionStore.entries()) {
      if (session.data?.userId === userId) {
        sessionStore.delete(id);
        count++;
      }
    }
    return count;
  }
};

// ============================================================================
// In-Memory Cache Fallback
// ============================================================================

const cacheStore = new Map();

export const inMemoryCache = {
  async set(key, value, ttl = 300) {
    if (isRedisConnected()) return false;
    
    cacheStore.set(key, {
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      expiresAt: Date.now() + (ttl * 1000)
    });
    return true;
  },

  async get(key) {
    if (isRedisConnected()) return null;
    
    const entry = cacheStore.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      cacheStore.delete(key);
      return null;
    }
    
    try {
      return JSON.parse(entry.value);
    } catch {
      return entry.value;
    }
  },

  async delete(key) {
    if (isRedisConnected()) return false;
    return cacheStore.delete(key);
  },

  async has(key) {
    if (isRedisConnected()) return false;
    return cacheStore.has(key);
  },

  async clear() {
    if (isRedisConnected()) return 0;
    const size = cacheStore.size;
    cacheStore.clear();
    return size;
  }
};

// ============================================================================
// In-Memory Token Store Fallback
// ============================================================================

const tokenStore = new Map();

export const inMemoryToken = {
  async createRefreshToken(userId, ttl = 604800) {
    if (isRedisConnected()) return null;
    
    const token = generateToken();
    tokenStore.set(token, {
      type: 'refresh',
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    return { token, expiresIn: ttl };
  },

  async verifyRefreshToken(token) {
    if (isRedisConnected()) return null;
    
    const entry = tokenStore.get(token);
    if (!entry || entry.type !== 'refresh') return null;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      tokenStore.delete(token);
      return null;
    }
    
    return { userId: entry.userId, createdAt: entry.createdAt };
  },

  async revokeRefreshToken(token) {
    if (isRedisConnected()) return false;
    return tokenStore.delete(token);
  },

  async createPasswordResetToken(email, ttl = 3600) {
    if (isRedisConnected()) return null;
    
    const token = generateToken();
    tokenStore.set(token, {
      type: 'reset',
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    return { token, expiresIn: ttl, url: `/reset-password?token=${token}` };
  },

  async verifyPasswordResetToken(token) {
    if (isRedisConnected()) return null;
    
    const entry = tokenStore.get(token);
    if (!entry || entry.type !== 'reset') return null;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      tokenStore.delete(token);
      return null;
    }
    
    return { email: entry.email, createdAt: entry.createdAt };
  },

  async consumePasswordResetToken(token) {
    if (isRedisConnected()) return null;
    
    const entry = tokenStore.get(token);
    if (!entry || entry.type !== 'reset') return null;
    
    tokenStore.delete(token);
    return { email: entry.email, createdAt: entry.createdAt };
  },

  async createOAuthState(ttl = 600) {
    if (isRedisConnected()) return null;
    
    const state = generateToken();
    tokenStore.set(state, {
      type: 'oauth',
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    return state;
  },

  async verifyOAuthState(state) {
    if (isRedisConnected()) return false;
    
    const entry = tokenStore.get(state);
    if (!entry || entry.type !== 'oauth') return false;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      tokenStore.delete(state);
      return false;
    }
    
    tokenStore.delete(state);
    return true;
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get in-memory store statistics
 */
export function getMemoryStats() {
  return {
    sessions: sessionStore.size,
    cache: cacheStore.size,
    rateLimit: rateLimitStore.size,
    tokens: tokenStore.size
  };
}

/**
 * Clear all in-memory stores
 */
export function clearAllMemoryStores() {
  sessionStore.clear();
  cacheStore.clear();
  rateLimitStore.clear();
  tokenStore.clear();
}

export default {
  startCleanupTimer,
  stopCleanupTimer,
  createInMemoryRateLimiter,
  inMemorySession,
  inMemoryCache,
  inMemoryToken,
  getMemoryStats,
  clearAllMemoryStores
};
