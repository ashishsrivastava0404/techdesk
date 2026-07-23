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
│  │  │  Auth    │ │ Tickets  │ │ Payments │ │   Admin      │ ││
│  │  │  /api    │ │  /api    │ │  /api    │ │   /api       │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ││
│  │  │ Topics  │ │ Agents   │ │ Credits  │ │  Uploads     │ ││
│  │  │  /api    │ │  /api    │ │  /api    │ │   /api       │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICES LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │ routing.js │ │credits.js    │ │notifications │ │ storage.js││
│  │ (Agent     │ │ (Credit     │ │  .js        │ │ (File     ││
│  │  Routing)  │ │  System)    │ │ (Email/SMS) │ │  Upload)  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐│
│  │stripe.js   │ │paymentGate  │ │       sentry.js             ││
│  │(Payments)  │ │ways.js      │ │      (Monitoring)          ││
│  └─────────────┘ └─────────────┘ └─────────────────────────────┘│
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
- **jsonwebtoken** — JWT authentication
- **stripe** — Payment processing
- **@sentry/node** — Error monitoring

### Database
- **MariaDB** — Relational database
- **Connection Pooling** — Efficient connection management

### External Integrations
- **Stripe** — Payment gateway
- **Razorpay** — Payment gateway (India)
- **PayPal** — Payment gateway
- **SendGrid** — Email notifications
- **Twilio** — SMS notifications
- **AWS S3** — File storage
- **Cloudinary** — Image CDN
- **Google OAuth** — Authentication
- **Sentry** — Error tracking

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
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js       # JWT authentication
│   │   │   └── errorHandler.js
│   │   ├── services/         # Business logic services
│   │   │   ├── routing.js     # Intelligent agent routing
│   │   │   ├── credits.js     # Credit system
│   │   │   ├── notifications.js # Email/SMS
│   │   │   ├── storage.js      # File uploads
│   │   │   ├── stripe.js      # Stripe payments
│   │   │   ├── sentry.js      # Error monitoring
│   │   │   └── paymentGateways.js # Unified gateway interface
│   │   ├── routes/           # API route handlers
│   │   │   ├── users.js
│   │   │   ├── auth.js        # Authentication routes
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
│   │   │   ├── chatbot.js
│   │   │   ├── uploads.js     # File uploads
│   │   │   ├── topics.js      # Topics & categories
│   │   │   ├── agentRequests.js # Agent-customer requests
│   │   │   └── credits.js      # Credit management
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

#### Authentication
- `GET /api/auth/google` — Get Google OAuth URL
- `POST /api/auth/google/callback` — Handle OAuth callback
- `POST /api/auth/refresh` — Refresh JWT token
- `GET /api/auth/verify` — Verify JWT token
- `POST /api/auth/logout` — Logout

#### Users
- `GET /api/users` — List all users
- `GET /api/users/:name` — Get/create user by name
- `PATCH /api/users/:name` — Update user profile
- `GET /api/users/techs/leaderboard` — Get tech leaderboard

#### Tickets
- `GET /api/tickets` — List tickets (with filters)
- `GET /api/tickets/:id` — Get ticket details
- `POST /api/tickets` — Create ticket (with routing)
- `PATCH /api/tickets/:id` — Update ticket (claim, resolve)
- `DELETE /api/tickets/:id` — Delete ticket
- `GET /api/tickets/:id/suggested-agents` — Get suggested agents

#### Topics & Routing
- `GET /api/topics/suggest` — Get topic suggestions
- `POST /api/topics/suggest` — Add topic suggestion
- `GET /api/topics/categories` — Get category hierarchy
- `POST /api/topics/categories` — Create category
- `GET /api/topics/expertise/:techName` — Get agent expertise
- `POST /api/topics/expertise` — Add agent expertise
- `DELETE /api/topics/expertise` — Remove expertise
- `GET /api/topics/route/:ticketId` — Get top agents for ticket

#### Agent Requests
- `POST /api/agents/request-customer` — Agent requests customer
- `GET /api/agents/requests/pending` — Get pending requests
- `GET /api/agents/requests/sent` — Get sent requests
- `PATCH /api/agents/requests/:id/approve` — Approve request
- `PATCH /api/agents/requests/:id/reject` — Reject request
- `GET /api/agents/requests/:id` — Get request details

#### Credits
- `GET /api/credits/balance/:userName` — Get credit balance
- `GET /api/credits/history/:userName` — Get transaction history
- `POST /api/credits/add` — Add credits (admin)
- `POST /api/credits/deduct` — Deduct credits (admin)
- `POST /api/credits/transfer` — Transfer credits (donation)
- `GET /api/credits/cost` — Calculate ticket cost
- `GET /api/credits/check` — Check credit eligibility
- `GET /api/credits/settings` — Get credit settings
- `PATCH /api/credits/settings` — Update settings (admin)

#### Discussions
- `GET /api/discussions/:ticketId` — Get messages (authorized)
- `POST /api/discussions` — Send message
- `POST /api/discussions/system` — Add system message

#### Uploads
- `POST /api/uploads/ticket/:ticketId` — Upload to ticket
- `GET /api/uploads/ticket/:ticketId` — Get ticket attachments
- `DELETE /api/uploads/:attachmentId` — Delete attachment
- `POST /api/uploads/general` — General file upload

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
- `GET /api/stats/:name` — Get user stats (role-specific dashboard)
- `GET /api/stats` — Get global stats

#### Payments
- `GET /api/payments` — List payments
- `GET /api/payments/:id` — Get payment details
- `POST /api/payments` — Create payment
- `POST /api/payments/:id/confirm` — Confirm payment
- `POST /api/payments/webhook/stripe` — Stripe webhook
- `PATCH /api/payments/:id/release` — Release to tech
- `PATCH /api/payments/:id/refund` — Refund customer
- `PATCH /api/payments/:id/dispute` — Dispute payment
- `GET /api/payments/methods/:customerName` — Get payment methods

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

### Ticket Creation Flow with Routing
```
Customer --> SubmitTicket Form --> POST /api/tickets
                                          |
                                    +-------------+
                                    | Validation  |
                                    +-------------+
                                          |
                                    +-------------+
                                    |Credit Check |
                                    |(if priority)|
                                    +-------------+
                                          |
                                    +-------------+
                                    |  Database   |
                                    |   Insert    |
                                    +-------------+
                                          |
                                    +-------------+
                                    |   Routing   |
                                    |  Service    |
                                    +-------------+
                                          |
                                    +-------------+
                                    | Notify Top  |
                                    | 20 Agents  |
                                    +-------------+
                                          |
                              Response <-- Customer
```

### Priority-Based Agent Routing
| Priority | Agents Notified |
|----------|-----------------|
| Critical | Top 20 |
| Normal | Top 20 |
| High | Top 15 |
| Urgent | Top 15 |
| Low | Top 10 |

### Credit System Flow
```
Customer --> Create High/Critical Ticket --> Credit Check
                                               |
                                    +---------------------+
                                    | Has enough credits?|
                                    +---------------------+
                                               |
                              No --> Show error / Purchase credits
                                               |
                             Yes --> Deduct credits --> Create ticket
```

### Payment Flow (Multi-Gateway)
```
Customer --> Select Gateway --> POST /api/payments
                                    |
                          +---------+----------+
                          |         |          |
                      Stripe    Razorpay    PayPal
                          |         |          |
                          v         v          v
                      Payment Intent / Order / Order
                          |         |          |
                          +----+----+----------+
                               |
                    +----------+------------+
                    | Payment Confirmation  |
                    +----------+------------+
                               |
                    Tech Notified via Notification
                               |
                    Work Completed --> Release Payment
                               |
                    Tech Earnings Credited
```

### Agent Request Workflow
```
Agent --> Request Customer --> POST /api/agents/request-customer
                                          |
                                    Customer Notified
                                          |
                                    +-------------+
                                    |  Pending    |
                                    |   Request    |
                                    +-------------+
                                          |
                    +---------------------+---------------------+
                    |                                           |
              Customer Approves                         Customer Rejects
                    |                                           |
                    v                                           v
            Assign Agent to Ticket                      Notify Agent
            Notify other pending                     Mark as Rejected
              requests as expired
```

## Scalability Considerations

### Current Architecture (Monolithic)
- Single Express server
- Single MariaDB instance
- Synchronous database operations

### Future Improvements
- Add Redis for caching
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
# Database
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_NAME=promote
DB_SOCKET=/run/mysqld/mysqld.sock
PORT=3001

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Payments (choose one or more)
STRIPE_SECRET_KEY=sk_...
RAZORPAY_KEY_ID=rzp_...
PAYPAL_CLIENT_ID=...

# Notifications
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=...

# Storage
AWS_ACCESS_KEY_ID=...
CLOUDINARY_API_KEY=...

# Monitoring
SENTRY_DSN=https://...

# Frontend
VITE_API_URL=http://localhost:3001/api
```
