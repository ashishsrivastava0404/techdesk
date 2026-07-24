/**
 * Redis Token Service
 * 
 * Manages refresh tokens and password reset tokens using Redis.
 */

import redis, { REDIS_KEYS } from '../db/redis.js';
import crypto from 'crypto';

/**
 * Generate a secure token
 * @param {number} length - Token length in bytes
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a refresh token
 * @param {string} userId - User ID
 * @param {Object} metadata - Additional token metadata
 * @param {number} ttl - Time to live in seconds (7 days default)
 */
export async function createRefreshToken(userId, metadata = {}, ttl = 604800) {
  try {
    const token = generateToken();
    const tokenKey = `${REDIS_KEYS.REFRESH_TOKEN}${token}`;
    
    const tokenData = {
      userId,
      createdAt: Date.now(),
      ...metadata
    };

    await redis.hmset(tokenKey, tokenData);
    await redis.expire(tokenKey, ttl);

    return {
      token,
      expiresIn: ttl
    };
  } catch (error) {
    console.error('Create refresh token error:', error.message);
    return null;
  }
}

/**
 * Verify and get refresh token data
 * @param {string} token - Refresh token
 */
export async function verifyRefreshToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.REFRESH_TOKEN}${token}`;
    const data = await redis.hgetall(tokenKey);

    if (!data || !data.userId) {
      return null;
    }

    return {
      userId: data.userId,
      createdAt: parseInt(data.createdAt)
    };
  } catch (error) {
    console.error('Verify refresh token error:', error.message);
    return null;
  }
}

/**
 * Revoke refresh token
 * @param {string} token - Refresh token
 */
export async function revokeRefreshToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.REFRESH_TOKEN}${token}`;
    await redis.del(tokenKey);
    return true;
  } catch (error) {
    console.error('Revoke refresh token error:', error.message);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 * Note: This is expensive - consider using token families instead
 * @param {string} userId - User ID
 */
export async function revokeAllUserTokens(userId) {
  try {
    const pattern = `${REDIS_KEYS.REFRESH_TOKEN}*`;
    const keys = await redis.keys(pattern);
    
    let revokedCount = 0;
    for (const key of keys) {
      const tokenData = await redis.hgetall(key);
      if (tokenData && tokenData.userId === userId) {
        await redis.del(key);
        revokedCount++;
      }
    }

    return revokedCount;
  } catch (error) {
    console.error('Revoke all user tokens error:', error.message);
    return 0;
  }
}

/**
 * Count active refresh tokens for a user
 * @param {string} userId - User ID
 */
export async function countUserTokens(userId) {
  try {
    const pattern = `${REDIS_KEYS.REFRESH_TOKEN}*`;
    const keys = await redis.keys(pattern);
    
    let count = 0;
    for (const key of keys) {
      const tokenData = await redis.hgetall(key);
      if (tokenData && tokenData.userId === userId) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error('Count user tokens error:', error.message);
    return 0;
  }
}

/**
 * Create password reset token
 * @param {string} email - User email
 * @param {number} ttl - Time to live in seconds (1 hour default)
 */
export async function createPasswordResetToken(email, ttl = 3600) {
  try {
    const token = generateToken(32);
    const tokenKey = `${REDIS_KEYS.PASSWORD_RESET}${token}`;
    
    const tokenData = {
      email,
      createdAt: Date.now()
    };

    await redis.hmset(tokenKey, tokenData);
    await redis.expire(tokenKey, ttl);

    return {
      token,
      expiresIn: ttl,
      url: `/reset-password?token=${token}`
    };
  } catch (error) {
    console.error('Create password reset token error:', error.message);
    return null;
  }
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 */
export async function verifyPasswordResetToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.PASSWORD_RESET}${token}`;
    const data = await redis.hgetall(tokenKey);

    if (!data || !data.email) {
      return null;
    }

    return {
      email: data.email,
      createdAt: parseInt(data.createdAt)
    };
  } catch (error) {
    console.error('Verify password reset token error:', error.message);
    return null;
  }
}

/**
 * Consume password reset token (one-time use)
 * @param {string} token - Reset token
 */
export async function consumePasswordResetToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.PASSWORD_RESET}${token}`;
    const data = await redis.hgetall(tokenKey);

    if (!data || !data.email) {
      return null;
    }

    // Delete token immediately (one-time use)
    await redis.del(tokenKey);

    return {
      email: data.email,
      createdAt: parseInt(data.createdAt)
    };
  } catch (error) {
    console.error('Consume password reset token error:', error.message);
    return null;
  }
}

/**
 * Create email verification token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {number} ttl - Time to live in seconds (24 hours default)
 */
export async function createVerificationToken(userId, email, ttl = 86400) {
  try {
    const token = generateToken(48);
    const tokenKey = `${REDIS_KEYS.VERIFICATION}${token}`;
    
    const tokenData = {
      userId,
      email,
      createdAt: Date.now()
    };

    await redis.hmset(tokenKey, tokenData);
    await redis.expire(tokenKey, ttl);

    return {
      token,
      expiresIn: ttl
    };
  } catch (error) {
    console.error('Create verification token error:', error.message);
    return null;
  }
}

/**
 * Verify email verification token
 * @param {string} token - Verification token
 */
export async function verifyVerificationToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.VERIFICATION}${token}`;
    const data = await redis.hgetall(tokenKey);

    if (!data || !data.userId) {
      return null;
    }

    return {
      userId: data.userId,
      email: data.email,
      createdAt: parseInt(data.createdAt)
    };
  } catch (error) {
    console.error('Verify verification token error:', error.message);
    return null;
  }
}

/**
 * Consume verification token
 * @param {string} token - Verification token
 */
export async function consumeVerificationToken(token) {
  try {
    const tokenKey = `${REDIS_KEYS.VERIFICATION}${token}`;
    const data = await redis.hgetall(tokenKey);

    if (!data || !data.userId) {
      return null;
    }

    // Delete token immediately
    await redis.del(tokenKey);

    return {
      userId: data.userId,
      email: data.email
    };
  } catch (error) {
    console.error('Consume verification token error:', error.message);
    return null;
  }
}

/**
 * Create OAuth state token (CSRF protection)
 * @param {number} ttl - Time to live in seconds (10 minutes)
 */
export async function createOAuthState(ttl = 600) {
  try {
    const state = generateToken(32);
    const stateKey = `${REDIS_KEYS.OAUTH_STATE}${state}`;
    
    await redis.setex(stateKey, ttl, Date.now().toString());
    
    return state;
  } catch (error) {
    console.error('Create OAuth state error:', error.message);
    return null;
  }
}

/**
 * Verify OAuth state token
 * @param {string} state - OAuth state
 */
export async function verifyOAuthState(state) {
  try {
    const stateKey = `${REDIS_KEYS.OAUTH_STATE}${state}`;
    const exists = await redis.exists(stateKey);
    
    if (!exists) {
      return false;
    }

    // Delete immediately (one-time use)
    await redis.del(stateKey);
    return true;
  } catch (error) {
    console.error('Verify OAuth state error:', error.message);
    return false;
  }
}

export default {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  countUserTokens,
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
  createVerificationToken,
  verifyVerificationToken,
  consumeVerificationToken,
  createOAuthState,
  verifyOAuthState
};
