import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/index.js';
import usersRouter from './routes/users.js';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/hire-requests', hireRequestsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/earnings', earningsRouter);
app.use('/api/crm', crmRouter);
app.use('/api/admin', adminRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ticket-history', ticketHistoryRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api/chatbot', chatbotRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
