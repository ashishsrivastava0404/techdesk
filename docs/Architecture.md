# Promote — System Architecture

## Overview

Promote is a full-stack ticketing platform with a React frontend, Node.js/Express backend, and MariaDB database. The system follows a client-server architecture with RESTful API communication.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React SPA (Vite)                         ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ ││
│  │  │ Context │  │  Pages   │  │Components│  │   Hooks     │ ││
│  │  │ AppCtx  │  │Dashboard │  │Layout   │  │ useTicket   │ ││
│  │  └─────────┘  │Ticket   │  │TicketCard│  │ useAuth     │ ││
│  │               │Detail   │  │Modals   │  │             │ ││
│  │               └─────────┘  └─────────┘  └─────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Express)                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Router (Router)                      ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ││
│  │  │  Users   │ │ Tickets  │ │ Payments │ │   Admin      │ ││
│  │  │  /api    │ │  /api    │ │  /api    │ │   /api       │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ││
│  │  │Earnings  │ │   CRM    │ │Discussions│ │Notifications │ ││
│  │  │  /api    │ │  /api    │ │  /api    │ │   /api       │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐   │
│  │   MariaDB Pool      │    │      Business Logic         │   │
│  │   Connection Pool   │◄──►│  Validation, Auth, Crypto   │   │
│  └─────────────────────┘    └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **React Router 6** — Client-side routing
- **Context API** — State management
- **CSS Variables** — Theming (dark mode)

### Backend
- **Node.js** — Runtime environment
- **Express** — Web framework
- **mysql2** — MySQL/MariaDB driver with promise support
- **dotenv** — Environment configuration
- **cors** — Cross-origin resource sharing

### Database
- **MariaDB** — Relational database
- **Connection Pooling** — Efficient connection management

## Directory Structure

```
promote/
├── frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   │   └── index.js      # All API endpoints
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout.jsx    # App shell with navigation
│   │   │   ├── TicketCard.jsx
│   │   │   └── *.jsx         # Modals, forms
│   │   ├── context/          # React Context providers
│   │   │   └── AppContext.jsx
│   │   ├── pages/            # Route-level components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubmitTicket.jsx
│   │   │   ├── AvailableTickets.jsx
│   │   │   ├── MyTickets.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Earnings.jsx
│   │   │   ├── CRM.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Notifications.jsx
│   │   │   └── TicketDetail.jsx
│   │   ├── App.jsx           # Route definitions
│   │   └── index.css         # Global styles
│   └── index.html
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── index.js      # Database connection & schema
│   │   ├── routes/           # API route handlers
│   │   │   ├── users.js
│   │   │   ├── tickets.js
│   │   │   ├── ratings.js
│   │   │   ├── hireRequests.js
│   │   │   ├── stats.js
│   │   │   ├── payments.js
│   │   │   ├── earnings.js
│   │   │   ├── crm.js
│   │   │   ├── admin.js
│   │   │   ├── discussions.js
│   │   │   ├── categories.js
│   │   │   ├── notifications.js
│   │   │   ├── ticketHistory.js
│   │   │   └── surveys.js
│   │   └── index.js          # Express app setup
│   └── .env                 # Environment variables
│
└── docs/                     # Documentation
```

## API Design

### REST Conventions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resource` | List resources |
| GET | `/api/resource/:id` | Get single resource |
| POST | `/api/resource` | Create resource |
| PATCH | `/api/resource/:id` | Update resource |
| DELETE | `/api/resource/:id` | Delete resource |

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "id": 1,
  "name": "value",
  "status": "active"
}
```

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

### API Endpoints

#### Users
- `GET /api/users` — List all users
- `GET /api/users/:name` — Get/create user by name
- `PATCH /api/users/:name` — Update user profile

#### Tickets
- `GET /api/tickets` — List tickets (with filters)
- `GET /api/tickets/:id` — Get ticket details
- `POST /api/tickets` — Create ticket
- `PATCH /api/tickets/:id` — Update ticket (claim, resolve)
- `DELETE /api/tickets/:id` — Delete ticket

#### Discussions
- `GET /api/discussions/:ticketId` — Get messages (authorized)
- `POST /api/discussions` — Send message
- `POST /api/discussions/system` — Add system message

#### Categories
- `GET /api/categories` — List categories
- `GET /api/categories/templates` — List templates
- `POST /api/categories/templates/:id/use` — Use template

#### Notifications
- `GET /api/notifications/:userName` — Get notifications
- `PATCH /api/notifications/:id/read` — Mark as read

#### Payments
- `POST /api/payments` — Create payment
- `PATCH /api/payments/:id/release` — Release to tech
- `PATCH /api/payments/:id/refund` — Refund customer

#### Earnings
- `GET /api/earnings/:techName` — Get earnings summary
- `POST /api/earnings/payouts` — Request payout

#### Admin
- `GET /api/admin/dashboard` — Platform stats
- `GET /api/admin/users` — All users
- `GET /api/admin/logs` — Audit logs
- `PATCH /api/admin/settings` — Update settings

## Data Flow

### Ticket Creation Flow
```
Customer → SubmitTicket Form → POST /api/tickets
                                    │
                                    ▼
                              ┌─────────────┐
                              │ Validation  │
                              └─────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │  Database   │
                              │   Insert    │
                              └─────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │ Notification│
                              │   System    │
                              └─────────────┘
                                    │
                                    ▼
                              Response ← Customer
```

### Payment Flow
```
Customer → Create Payment → POST /api/payments
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              ┌───────────┐                   ┌───────────┐
              │  Hold     │                   │ Tech      │
              │  (escrow) │                   │ Notified  │
              └───────────┘                   └───────────┘
                    │
                    ▼ (work completed)
              ┌───────────┐
              │  Release  │ → POST /api/payments/:id/release
              └───────────┘
                    │
                    ▼
              ┌───────────┐
              │ Tech      │
              │ Earnings  │
              └───────────┘
```

## Security Architecture

### Authentication
- Name-based identity stored in database
- No passwords (simplified for demo)
- Session managed via database state

### Authorization
- Role-based access control (customer, tech, admin)
- Resource-level authorization checks
- Encrypted discussion access limited to participants

### Data Protection
- Message content encrypted (Base64 for demo)
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

## Scalability Considerations

### Current Architecture (Monolithic)
- Single Express server
- Single MariaDB instance
- Synchronous database operations

### Future Improvements
- Add Redis for caching
- Implement JWT authentication
- Add rate limiting
- Horizontal scaling with load balancer
- Read replicas for database
- CDN for static assets

## Deployment

### Development
```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

### Production
```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd backend && npm start
```

### Environment Variables
```
# Backend (.env)
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_NAME=promote
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001/api
```
