# TechDesk вЂ” Modern Tech Support Platform

A gamified ticketing platform where developers earn their way to production access by resolving staging and dev environment tickets.

## рџљЂ Overview

TechDesk is a full-stack tech ticketing platform with a modern React frontend, Node.js/Express backend, MariaDB database, and Redis caching. The platform implements a meritocratic system where developers build reputation through quality work.

## вњЁ Features

### Core Platform
- **Role-based System**: Customers submit tickets, Techs resolve them
- **Environment Targeting**: Dev and Staging environment tickets
- **Rating System**: 1-5 stars after ticket resolution
- **Leaderboard**: Techs progress from Dev в†’ Staging в†’ Production-Ready tiers
- **Hiring System**: Direct hiring of Production-Ready techs

### Ticketing System
- **Hierarchical Categories**: Category в†’ Subcategory в†’ Topic selection (7 main categories, 40+ subcategories)
- **Threaded Discussions**: Comment threads with role-based access (customer, technician, admin)
- **Priority-based Routing**: Automatic routing to top qualified agents
- **SLA Tracking**: Automatic due dates based on priority
- **Ticket History**: Complete audit trail of all ticket changes
- **Multi-category Support**: Templates and topic suggestions

### User Management
- Google OAuth authentication
- Email/password authentication with secure password reset
- Role-based access control (customer, tech, admin)
- Profile management with skills and hourly rates

### Caching & Performance
- **Redis Integration**: Distributed caching, sessions, rate limiting
- **In-Memory Fallback**: Graceful degradation when Redis unavailable
- **Auto-cleanup**: Automatic expired entry cleanup every 5 minutes

### Payments & Billing
- Multi-gateway support (Stripe, Razorpay, PayPal)
- Escrow-style payment holds
- Tech earnings dashboard
- Payout management
- Customer invoicing

### Admin Features
- Platform settings management
- User management and moderation
- Analytics dashboard
- Audit logging

### Marketing & Legal
- FAQ page with categories
- Pricing page with plans
- Terms of Service
- Privacy Policy
- Cookie Policy

### PWA Features
- Service worker with offline support
- Adaptive icons (light/dark mode)
- App manifest for installability

### SEO
- Meta tags and Open Graph
- Twitter Cards
- JSON-LD structured data
- Sitemap.xml
- robots.txt

## рџ›  Tech Stack

### Frontend
- **React 18** вЂ” UI framework
- **Vite** вЂ” Build tool and dev server
- **React Router 6** вЂ” Client-side routing
- **Context API** вЂ” State management
- **CSS Variables** вЂ” Theming (dark mode)

### Backend
- **Node.js** вЂ” Runtime environment
- **Express** вЂ” Web framework
- **mysql2** вЂ” MySQL/MariaDB driver with promise support
- **JWT** вЂ” Authentication tokens
- **ioredis** вЂ” Redis client for caching & sessions
- **Sentry** вЂ” Error monitoring

### Database & Caching
- **MariaDB** вЂ” Relational database
- **Redis** вЂ” Caching, sessions, rate limiting (with in-memory fallback)
- **Connection Pooling** вЂ” Efficient connection management

## рџ“Ѓ Project Structure

```
techdesk/
в”њв”Ђв”Ђ frontend/
в”‚   в”њв”Ђв”Ђ src/
в”‚   в”‚   в”њв”Ђв”Ђ api/              # API client functions
в”‚   в”‚   в”њв”Ђв”Ђ components/        # Reusable UI components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ Analytics.jsx  # Google Analytics integration
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ ChatBot.jsx   # Support chatbot
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ CookieConsent.jsx # Cookie consent banner
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ HireModal.jsx
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ Layout.jsx    # App shell with navigation
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ PayoutModal.jsx
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ ProtectedRoute.jsx # Route protection
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ RatingModal.jsx
в”‚   в”‚   в”‚   в””в”Ђв”Ђ TicketCard.jsx
в”‚   в”‚   в”њв”Ђв”Ђ context/
в”‚   в”‚   в”‚   в””в”Ђв”Ђ AppContext.jsx
в”‚   в”‚   в”њв”Ђв”Ђ pages/            # Route-level components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ SubmitTicket.jsx   # Create ticket (hierarchical categories)
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ TicketDetail.jsx   # Ticket details (threaded discussions)
в”‚   в”‚   в”‚   в””в”Ђв”Ђ ...                # Other pages
в”‚   в”‚   в”њв”Ђв”Ђ App.jsx           # Route definitions
в”‚   в”‚   в””в”Ђв”Ђ index.css         # Global styles
в”‚   в”њв”Ђв”Ђ public/
в”‚   в”‚   в”њв”Ђв”Ђ sw.js             # Service worker
в”‚   в”‚   в”њв”Ђв”Ђ manifest.json     # PWA manifest
в”‚   в”‚   в”њв”Ђв”Ђ sitemap.xml       # SEO sitemap
в”‚   в”‚   в””в”Ђв”Ђ robots.txt        # Search engine directives
в”‚   в””в”Ђв”Ђ index.html            # HTML template
в”‚
в”њв”Ђв”Ђ backend/
в”‚   в”њв”Ђв”Ђ src/
в”‚   в”‚   в”њв”Ђв”Ђ db/
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ index.js               # Database connection
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ redis.js              # Redis connection
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ memoryFallback.js     # In-memory fallback
в”‚   в”‚   в”‚   в””в”Ђв”Ђ migrations/           # SQL migrations
в”‚   в”‚   в”њв”Ђв”Ђ middleware/
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ auth.js              # JWT authentication
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ errorHandler.js      # Error handling
в”‚   в”‚   в”‚   в””в”Ђв”Ђ rateLimiter.js       # Rate limiting (with fallback)
в”‚   в”‚   в”њв”Ђв”Ђ services/
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ redisCache.js        # Caching service
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ redisSession.js       # Session service
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ redisToken.js        # Token service
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ routing.js           # Agent routing
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ credits.js           # Credit system
в”‚   в”‚   в”‚   в””в”Ђв”Ђ ...
в”‚   в”‚   в”њв”Ђв”Ђ constants/
в”‚   в”‚   в”‚   в””в”Ђв”Ђ ticketCategories.js  # Category hierarchy
в”‚   в”‚   в”њв”Ђв”Ђ routes/
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ tickets.js           # Ticket CRUD
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ ticketComments.js    # Threaded comments
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ ticketHierarchy.js   # Category hierarchy API
в”‚   в”‚   в”‚   в””в”Ђв”Ђ ...
в”‚   в”‚   в””в”Ђв”Ђ index.js          # Express app
в”‚   в””в”Ђв”Ђ tests/                 # Unit tests (106 tests)
в”‚
в””в”Ђв”Ђ docs/                     # Documentation
```

## рџљЂ Getting Started

### Prerequisites

- Node.js 18+
- MySQL or MariaDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ashishsrivastava0404/techdesk.git
cd techdesk
```

2. Install backend dependencies:
```bash
cd backend && npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend && npm install
```

4. Configure environment:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env 2>/dev/null || true
```

5. Start MySQL/MariaDB:
```bash
sudo service mariadb start
```

6. Start the backend:
```bash
cd backend && npm run dev
```

7. Start the frontend (in another terminal):
```bash
cd frontend && npm run dev
```

8. Open http://localhost:5173

## рџ”ђ Authentication

The platform supports multiple authentication methods:

### Email/Password
- Registration with email, password, and name
- Login with email and password
- Password reset via email link
- PBKDF2 password hashing with 100,000 iterations

### Google OAuth
- Single sign-on with Google
- Automatic account creation on first login

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth endpoints | 5 attempts | 15 minutes |
| Password reset | 3 requests | 1 hour |
| Registration | 5 attempts | 1 hour |
| Payments | 10 requests | 1 minute |

## рџ§Є Testing

### Backend Tests
```bash
cd backend && npm test
```

### Frontend Build
```bash
cd frontend && npm run build
```

### Test Coverage
| Test Suite | Tests | Description |
|-----------|-------|-------------|
| fallback.test.js | 28 | Redis fallback system (cache, sessions, tokens) |
| errorHandler.test.js | 12 | Error handling middleware |
| credits.test.js | 29 | Credit service logic |
| categories.test.js | 17 | Category hierarchy structure |
| ticketComments.test.js | 20 | Threaded comments system |
| **Total** | **106** | **All Passing** ✅ |

## рџ“± PWA Installation

The platform is a Progressive Web App:

1. Visit https://your-domain.com
2. Click "Install" in your browser's address bar
3. App will be available offline

### PWA Features
- Offline page viewing
- Background sync
- Push notifications (configurable)
- App-like experience

## рџ”Ќ SEO

The platform includes comprehensive SEO:

- Meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card support
- JSON-LD structured data
- Sitemap for search engines
- robots.txt configuration

## рџ›ЎпёЏ Security

### Implemented
- Rate limiting on all endpoints
- JWT authentication
- Password hashing (PBKDF2)
- CORS configuration
- Helmet security headers
- SQL injection prevention
- XSS protection
- Audit logging

### Environment Variables Required
```
# Database
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_NAME=promote

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Payments
STRIPE_SECRET_KEY=sk_...
RAZORPAY_KEY_ID=rzp_...

# Monitoring
SENTRY_DSN=https://...

# Frontend
VITE_API_URL=http://localhost:3001/api
```

## рџ“„ License

MIT License - See LICENSE file for details

## рџ“љ Documentation

- [Architecture](docs/Architecture.md)
- [Database Schema](docs/Database.md)
- [Security Guidelines](docs/Security.md)
- [Error Handling](docs/Error-Handling.md)
- [Testing Guide](docs/Testing.md)
- [PWA Guide](docs/PWA.md)
- [SEO Guide](docs/SEO.md)
- [Redis Integration](docs/Redis.md)
