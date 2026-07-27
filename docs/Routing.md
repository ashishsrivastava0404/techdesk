# Routing Documentation

## Overview

This document describes the routing system implemented in the TechDesk application, including route protection, middleware, and navigation guards.

## Table of Contents

1. [Route Types](#route-types)
2. [Route Protection](#route-protection)
3. [Navigation Guards](#navigation-guards)
4. [Route Configuration](#route-configuration)
5. [Dynamic Routing](#dynamic-routing)
6. [API Routes](#api-routes)
7. [Testing](#testing)

---

## Route Types

### Frontend Routes

#### Public Routes (No Authentication Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing | Landing page |
| `/login` | Login | Login page |
| `/signup` | Signup | Registration page |
| `/terms` | Terms | Terms of service |
| `/privacy` | Privacy | Privacy policy |
| `/cookies` | Cookies | Cookie policy |
| `/faq` | FAQ | Frequently asked questions |
| `/pricing` | Pricing | Pricing information |
| `/forgot-password` | ResetPassword | Password recovery |
| `/reset-password` | ResetPassword | Password reset |

#### Protected Routes (Authentication Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | Dashboard | User dashboard |
| `/submit` | SubmitTicket | Submit new ticket |
| `/mytickets` | MyTickets | View user's tickets |
| `/notifications` | Notifications | Notification center |

#### Technician Routes (Tech Role Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/available` | AvailableTickets | View available tickets |
| `/leads` | LeadManagement | Manage leads |
| `/earnings` | Earnings | View earnings |
| `/performance` | Performance | Performance metrics |

#### Admin Routes (Admin Role Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | AdminDashboard | Admin dashboard |
| `/admin/users` | AdminDashboard | User management |
| `/admin/payments` | AdminDashboard | Payment management |
| `/admin/credits` | AdminDashboard | Credit management |
| `/admin/analytics` | AdminDashboard | Analytics dashboard |
| `/admin/financial-audit` | AdminDashboard | Financial audit |
| `/admin/support-reports` | AdminDashboard | Support reports |
| `/admin/settings` | AdminDashboard | General settings |
| `/admin/platform-settings` | EnhancedSettings | Platform settings |

---

## Route Protection

### Route Guard Components

```jsx
// ProtectedRoute - Requires authentication
function ProtectedRoute({ children }) {
  const { user } = useApp();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// TechRoute - Requires tech role
function TechRoute({ children }) {
  const { user } = useApp();
  
  if (!user || user.role !== 'tech') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// AdminRoute - Requires admin role
function AdminRoute({ children }) {
  const { user } = useApp();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// PublicRoute - Redirects if already authenticated
function PublicRoute({ children }) {
  const { user } = useApp();
  
  if (user) {
    const redirect = getDefaultRoute(user.role);
    return <Navigate to={redirect} replace />;
  }
  
  return children;
}
```

### Usage in App.jsx

```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
  <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
  
  {/* Protected Routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/submit" element={<ProtectedRoute><SubmitTicket /></ProtectedRoute>} />
  
  {/* Tech Routes */}
  <Route path="/available" element={<TechRoute><AvailableTickets /></TechRoute>} />
  <Route path="/leads" element={<TechRoute><LeadManagement /></TechRoute>} />
  
  {/* Admin Routes */}
  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
  <Route path="/admin/users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
</Routes>
```

---

## Navigation Guards

### Default Route Resolution

```jsx
function getDefaultRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'tech':
      return '/available';
    default:
      return '/dashboard';
  }
}
```

### Redirect Logic

```jsx
// Root path redirect
<Route path="*" element={
  user ? (
    <Navigate to={getDefaultRoute(user.role)} replace />
  ) : (
    <Navigate to="/" replace />
  )
} />
```

---

## Route Configuration

### Application Context

```jsx
const APP_ROUTES = {
  public: [
    '/',
    '/login',
    '/signup',
    '/terms',
    '/privacy',
    '/cookies',
    '/faq',
    '/pricing'
  ],
  protected: [
    '/dashboard',
    '/submit',
    '/mytickets',
    '/notifications'
  ],
  tech: [
    '/available',
    '/leads',
    '/earnings',
    '/performance'
  ],
  admin: [
    '/admin',
    '/admin/users',
    '/admin/payments',
    '/admin/credits',
    '/admin/analytics',
    '/admin/financial-audit',
    '/admin/support-reports',
    '/admin/settings',
    '/admin/platform-settings'
  ]
};
```

### Brand Routes

```jsx
const BRAND_ROUTES = [
  '/terms',
  '/privacy',
  '/cookies'
];
```

---

## Dynamic Routing

### Parameter Routes

```jsx
// Ticket detail route
<Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

// Profile route
<Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

// Message thread route
<Route path="/messages/:threadId" element={<ProtectedRoute><MessageThread /></ProtectedRoute>} />
```

### Nested Routes

```jsx
// Admin nested routes
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="payments" element={<PaymentManagement />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

---

## API Routes

### Authentication Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| PUT | `/api/auth/password` | Change password |

### Ticket Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List tickets |
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/:id` | Get ticket |
| PUT | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket |
| POST | `/api/tickets/:id/claim` | Claim ticket |
| POST | `/api/tickets/:id/resolve` | Resolve ticket |

### Notification Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Message Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/messages/:ticketId` | Get ticket messages |
| POST | `/api/messages` | Send message |
| PUT | `/api/messages/:id/read` | Mark message as read |
| GET | `/api/messages/threads` | Get message threads |
| GET | `/api/messages/conversations/:userId` | Get conversation |

### User Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update current user |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/admin/users` | List all users (admin) |

### Credit Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/credits/balance` | Get balance |
| POST | `/api/credits/deduct` | Deduct credits |
| POST | `/api/credits/add` | Add credits (admin) |
| GET | `/api/credits/transactions` | Get transactions |

### Payment Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payments` | List payments |
| POST | `/api/payments/create-intent` | Create payment intent |
| POST | `/api/payments/webhook` | Payment webhook |
| GET | `/api/payouts` | List payouts |
| POST | `/api/payouts/request` | Request payout |

---

## Middleware

### Backend Middleware

```javascript
// Authentication middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
router.get('/admin/users', authMiddleware, requireRole('admin'), getUsers);
router.get('/tech/available', authMiddleware, requireRole('tech', 'admin'), getAvailableTickets);
```

### Error Handler Middleware

```javascript
// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handler
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VAL_001',
        message: err.message
      }
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'SRV_003',
      message: err.message || 'Internal server error'
    }
  });
}
```

---

## Testing

### Route Protection Tests

```jsx
describe('Route Protection', () => {
  describe('Public Routes', () => {
    it('should allow access to / without authentication', () => {
      // Test that landing page loads without auth
    });
    
    it('should allow access to /login without authentication', () => {
      // Test that login page loads without auth
    });
  });
  
  describe('Protected Routes', () => {
    it('should require authentication for /dashboard', () => {
      // Test redirect to login
    });
    
    it('should allow authenticated user to access /dashboard', () => {
      // Test access granted
    });
  });
  
  describe('Tech Routes', () => {
    it('should require tech role for /available', () => {
      // Test redirect for non-tech users
    });
    
    it('should allow tech role to access /available', () => {
      // Test access granted
    });
  });
  
  describe('Admin Routes', () => {
    it('should require admin role for /admin', () => {
      // Test redirect for non-admin users
    });
    
    it('should allow admin role to access /admin', () => {
      // Test access granted
    });
  });
});
```

### Run Routing Tests

```bash
cd frontend
npm test -- branding.test.jsx
```

---

## Navigation Patterns

### Tab Navigation by Role

```jsx
const getTabs = (role) => {
  const commonTabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/notifications', label: 'Notifications' }
  ];
  
  if (role === 'tech' || role === 'admin') {
    return [
      ...commonTabs,
      { path: '/available', label: 'Available' },
      { path: '/earnings', label: 'Earnings' }
    ];
  }
  
  if (role === 'admin') {
    return [
      ...commonTabs,
      { path: '/admin', label: 'Admin' }
    ];
  }
  
  return commonTabs;
};
```

### Breadcrumb Navigation

```jsx
const getBreadcrumbs = (path) => {
  const crumbs = [{ label: 'Home', path: '/' }];
  
  if (path.startsWith('/admin')) {
    crumbs.push({ label: 'Admin', path: '/admin' });
    if (path.includes('/users')) {
      crumbs.push({ label: 'Users', path: '/admin/users' });
    }
  }
  
  if (path.startsWith('/tickets')) {
    crumbs.push({ label: 'Tickets', path: '/mytickets' });
  }
  
  return crumbs;
};
```

---

## References

- [Validation](./Validation.md)
- [Error Handling](./Error-Handling.md)
- [Security](./Security.md)
