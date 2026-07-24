# Promote — Redis Integration Guide

## Overview

Promote implements Redis for distributed caching, session management, rate limiting, and token storage. Redis enables horizontal scaling by providing shared state across multiple server instances.

## ⚡ Fallback Mode

When Redis is unavailable (disabled or connection fails), the application automatically falls back to in-memory storage. This ensures zero downtime and graceful degradation.

### Configuration
```bash
# Disable Redis (use in-memory fallback)
REDIS_ENABLED=false
```

### Fallback Features
| Feature | Fallback Status |
|---------|----------------|
| Rate Limiting | ✅ Full support |
| Session Storage | ✅ Full support |
| API Caching | ✅ Full support |
| Token Storage | ✅ Full support |
| Pattern Deletion | ⚠️ Limited |
| Cache Stats | ✅ Supported |

### How It Works
1. On startup, if `REDIS_ENABLED=false`, logs show fallback mode
2. In-memory stores are initialized with automatic cleanup
3. All services check `isRedisConnected()` and route accordingly
4. Cleanup timer runs every 5 minutes to remove expired entries

## Features Implemented

| Feature | Description | Module |
|---------|-------------|--------|
| **Connection Management** | Redis client with reconnection handling | `src/db/redis.js` |
| **In-Memory Fallback** | Graceful degradation when Redis unavailable | `src/db/memoryFallback.js` |
| **Rate Limiting** | Distributed rate limiting with multiple strategies | `src/middleware/redisRateLimiter.js` |
| **Session Management** | User session storage and management | `src/services/redisSession.js` |
| **Caching** | API response caching with TTL | `src/services/redisCache.js` |
| **Token Storage** | Refresh tokens, password reset, OAuth states | `src/services/redisToken.js` |

---

## Configuration

### Environment Variables

```bash
# Enable/disable Redis
REDIS_ENABLED=true

# Connection settings
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Docker (Optional)

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

---

## Connection Module

### Location
`backend/src/db/redis.js`

### Features
- Automatic reconnection
- Lazy connection (connect only when needed)
- Event handlers for monitoring
- Key prefix organization

### Usage

```javascript
import redis, { connectRedis, isRedisConnected, REDIS_KEYS } from '../db/redis.js';

// Connect (called automatically on server start)
await connectRedis();

// Check connection status
if (isRedisConnected()) {
  console.log('Redis is ready');
}

// Use Redis directly
await redis.set('key', 'value');
const value = await redis.get('key');

// Use key prefixes for organization
const key = `${REDIS_KEYS.CACHE}user:123`;
```

### Key Prefixes

| Prefix | Purpose |
|--------|---------|
| `session:` | User sessions |
| `ratelimit:` | Rate limiting counters |
| `cache:` | API response cache |
| `refresh:` | Refresh tokens |
| `reset:` | Password reset tokens |
| `verify:` | Email verification tokens |
| `oauth:` | OAuth state tokens |
| `active:` | Active user tracking |
| `leaderboard:` | Cached leaderboard data |
| `notif:` | Notification queues |

---

## Rate Limiting

### Location
`backend/src/middleware/redisRateLimiter.js`

### Strategies

#### 1. Fixed Window Rate Limiter
```javascript
import { createRedisRateLimiter } from '../middleware/redisRateLimiter.js';

// 100 requests per 15 minutes
const apiLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'ratelimit:api:'
});

// 5 login attempts per 15 minutes
const authLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'ratelimit:auth:'
});
```

#### 2. Sliding Window Rate Limiter
More accurate rate limiting with smoother window transitions.

```javascript
import { createSlidingWindowLimiter } from '../middleware/redisRateLimiter.js';

const paymentLimiter = createSlidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: 'ratelimit:payment:'
});
```

#### 3. Token Bucket Rate Limiter
Allows bursts while maintaining average rate.

```javascript
import { createTokenBucketLimiter } from '../middleware/redisRateLimiter.js';

const bucketLimiter = createTokenBucketLimiter({
  bucketSize: 100,    // Max tokens
  refillRate: 10,     // Tokens per second
  keyPrefix: 'ratelimit:bucket:'
});
```

### Pre-configured Limiters

```javascript
import { 
  redisApiLimiter,
  redisAuthLimiter,
  redisPasswordResetLimiter,
  redisRegistrationLimiter,
  redisPaymentLimiter
} from '../middleware/redisRateLimiter.js';

// Apply to routes
app.use('/api/auth', redisAuthLimiter, authRouter);
app.use('/api/payments', redisPaymentLimiter, paymentsRouter);
```

### Response Headers

All rate limiters add these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625123456
```

### Error Response (429)

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": "15 minutes"
}
```

---

## Session Management

### Location
`backend/src/services/redisSession.js`

### Functions

```javascript
import SessionService from '../services/redisSession.js';

// Create session
await SessionService.createSession('session-123', {
  userId: 'user-456',
  role: 'customer',
  email: 'user@example.com'
}, 86400); // TTL: 24 hours

// Get session
const session = await SessionService.getSession('session-123');

// Update session
await SessionService.updateSession('session-123', {
  userId: 'user-456',
  role: 'admin',  // Updated role
  lastActivity: Date.now()
});

// Delete session
await SessionService.deleteSession('session-123');

// Extend TTL
await SessionService.extendSession('session-123', 86400);

// Get all user sessions
const sessions = await SessionService.getUserSessions('user-456');

// Delete all user sessions (logout everywhere)
await SessionService.deleteUserSessions('user-456');

// Count active sessions
const count = await SessionService.countActiveSessions();
```

---

## Caching Service

### Location
`backend/src/services/redisCache.js`

### Basic Operations

```javascript
import CacheService, { CacheKeys } from '../services/redisCache.js';

// Set cache with TTL (default: 5 minutes)
await CacheService.setCache('user:123', userData, 300);

// Get cache
const cached = await CacheService.getCache('user:123');
if (cached) {
  return cached; // Cache hit
}

// Delete cache
await CacheService.deleteCache('user:123');

// Check if key exists
const exists = await CacheService.hasCache('user:123');

// Get remaining TTL
const ttl = await CacheService.getCacheTTL('user:123');
```

### Cache Key Builders

```javascript
import { CacheKeys } from '../services/redisCache.js';

// Pre-defined key patterns
const userKey = CacheKeys.user('123');
const ticketKey = CacheKeys.ticket('456');
const leaderboardKey = CacheKeys.leaderboard('monthly');
const statsKey = CacheKeys.stats('daily');
```

### Pattern-based Deletion

```javascript
// Delete all user-related cache
await CacheService.deleteCachePattern('user:*');

// Delete expired leaderboard cache
await CacheService.deleteCachePattern('leaderboard:2024*');
```

### Atomic Operations

```javascript
// Increment counter
await CacheService.incrementCache('page_views:home');
const views = await CacheService.incrementCache('page_views:home', 5);

// Decrement counter
await CacheService.decrementCache('available_slots');
```

### Cached Function Wrapper

```javascript
// Wrap function with caching
const { data, fromCache } = await CacheService.withCache(
  async () => getExpensiveData(),
  'expensive:data:key',
  300 // TTL: 5 minutes
);

if (fromCache) {
  console.log('Served from cache');
}
```

### Cache Statistics

```javascript
const stats = await CacheService.getCacheStats();
console.log(stats);
// { totalKeys: 150, estimatedSize: 2048000, sampleSize: 100 }

// Clear all cache
const deleted = await CacheService.clearAllCache();
```

---

## Token Service

### Location
`backend/src/services/redisToken.js`

### Refresh Tokens

```javascript
import TokenService from '../services/redisToken.js';

// Create refresh token
const { token, expiresIn } = await TokenService.createRefreshToken(
  'user-123',
  { device: 'mobile', ip: '192.168.1.1' },
  604800 // 7 days
);

// Verify token
const tokenData = await TokenService.verifyRefreshToken(token);
if (!tokenData) {
  // Invalid/expired token
}

// Revoke single token
await TokenService.revokeRefreshToken(token);

// Revoke all user tokens
const count = await TokenService.revokeAllUserTokens('user-123');

// Count user tokens (sessions)
const sessionCount = await TokenService.countUserTokens('user-123');
```

### Password Reset Tokens

```javascript
// Create reset token
const { token, expiresIn, url } = await TokenService.createPasswordResetToken(
  'user@example.com',
  3600 // 1 hour
);

// Verify token (before consuming)
const resetData = await TokenService.verifyPasswordResetToken(token);

// Consume token (one-time use)
const consumed = await TokenService.consumePasswordResetToken(token);
if (consumed) {
  // Proceed with password reset
}
```

### Email Verification Tokens

```javascript
// Create verification token
const { token, expiresIn } = await TokenService.createVerificationToken(
  'user-123',
  'user@example.com',
  86400 // 24 hours
);

// Verify and consume
const verified = await TokenService.consumeVerificationToken(token);
if (verified) {
  // Email verified, activate account
}
```

### OAuth State Tokens

```javascript
// Create state (for CSRF protection)
const state = await TokenService.createOAuthState(600); // 10 minutes

// Verify and consume (one-time use)
const isValid = await TokenService.verifyOAuthState(state);
if (!isValid) {
  // Invalid/reused state - possible CSRF attack
}
```

---

## Integration Examples

### Protected Route with Session

```javascript
import SessionService from '../services/redisSession.js';
import CacheService from '../services/redisCache.js';

router.get('/profile', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  // Verify session
  const session = await SessionService.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check cache
  const cacheKey = CacheKeys.userProfile(session.userId);
  const cached = await CacheService.getCache(cacheKey);
  if (cached) {
    return res.json({ data: cached, fromCache: true });
  }
  
  // Fetch from DB
  const profile = await getUserProfile(session.userId);
  
  // Cache result
  await CacheService.setCache(cacheKey, profile, 300);
  
  res.json({ data: profile, fromCache: false });
});
```

### Login with Rate Limiting & Token Storage

```javascript
import { redisAuthLimiter } from '../middleware/redisRateLimiter.js';
import TokenService from '../services/redisToken.js';
import SessionService from '../services/redisSession.js';

router.post('/login', redisAuthLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate user
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create refresh token
  const { token } = await TokenService.createRefreshToken(user.id, {
    email: user.email
  });
  
  // Create session
  await SessionService.createSession(token, {
    userId: user.id,
    role: user.role
  });
  
  // Respond (don't count successful requests - auth limiter config)
  res.json({ token, user });
});
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "redis": "connected"
}
```

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Monitor all commands
MONITOR

# Check memory usage
INFO memory

# List all keys
KEYS *

# Count keys by pattern
DBSIZE
KEYS session:*
KEYS ratelimit:*

# Delete by pattern
FLUSHDB  # Clear all
```

---

## Troubleshooting

### Redis Connection Issues

1. **Connection refused**: Check if Redis is running
   ```bash
   redis-server --daemonize yes
   ```

2. **Authentication failed**: Verify password in `REDIS_PASSWORD`

3. **Out of memory**: Configure maxmemory in redis.conf
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

### Performance Issues

1. **High latency**: Use pipeline for batch operations
   ```javascript
   const pipeline = redis.pipeline();
   keys.forEach(key => pipeline.get(key));
   const results = await pipeline.exec();
   ```

2. **Memory growing**: Set appropriate TTLs
   ```javascript
   await redis.expire(key, 3600);
   ```

### Fallback Behavior

The app continues to work without Redis:
- Rate limiting falls back to in-memory (per-instance)
- Sessions use in-memory fallback store
- Cache uses in-memory fallback store
- Token storage uses in-memory fallback store

### Monitoring Fallback Mode

Check logs on startup:
```
🟡 Redis: Disabled via REDIS_ENABLED=false
🟡 Using in-memory fallback for rate limiting, caching, and sessions
```

Check health endpoint:
```bash
curl http://localhost:3001/api/health
# {"status":"ok","redis":"disconnected"}
```

---

## Redis Commands Reference

| Command | Usage |
|---------|-------|
| `SET key value EX seconds` | Set with expiry |
| `GET key` | Get value |
| `DEL key` | Delete key |
| `EXISTS key` | Check key exists |
| `EXPIRE key seconds` | Set TTL |
| `TTL key` | Get remaining TTL |
| `KEYS pattern` | Pattern matching |
| `ZADD key score member` | Add to sorted set |
| `ZREMRANGEBYSCORE` | Remove by score range |
| `ZCARD key` | Count sorted set |
| `HMSET key field value...` | Hash set |
| `HGETALL key` | Get all hash fields |
| `INCR key` | Increment |
| `MULTI/EXEC` | Transaction |

---

## Best Practices

1. **Use key prefixes** for organization
2. **Set appropriate TTLs** to prevent memory bloat
3. **Handle connection failures** gracefully
4. **Use pipelines** for batch operations
5. **Monitor memory usage** with `INFO memory`
6. **Use Lua scripts** for atomic operations
7. **Configure persistence** for production (AOF/RDB)
