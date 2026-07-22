# Promote — CLI Prompts & User Flows

## Table of Contents

1. [Development Commands](#development-commands)
2. [Database Operations](#database-operations)
3. [API Testing](#api-testing)
4. [Deployment](#deployment)
5. [Common User Flows](#common-user-flows)
6. [Troubleshooting](#troubleshooting)

---

## Development Commands

### Backend Commands

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run with custom port
PORT=8080 npm start
```

### Frontend Commands

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Commands

```bash
# Connect to MariaDB
mysql -u root promote

# Show all tables
SHOW TABLES;

# Describe a table
DESCRIBE tickets;

# View recent entries
SELECT * FROM tickets ORDER BY created_at DESC LIMIT 10;

# Reset database (from backend folder)
npm run db:reset

# Initialize database
npm run db:init
```

---

## Database Operations

### Create Database

```sql
CREATE DATABASE IF NOT EXISTS promote;
USE promote;
```

### Drop and Recreate

```bash
mysql -u root -e "DROP DATABASE IF EXISTS promote;"
# Then restart backend
```

### View Records

```sql
-- All users
SELECT * FROM users;

-- Active tickets
SELECT * FROM tickets WHERE status IN ('open', 'claimed', 'in_progress');

-- Recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 20;

-- Pending payouts
SELECT * FROM tech_payouts WHERE status = 'requested';
```

### Update Records

```sql
-- Update user role
UPDATE users SET role = 'admin' WHERE name = 'username';

-- Suspend user
UPDATE users SET status = 'suspended' WHERE name = 'username';

-- Reset ticket status
UPDATE tickets SET status = 'open', tech_name = NULL WHERE id = 1;
```

### Delete Records

```sql
-- Delete ticket (cascades to messages/history)
DELETE FROM tickets WHERE id = 1;

-- Clear notifications
DELETE FROM notifications WHERE user_name = 'username';
```

---

## API Testing

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Users API

```bash
# Get or create user
curl http://localhost:3001/api/users/testuser1

# List all users
curl http://localhost:3001/api/users

# Update user
curl -X PATCH http://localhost:3001/api/users/testuser1 \
  -H "Content-Type: application/json" \
  -d '{"role": "tech", "hourly_rate": 75}'
```

### Tickets API

```bash
# List all tickets
curl http://localhost:3001/api/tickets

# List open tickets
curl "http://localhost:3001/api/tickets?status=open"

# Get single ticket
curl http://localhost:3001/api/tickets/1

# Create ticket
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database timeout issue",
    "description": "Production DB connecting timing out",
    "environment": "staging",
    "priority": "high",
    "customer_name": "testuser1",
    "category": "Bug Report",
    "tags": ["database", "urgent"]
  }'

# Claim ticket
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "claimed", "tech_name": "techuser1"}'

# Resolve ticket
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

### Discussions API

```bash
# Get messages
curl "http://localhost:3001/api/discussions/1?user_name=testuser1&user_role=customer"

# Send message
curl -X POST http://localhost:3001/api/discussions \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "sender_name": "testuser1",
    "sender_role": "customer",
    "content": "Any update on this?"
  }'
```

### Payments API

```bash
# Create payment
curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "customer_name": "testuser1",
    "tech_name": "techuser1",
    "amount": 100
  }'

# Release payment
curl -X PATCH http://localhost:3001/api/payments/1/release

# Refund payment
curl -X PATCH http://localhost:3001/api/payments/1/refund
```

### Earnings API

```bash
# Get earnings summary
curl http://localhost:3001/api/earnings/techuser1

# Get transactions
curl "http://localhost:3001/api/earnings/techuser1/transactions"

# Request payout
curl -X POST http://localhost:3001/api/earnings/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "tech_name": "techuser1",
    "amount": 50,
    "method": "stripe"
  }'
```

### Admin API

```bash
# Dashboard stats
curl http://localhost:3001/api/admin/dashboard

# All users
curl http://localhost:3001/api/admin/users

# Update user
curl -X PATCH http://localhost:3001/api/admin/users/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended", "admin_name": "admin1"}'

# Platform settings
curl http://localhost:3001/api/admin/settings

# Update settings
curl -X PATCH http://localhost:3001/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{"commission_rate": 0.20}'
```

---

## Deployment

### Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd promote

# 2. Setup database
sudo service mariadb start
mysql -u root -e "CREATE DATABASE IF NOT EXISTS promote;"

# 3. Backend setup
cd backend
npm install
npm run dev

# 4. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Production Deployment

```bash
# 1. Build frontend
cd frontend
npm install
npm run build

# 2. Setup environment
cd ../backend
cp .env.example .env
# Edit .env with production values

# 3. Setup database
mysql -u root -p < setup.sql

# 4. Start backend
npm install
NODE_ENV=production npm start
```

### Docker Deployment

```bash
# Build and run
docker build -t promote-backend ./backend
docker run -p 3001:3001 promote-backend

# Or use docker-compose
docker-compose up -d
```

---

## Common User Flows

### Customer Creates Ticket

```bash
# 1. Create user (customer)
curl http://localhost:3001/api/users/johndoe

# 2. Create ticket
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login page not loading",
    "description": "The login page shows a 500 error",
    "environment": "staging",
    "priority": "urgent",
    "customer_name": "johndoe",
    "category": "Bug Report"
  }'

# 3. Send message
curl -X POST http://localhost:3001/api/discussions \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "sender_name": "johndoe",
    "sender_role": "customer",
    "content": "Please fix this ASAP!"
  }'
```

### Tech Resolves Ticket

```bash
# 1. Create user (tech)
curl http://localhost:3001/api/users/janedoe -H "Content-Type: application/json" -d '{"role": "tech"}'

# 2. List available tickets
curl "http://localhost:3001/api/tickets?status=open"

# 3. Claim ticket
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "claimed", "tech_name": "janedoe"}'

# 4. Start work
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# 5. Send update to customer
curl -X POST http://localhost:3001/api/discussions \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "sender_name": "janedoe",
    "sender_role": "tech",
    "content": "Found the issue, deploying fix now"
  }'

# 6. Resolve ticket
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'

# 7. Release payment
curl -X PATCH http://localhost:3001/api/payments/1/release
```

### Tech Requests Payout

```bash
# 1. Check earnings
curl http://localhost:3001/api/earnings/janedoe

# 2. Request payout
curl -X POST http://localhost:3001/api/earnings/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "tech_name": "janedoe",
    "amount": 100,
    "method": "stripe"
  }'
```

### Admin Reviews Platform

```bash
# 1. Get dashboard stats
curl http://localhost:3001/api/admin/dashboard

# 2. List pending payouts
curl http://localhost:3001/api/admin/payouts

# 3. Approve payout
curl -X PATCH http://localhost:3001/api/admin/payouts/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "admin_name": "admin"}'

# 4. View audit logs
curl "http://localhost:3001/api/admin/logs?limit=50"
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :3001

# Kill process on port
kill -9 $(lsof -t -i:3001)

# Check logs
tail -f backend.log
```

### Database Connection Error

```bash
# Check MariaDB is running
sudo service mariadb status

# Start MariaDB
sudo service mariadb start

# Test connection
mysql -u root promote -e "SELECT 1"
```

### Frontend API Errors

```bash
# Check CORS settings in backend
# Ensure frontend URL is allowed in cors middleware

# Check API base URL in frontend
# Should point to http://localhost:3001/api
```

### Empty Response from API

```bash
# Check database has data
mysql -u root promote -e "SELECT COUNT(*) FROM tickets"

# Check API logs on backend
tail -20 backend.log
```

### Payment Processing Issues

```bash
# Check payment status
mysql -u root promote -e "SELECT * FROM payments WHERE status='pending'"

# Manually release payment
curl -X PATCH http://localhost:3001/api/payments/1/release
```

### Reset Everything

```bash
# Stop servers
pkill -f "node src/index.js"
pkill -f "vite"

# Reset database
mysql -u root -e "DROP DATABASE IF EXISTS promote;"

# Restart backend (auto-initializes database)
cd backend && npm run dev

# Restart frontend
cd frontend && npm run dev
```
