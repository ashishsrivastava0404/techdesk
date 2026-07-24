/**
 * Redis Fallback System Tests
 * 
 * Tests for the in-memory fallback system when Redis is unavailable.
 */

import { jest } from '@jest/globals';

// Mock the redis module before importing memoryFallback
jest.unstable_mockModule('../src/db/redis.js', () => ({
  isRedisConnected: jest.fn(() => false),
  default: { status: 'ready' },
  REDIS_KEYS: {
    SESSION: 'session:',
    RATE_LIMIT: 'ratelimit:',
    CACHE: 'cache:',
    REFRESH_TOKEN: 'refresh:',
    PASSWORD_RESET: 'reset:',
    VERIFICATION: 'verify:',
    OAUTH_STATE: 'oauth:'
  }
}));

// Import after mocking
const { 
  inMemoryCache, 
  inMemorySession, 
  inMemoryToken,
  getMemoryStats,
  clearAllMemoryStores
} = await import('../src/db/memoryFallback.js');

describe('In-Memory Cache Service', () => {
  beforeEach(() => {
    clearAllMemoryStores();
  });

  describe('setCache / getCache', () => {
    it('should store and retrieve string values', async () => {
      await inMemoryCache.set('key1', 'hello');
      const result = await inMemoryCache.get('key1');
      expect(result).toBe('hello');
    });

    it('should store and retrieve object values', async () => {
      const obj = { name: 'test', value: 123 };
      await inMemoryCache.set('key2', obj);
      const result = await inMemoryCache.get('key2');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent keys', async () => {
      const result = await inMemoryCache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire entries', async () => {
      jest.useFakeTimers();
      
      await inMemoryCache.set('expiring', 'value', 5); // 5 seconds
      
      // Should exist immediately
      const exists = await inMemoryCache.get('expiring');
      expect(exists).toBe('value');
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(6000);
      
      // Should be expired
      const expired = await inMemoryCache.get('expiring');
      expect(expired).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('deleteCache', () => {
    it('should delete existing keys', async () => {
      await inMemoryCache.set('deleteme', 'value');
      const deleted = await inMemoryCache.delete('deleteme');
      expect(deleted).toBe(true);
      
      const result = await inMemoryCache.get('deleteme');
      expect(result).toBeNull();
    });

    it('should return false for non-existent keys', async () => {
      const result = await inMemoryCache.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('hasCache', () => {
    it('should return true for existing keys', async () => {
      await inMemoryCache.set('exists', 'value');
      const result = await inMemoryCache.has('exists');
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const result = await inMemoryCache.has('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await inMemoryCache.set('key1', 'value1');
      await inMemoryCache.set('key2', 'value2');
      
      const cleared = await inMemoryCache.clear();
      expect(cleared).toBe(2);
      
      expect(await inMemoryCache.get('key1')).toBeNull();
      expect(await inMemoryCache.get('key2')).toBeNull();
    });
  });
});

describe('In-Memory Session Service', () => {
  beforeEach(() => {
    clearAllMemoryStores();
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const result = await inMemorySession.create('session1', { userId: 'user1' });
      expect(result).toBe(true);
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', async () => {
      await inMemorySession.create('session1', { userId: 'user1', role: 'admin' });
      const session = await inMemorySession.get('session1');
      expect(session).toEqual({ userId: 'user1', role: 'admin' });
    });

    it('should return null for non-existent session', async () => {
      const result = await inMemorySession.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should retrieve session data correctly', async () => {
      await inMemorySession.create('session1', { userId: 'user1', name: 'Test User' });
      const session = await inMemorySession.get('session1');
      expect(session.userId).toBe('user1');
      expect(session.name).toBe('Test User');
    });
  });

  describe('updateSession', () => {
    it('should update existing session', async () => {
      await inMemorySession.create('session1', { userId: 'user1', role: 'user' });
      const updated = await inMemorySession.update('session1', { userId: 'user1', role: 'admin' });
      expect(updated).toBe(true);
      
      const session = await inMemorySession.get('session1');
      expect(session.role).toBe('admin');
    });

    it('should return false for non-existent session', async () => {
      const result = await inMemorySession.update('nonexistent', { data: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', async () => {
      await inMemorySession.create('session1', { userId: 'user1' });
      const deleted = await inMemorySession.delete('session1');
      expect(deleted).toBe(true);
      
      const result = await inMemorySession.get('session1');
      expect(result).toBeNull();
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      await inMemorySession.create('session1', { userId: 'user1' });
      await inMemorySession.create('session2', { userId: 'user1' });
      await inMemorySession.create('session3', { userId: 'user2' });
      
      const count = await inMemorySession.deleteUserSessions('user1');
      expect(count).toBe(2);
      
      expect(await inMemorySession.get('session1')).toBeNull();
      expect(await inMemorySession.get('session2')).toBeNull();
      expect(await inMemorySession.get('session3')).not.toBeNull();
    });
  });
});

describe('In-Memory Token Service', () => {
  beforeEach(() => {
    clearAllMemoryStores();
  });

  describe('Refresh Tokens', () => {
    it('should create refresh token', async () => {
      const result = await inMemoryToken.createRefreshToken('user1');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.token).toBe('string');
    });

    it('should verify valid refresh token', async () => {
      const { token } = await inMemoryToken.createRefreshToken('user1');
      const verified = await inMemoryToken.verifyRefreshToken(token);
      expect(verified).toHaveProperty('userId', 'user1');
    });

    it('should return null for invalid token', async () => {
      const result = await inMemoryToken.verifyRefreshToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should revoke token', async () => {
      const { token } = await inMemoryToken.createRefreshToken('user1');
      const revoked = await inMemoryToken.revokeRefreshToken(token);
      expect(revoked).toBe(true);
      
      const verified = await inMemoryToken.verifyRefreshToken(token);
      expect(verified).toBeNull();
    });
  });

  describe('Password Reset Tokens', () => {
    it('should create password reset token', async () => {
      const result = await inMemoryToken.createPasswordResetToken('test@example.com');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('/reset-password?token=');
    });

    it('should verify password reset token', async () => {
      const { token } = await inMemoryToken.createPasswordResetToken('test@example.com');
      const verified = await inMemoryToken.verifyPasswordResetToken(token);
      expect(verified).toHaveProperty('email', 'test@example.com');
    });

    it('should consume token once', async () => {
      const { token } = await inMemoryToken.createPasswordResetToken('test@example.com');
      
      const consumed = await inMemoryToken.consumePasswordResetToken(token);
      expect(consumed).toHaveProperty('email', 'test@example.com');
      
      // Token should be consumed and no longer valid
      const secondAttempt = await inMemoryToken.consumePasswordResetToken(token);
      expect(secondAttempt).toBeNull();
    });
  });

  describe('OAuth State Tokens', () => {
    it('should create OAuth state', async () => {
      const state = await inMemoryToken.createOAuthState();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should verify and consume OAuth state', async () => {
      const state = await inMemoryToken.createOAuthState();
      const verified = await inMemoryToken.verifyOAuthState(state);
      expect(verified).toBe(true);
      
      // State should be consumed
      const secondAttempt = await inMemoryToken.verifyOAuthState(state);
      expect(secondAttempt).toBe(false);
    });
  });
});

describe('Memory Store Statistics', () => {
  beforeEach(() => {
    clearAllMemoryStores();
  });

  it('should return correct counts', async () => {
    // Add some data
    await inMemoryCache.set('cache1', 'value');
    await inMemoryCache.set('cache2', 'value');
    await inMemorySession.create('session1', { userId: 'user1' });
    await inMemoryToken.createRefreshToken('user1');
    
    const stats = getMemoryStats();
    expect(stats).toHaveProperty('cache', 2);
    expect(stats).toHaveProperty('sessions', 1);
    expect(stats).toHaveProperty('tokens', 1);
  });

  it('should clear all stores', async () => {
    await inMemoryCache.set('cache1', 'value');
    await inMemorySession.create('session1', { userId: 'user1' });
    await inMemoryToken.createRefreshToken('user1');
    
    clearAllMemoryStores();
    
    const stats = getMemoryStats();
    expect(stats.cache).toBe(0);
    expect(stats.sessions).toBe(0);
    expect(stats.tokens).toBe(0);
  });
});
