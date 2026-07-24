# Promote — Earn Production Access

A gamified ticketing platform where developers earn their way to production access by resolving staging and dev environment tickets.

## 🚀 Overview

Promote is a full-stack tech ticketing platform with a modern React frontend, Node.js/Express backend, and MariaDB database. The platform implements a meritocratic system where developers build reputation through quality work.

## ✨ Features

### Core Platform
- **Role-based System**: Customers submit tickets, Techs resolve them
- **Environment Targeting**: Dev and Staging environment tickets
- **Rating System**: 1-5 stars after ticket resolution
- **Leaderboard**: Techs progress from Dev → Staging → Production-Ready tiers
- **Hiring System**: Direct hiring of Production-Ready techs

### User Management
- Google OAuth authentication
- Email/password authentication with secure password reset
- Role-based access control (customer, tech, admin)
- Profile management with skills and hourly rates

### Ticketing System
- Encrypted message threads
- Priority-based routing to top agents
- SLA tracking with automatic due dates
- Ticket history and audit logging
- Multi-category support with templates

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

## 🛠 Tech Stack

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
- **JWT** — Authentication tokens
- **express-rate-limit** — Rate limiting
- **ioredis** — Redis client for caching & sessions
- **Sentry** — Error monitoring

### Database
- **MariaDB** — Relational database
- **Redis** — Caching, sessions, rate limiting
- **Connection Pooling** — Efficient connection management

## 📁 Project Structure

```
promote/
├── frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Analytics.jsx  # Google Analytics integration
│   │   │   ├── ChatBot.jsx   # Support chatbot
│   │   │   ├── CookieConsent.jsx # Cookie consent banner
│   │   │   ├── HireModal.jsx
│   │   │   ├── Layout.jsx    # App shell with navigation
│   │   │   ├── PayoutModal.jsx
│   │   │   ├── ProtectedRoute.jsx # Route protection
│   │   │   ├── RatingModal.jsx
│   │   │   └── TicketCard.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── pages/            # Route-level components
│   │   │   ├── Landing.jsx         # Landing page
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Signup.jsx          # Signup page
│   │   │   ├── ResetPassword.jsx   # Password reset
│   │   │   ├── Dashboard.jsx       # Customer dashboard
│   │   │   ├── SubmitTicket.jsx   # Create ticket
│   │   │   ├── AvailableTickets.jsx # Tech ticket list
│   │   │   ├── MyTickets.jsx       # User's tickets
│   │   │   ├── TicketDetail.jsx    # Ticket details
│   │   │   ├── Leaderboard.jsx      # Tech rankings
│   │   │   ├── MyRequests.jsx      # Hire requests
│   │   │   ├── MyLeads.jsx         # Incoming requests
│   │   │   ├── Earnings.jsx        # Tech earnings
│   │   │   ├── CustomerBilling.jsx # Customer billing
│   │   │   ├── CRM.jsx             # CRM interface
│   │   │   ├── Notifications.jsx   # Notifications
│   │   │   ├── HelpCenter.jsx      # Help center
│   │   │   ├── AdminDashboard.jsx  # Admin panel
│   │   │   ├── EnhancedSettings.jsx # Platform settings
│   │   │   ├── FAQ.jsx             # FAQ page
│   │   │   ├── Pricing.jsx         # Pricing page
│   │   │   ├── Terms.jsx           # Terms of Service
│   │   │   ├── Privacy.jsx         # Privacy Policy
│   │   │   └── Cookies.jsx         # Cookie Policy
│   │   ├── App.jsx           # Route definitions
│   │   └── index.css         # Global styles
│   ├── public/
│   │   ├── sw.js             # Service worker
│   │   ├── manifest.json     # PWA manifest
│   │   ├── sitemap.xml       # SEO sitemap
│   │   ├── robots.txt        # Search engine directives
│   │   ├── icon.svg          # Adaptive icon
│   │   ├── icon-dark.svg     # Dark mode icon
│   │   └── icon-light.svg    # Light mode icon
│   └── index.html            # HTML template
│
├── backend/
│   ├── src/
│   │   ├── db/               # Database connection
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js       # JWT authentication
│   │   │   ├── errorHandler.js # Error handling
│   │   │   └── rateLimiter.js # Rate limiting
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   └── index.js          # Express app
│   └── tests/                 # Unit tests
│
└── docs/                     # Documentation
```

## 🚀 Getting Started

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

## 🔐 Authentication

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

## 🧪 Testing

### Backend Tests
```bash
cd backend && npm test
```

### Frontend Build
```bash
cd frontend && npm run build
```

### Test Coverage
- **Error Handler**: 12 tests
- **Credit Service**: 29 tests
- **Total**: 41 tests passing

## 📱 PWA Installation

The platform is a Progressive Web App:

1. Visit https://your-domain.com
2. Click "Install" in your browser's address bar
3. App will be available offline

### PWA Features
- Offline page viewing
- Background sync
- Push notifications (configurable)
- App-like experience

## 🔍 SEO

The platform includes comprehensive SEO:

- Meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card support
- JSON-LD structured data
- Sitemap for search engines
- robots.txt configuration

## 🛡️ Security

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

## 📄 License

MIT License - See LICENSE file for details

## 📚 Documentation

- [Architecture](docs/Architecture.md)
- [Database Schema](docs/Database.md)
- [Security Guidelines](docs/Security.md)
- [Error Handling](docs/Error-Handling.md)
- [Testing Guide](docs/Testing.md)
- [PWA Guide](docs/PWA.md)
- [SEO Guide](docs/SEO.md)
- [Redis Integration](docs/Redis.md)
