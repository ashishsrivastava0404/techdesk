import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db/index.js';
import { connectRedis, isRedisConnected } from './db/redis.js';
import { startCleanupTimer } from './db/memoryFallback.js';
import { loadApiKeysFromDatabase } from './services/settingsLoader.js';
import { authenticate, optionalAuth } from './middleware/auth.js';
import { apiLimiter, authLimiter, paymentLimiter } from './middleware/rateLimiter.js';

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '➡️' : '✅';
    if (DEBUG || res.statusCode >= 400) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms ${statusColor}`);
    }
  });
  next();
};
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import ticketsRouter from './routes/tickets.js';
import ticketCommentsRouter from './routes/ticketComments.js';
import ratingsRouter from './routes/ratings.js';
import hireRequestsRouter from './routes/hireRequests.js';
import statsRouter from './routes/stats.js';
import paymentsRouter from './routes/payments.js';
import earningsRouter from './routes/earnings.js';
import crmRouter from './routes/crm.js';
import supportReportsRouter from './routes/supportReports.js';
import adminRouter from './routes/admin.js';
import discussionsRouter from './routes/discussions.js';
import categoriesRouter from './routes/categories.js';
import ticketHierarchyRouter from './routes/ticketHierarchy.js';
import notificationsRouter from './routes/notifications.js';
import ticketHistoryRouter from './routes/ticketHistory.js';
import surveysRouter from './routes/surveys.js';
import chatbotRouter from './routes/chatbot.js';
import uploadsRouter from './routes/uploads.js';
import topicsRouter from './routes/topics.js';
import agentRequestsRouter from './routes/agentRequests.js';
import creditsRouter from './routes/credits.js';
import expertRouter from './routes/expert.js';
import attachmentsRouter from './routes/attachments.js';
import searchRouter from './routes/search.js';
import currencyRouter from './routes/currency.js';
import i18nRouter from './routes/i18n.js';
import { errorHandler } from './middleware/errorHandler.js';

// Initialize Sentry if configured
if (process.env.SENTRY_DSN) {
  import('./services/sentry.js').then(({ initSentry, sentryMiddleware }) => {
    initSentry(app);
    app.use(sentryMiddleware);
  }).catch(() => {});
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public API Routes (no authentication required)
// Apply general API rate limiter to public routes
app.use('/api/auth', apiLimiter, authRouter);

// Protected API Routes (authentication required)
// Apply authenticate middleware + rate limiter to all protected routes
app.use('/api/users', authenticate, usersRouter);
app.use('/api/tickets', authenticate, ticketCommentsRouter);
app.use('/api/tickets', authenticate, apiLimiter, ticketsRouter);
app.use('/api/ratings', authenticate, apiLimiter, ratingsRouter);
app.use('/api/hire-requests', authenticate, apiLimiter, hireRequestsRouter);
app.use('/api/stats', authenticate, statsRouter);
app.use('/api/payments', authenticate, paymentLimiter, paymentsRouter);
app.use('/api/earnings', authenticate, apiLimiter, earningsRouter);
app.use('/api/crm', authenticate, apiLimiter, crmRouter);
app.use('/api/admin', authenticate, apiLimiter, adminRouter);
app.use('/api/discussions', authenticate, apiLimiter, discussionsRouter);
app.use('/api/categories', authenticate, categoriesRouter);
app.use('/api/ticket-hierarchy', ticketHierarchyRouter);  // Public - cached, no auth needed
app.use('/api/notifications', authenticate, apiLimiter, notificationsRouter);
app.use('/api/ticket-history', authenticate, ticketHistoryRouter);
app.use('/api/surveys', authenticate, apiLimiter, surveysRouter);
app.use('/api/chatbot', apiLimiter, chatbotRouter);
app.use('/api/support-reports', supportReportsRouter);  // Public - anyone can submit reports
app.use('/api/uploads', authenticate, apiLimiter, uploadsRouter);
app.use('/api/topics', optionalAuth, apiLimiter, topicsRouter);
app.use('/api/agents', authenticate, apiLimiter, agentRequestsRouter);
app.use('/api/credits', authenticate, apiLimiter, creditsRouter);
app.use('/api/expert', expertRouter);  // Expert profile & skills routes (auth handled in route)
app.use('/api/attachments', authenticate, apiLimiter, attachmentsRouter);
app.use('/api/search', searchRouter);  // Search & filters (auth handled per endpoint)
app.use('/api/currency', currencyRouter);  // Currency conversion and formatting
app.use('/api/i18n', i18nRouter);  // Internationalization and translations

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    redis: isRedisConnected() ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function start() {
  try {
    await initDatabase();
    
    // Load API keys from database into environment
    await loadApiKeysFromDatabase();
    
    // Connect to Redis (non-blocking - app works without it)
    if (process.env.REDIS_ENABLED !== 'false') {
      await connectRedis();
      console.log('🟢 Redis: Connected');
    } else {
      console.log('🟡 Redis: Disabled via REDIS_ENABLED=false');
      console.log('🟡 Using in-memory fallback for rate limiting, caching, and sessions');
      startCleanupTimer();
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
