import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db/index.js';
import { authenticate } from './middleware/auth.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import ticketsRouter from './routes/tickets.js';
import ratingsRouter from './routes/ratings.js';
import hireRequestsRouter from './routes/hireRequests.js';
import statsRouter from './routes/stats.js';
import paymentsRouter from './routes/payments.js';
import earningsRouter from './routes/earnings.js';
import crmRouter from './routes/crm.js';
import adminRouter from './routes/admin.js';
import discussionsRouter from './routes/discussions.js';
import categoriesRouter from './routes/categories.js';
import notificationsRouter from './routes/notifications.js';
import ticketHistoryRouter from './routes/ticketHistory.js';
import surveysRouter from './routes/surveys.js';
import chatbotRouter from './routes/chatbot.js';
import uploadsRouter from './routes/uploads.js';
import topicsRouter from './routes/topics.js';
import agentRequestsRouter from './routes/agentRequests.js';
import creditsRouter from './routes/credits.js';
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
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public API Routes (no authentication required)
app.use('/api/auth', authRouter);

// Protected API Routes (authentication required)
// Apply authenticate middleware to all protected routes
app.use('/api/users', authenticate, usersRouter);
app.use('/api/tickets', authenticate, ticketsRouter);
app.use('/api/ratings', authenticate, ratingsRouter);
app.use('/api/hire-requests', authenticate, hireRequestsRouter);
app.use('/api/stats', authenticate, statsRouter);
app.use('/api/payments', authenticate, paymentsRouter);
app.use('/api/earnings', authenticate, earningsRouter);
app.use('/api/crm', authenticate, crmRouter);
app.use('/api/admin', authenticate, adminRouter);
app.use('/api/discussions', authenticate, discussionsRouter);
app.use('/api/categories', authenticate, categoriesRouter);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/ticket-history', authenticate, ticketHistoryRouter);
app.use('/api/surveys', authenticate, surveysRouter);
app.use('/api/chatbot', authenticate, chatbotRouter);
app.use('/api/uploads', authenticate, uploadsRouter);
app.use('/api/topics', authenticate, topicsRouter);
app.use('/api/agents', authenticate, agentRequestsRouter);
app.use('/api/credits', authenticate, creditsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
