# Promote — Earn Production Access

A gamified ticketing platform where developers earn their way to production access by resolving staging and dev environment tickets.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: MySQL (MariaDB)

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL or MariaDB

### Setup

1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Start MySQL/MariaDB:
```bash
sudo service mariadb start
```

3. Update `backend/.env` with your database credentials if needed.

4. Start the backend:
```bash
cd backend && npm run dev
```

5. Start the frontend (in another terminal):
```bash
cd frontend && npm run dev
```

6. Open http://localhost:5173

## Features

- **Role-based system**: Customers submit tickets, Techs resolve them
- **Environment targeting**: Dev and Staging tickets
- **Rating system**: 1-5 stars after ticket resolution
- **Leaderboard with promotion ladder**: Techs progress from Dev → Staging → Production-Ready
- **Hiring system**: Customers can request Production-Ready techs for paid work

## API Endpoints

### Users
- `GET /api/users/:name` - Get or create user
- `PATCH /api/users/:name` - Update user role
- `GET /api/users/techs/leaderboard` - Get ranked tech list

### Tickets
- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create ticket
- `PATCH /api/tickets/:id` - Update ticket (claim, resolve)
- `DELETE /api/tickets/:id` - Delete ticket

### Ratings
- `POST /api/ratings` - Submit rating
- `GET /api/ratings/tech/:name` - Get tech's ratings

### Hire Requests
- `GET /api/hire-requests` - List requests
- `POST /api/hire-requests` - Create request
- `PATCH /api/hire-requests/:id` - Update status

### Stats
- `GET /api/stats/:name` - Get user stats
