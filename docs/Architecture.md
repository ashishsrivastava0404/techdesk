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
│   │   │   ├── ChatBot.jsx  # Support chatbot
│   │   │   ├── HireModal.jsx
│   │   │   ├── PayoutModal.jsx
│   │   │   └── RatingModal.jsx
│   │   ├── context/          # React Context providers
│   │   │   └── AppContext.jsx
│   │   ├── pages/            # Route-level components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubmitTicket.jsx
│   │   │   ├── AvailableTickets.jsx
│   │   │   ├── MyTickets.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   ├── MyLeads.jsx
│   │   │   ├── Earnings.jsx
│   │   │   ├── CRM.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CustomerBilling.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── TicketDetail.jsx
│   │   │   └── HelpCenter.jsx
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
│   │   │   ├── surveys.js
│   │   │   └── chatbot.js
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
- `GET /api/users/techs/leaderboard` — Get tech leaderboard

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

#### Categories & Templates
- `GET /api/categories` — List categories
- `GET /api/categories/templates` — List templates
- `GET /api/categories/templates/:id` — Get single template
- `POST /api/categories/templates/:id/use` — Use template

#### Notifications
- `GET /api/notifications/:userName` — Get notifications
- `GET /api/notifications/:userName/count` — Get unread count
- `PATCH /api/notifications/:id/read` — Mark as read
- `PATCH /api/notifications/:userName/read-all` — Mark all as read

#### Ticket History
- `GET /api/ticket-history/:ticketId` — Get ticket history
- `GET /api/ticket-history/user/:userName` — Get user activity

#### Ratings
- `GET /api/ratings/tech/:name` — Get tech ratings
- `POST /api/ratings` — Submit rating

#### Hire Requests
- `GET /api/hire-requests` — List hire requests
- `POST /api/hire-requests` — Create hire request
- `PATCH /api/hire-requests/:id` — Update status

#### Stats
- `GET /api/stats/:name` — Get user stats
- `GET /api/stats` — Get global stats

#### Payments
- `GET /api/payments` — List payments
- `GET /api/payments/:id` — Get payment details
- `POST /api/payments` — Create payment
- `PATCH /api/payments/:id/release` — Release to tech
- `PATCH /api/payments/:id/refund` — Refund customer
- `PATCH /api/payments/:id/dispute` — Dispute payment

#### Earnings
- `GET /api/earnings/:techName` — Get earnings summary
- `GET /api/earnings/:techName/transactions` — Transaction history
- `GET /api/earnings/:techName/chart` — Earnings chart data
- `POST /api/earnings/payouts` — Request payout
- `GET /api/earnings/payouts/:techName` — Payout history

#### CRM
- `GET /api/crm/contacts` — List contacts
- `GET /api/crm/contacts/:id` — Get contact details
- `POST /api/crm/contacts` — Create contact
- `PATCH /api/crm/contacts/:id` — Update contact
- `GET /api/crm/contacts/:id/interactions` — Get interactions
- `GET /api/crm/contacts/:id/stats` — Get contact stats
- `POST /api/crm/interactions` — Create interaction

#### Surveys (CSAT)
- `GET /api/surveys/ticket/:ticketId` — Get survey for ticket
- `POST /api/surveys` — Submit survey
- `GET /api/surveys/tech/:techName` — Get tech surveys
- `GET /api/surveys/tech/:techName/stats` — Get CSAT stats

#### Chatbot
- `POST /api/chatbot/chat` — Chat message
- `GET /api/chatbot/faqs` — Get FAQ list
- `GET /api/chatbot/faqs/:id` — Get single FAQ
- `GET /api/chatbot/topics` — Get help topics
- `GET /api/chatbot/history/:sessionId` — Get conversation history

#### Admin
- `GET /api/admin/dashboard` — Platform stats
- `GET /api/admin/users` — All users
- `PATCH /api/admin/users/:id` — Update user
- `GET /api/admin/payments` — All payments
- `GET /api/admin/payouts` — All payouts
- `PATCH /api/admin/payouts/:id` — Update payout
- `GET /api/admin/logs` — Audit logs
- `GET /api/admin/settings` — Get settings
- `PATCH /api/admin/settings` — Update settings
- `GET /api/admin/revenue-chart` — Revenue chart data


## Data Flow

### Ticket Creation Flow
```
Customer --> SubmitTicket Form --> POST /api/tickets
                                          |
                                    +-------------+
                                    | Validation  |
                                    +-------------+
                                          |
                                    +-------------+
                                    |  Database   |
                                    |   Insert    |
                                    +-------------+
                                          |
                                    +-------------+
                                    | Notification|
                                    |   System    |
                                    +-------------+
                                          |
                              Response <-- Customer
```

### Ticket Resolution Flow
```
Tech --> Claim Ticket --> PATCH /api/tickets/:id
                                     |
                                     v
                              Update Status: "claimed"
                                     |
                                     v
                              Send Message --> POST /api/discussions
                                     |
                                     v
                              Resolve Ticket --> PATCH /api/tickets/:id
                                     |
                                     v
                              Update Status: "resolved"
                                     |
                                     v
                              Customer Rates --> POST /api/ratings
                                     |
                                     v
                              Close Ticket --> PATCH /api/tickets/:id
```

### Payment Flow
```
Customer --> Create Payment --> POST /api/payments
                                      |
                                      v
                              Status: "held" (escrow)
                                      |
                                      v
                              Tech Notified via Notification
                                      |
                                      v
                              Work Completed --> POST /api/hire-requests
                                      |
                                      v
                              Release Payment --> PATCH /api/payments/:id/release
                                      |
                                      v
                              Tech Earnings Credited
                              Status: "released"
```
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
