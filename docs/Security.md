# Promote — Security Guidelines

## Overview

This document outlines security considerations, best practices, and implementation details for the Promote platform.

## Security Principles

1. **Defense in Depth** — Multiple layers of security
2. **Least Privilege** — Minimal permissions for each component
3. **Secure by Default** — Safe defaults in configuration
4. **Fail Securely** — Handle errors without exposing data

---

## Authentication

### Current Implementation
The current implementation uses name-based identity for simplicity.

```javascript
// Current approach (demo only)
app.get('/api/users/:name', async (req, res) => {
  const { name } = req.params;
  // User exists by name lookup
});
```

### Recommended Improvements

#### JWT-Based Authentication

```javascript
// Recommended: Add JWT authentication
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
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
};
```

#### Password Hashing

```javascript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### Session Management

```javascript
// Secure session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  name: 'promote_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
```

---

## Authorization

### Role-Based Access Control (RBAC)

```javascript
// Role middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
router.delete('/tickets/:id', 
  authenticate,
  requireRole('admin', 'customer'),
  async (req, res) => {
    // Only admins and original customers can delete
  }
);
```

### Resource Ownership

```javascript
// Check ticket ownership
const checkTicketAccess = async (req, res, next) => {
  const { id } = req.params;
  const ticket = await getTicketById(id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  // Admins have full access, others must be owner/assigned
  if (req.user.role !== 'admin' && 
      ticket.customer_name !== req.user.name &&
      ticket.tech_name !== req.user.name) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  req.ticket = ticket;
  next();
};
```

---

## Input Validation

### Validation Rules

```javascript
// Input validation example
const validateTicket = (data) => {
  const errors = [];
  
  if (!data.title || data.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!data.description || data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  
  if (!['dev', 'staging'].includes(data.environment)) {
    errors.push('Invalid environment');
  }
  
  if (!['low', 'normal', 'high', 'urgent', 'critical'].includes(data.priority)) {
    errors.push('Invalid priority');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### SQL Injection Prevention

```javascript
// Use parameterized queries
// ✓ Safe
const [rows] = await pool.query(
  'SELECT * FROM tickets WHERE customer_name = ?',
  [customerName]
);

// ✗ Vulnerable
const [rows] = await pool.query(
  `SELECT * FROM tickets WHERE customer_name = '${customerName}'`
);
```

### XSS Prevention

```javascript
// Sanitize HTML output
import DOMPurify from 'isomorphic-dompurify';

// When rendering user content
const sanitizeContent = (content) => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });
};
```

---

## Data Protection

### Sensitive Data Handling

```javascript
// Environment variables (NEVER commit these)
# .env file (add to .gitignore)
DB_PASSWORD=secretpassword
JWT_SECRET=long-random-secret-key
SESSION_SECRET=another-long-random-key
STRIPE_API_KEY=sk_live_xxxxx

// In code, use environment variables
const dbPassword = process.env.DB_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;
```

### Message Encryption

Current implementation uses Base64 encoding (demo only):

```javascript
// Current (demo) - Base64 encoding
const encrypt = (text) => Buffer.from(text).toString('base64');
const decrypt = (encoded) => Buffer.from(encoded, 'base64').toString('utf-8');
```

**Recommended: Use proper encryption:**

```javascript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

// Encrypt
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt
const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
```

---

## API Security

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' }
});

// Strict limit for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many authentication attempts' }
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
```

### CORS Configuration

```javascript
// Production CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Helmet Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet());

// Custom CSP for API
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
```

---

## Error Handling

### Secure Error Responses

```javascript
// ✓ Safe - Don't expose internal details
app.use((err, req, res, next) => {
  console.error(err); // Log internally
  
  res.status(500).json({
    error: 'An unexpected error occurred'
  });
});

// ✗ Vulnerable - Exposes details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: req.query
  });
});
```

### Validation Error Responses

```javascript
// Consistent error format
const errorResponse = (res, statusCode, message, details = null) => {
  const response = { error: message };
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  res.status(statusCode).json(response);
};

// Usage
if (!ticket) {
  return errorResponse(res, 404, 'Ticket not found');
}

if (validation.errors.length > 0) {
  return errorResponse(res, 400, 'Validation failed', validation.errors);
}
```

---

## Database Security

### Connection Security

```javascript
// Use SSL in production
const poolConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    ca: fs.readFileSync('/path/to/ca-cert.pem')
  } : undefined
};
```

### Principle of Least Privilege

```sql
-- Create user with minimal permissions
CREATE USER 'promote_app'@'localhost' IDENTIFIED BY 'secure_password';

-- App user (no DDL permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON promote.* TO 'promote_app'@'localhost';

-- Admin user (full access)
GRANT ALL PRIVILEGES ON promote.* TO 'promote_admin'@'localhost';
```

### Audit Logging

```javascript
// Log sensitive operations
const logAdminAction = async (adminName, action, details, ip) => {
  await pool.query(
    `INSERT INTO admin_logs (admin_name, action, details, ip_address)
     VALUES (?, ?, ?, ?)`,
    [adminName, action, JSON.stringify(details), ip]
  );
};

// Usage
app.delete('/api/admin/users/:id', async (req, res) => {
  await logAdminAction(
    req.user.name,
    'delete_user',
    { userId: req.params.id },
    req.ip
  );
  // ... perform action
});
```

---

## Security Checklist

### Before Production

- [ ] Environment variables configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] JWT authentication implemented
- [ ] Passwords hashed with bcrypt
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
- [ ] Secure headers enabled
- [ ] Error messages sanitized
- [ ] Audit logging enabled
- [ ] Database credentials secured
- [ ] SSL/TLS configured
- [ ] Secrets not in version control

### Regular Security Audits

- [ ] Dependency vulnerability scanning
- [ ] Code review for security issues
- [ ] Penetration testing
- [ ] Log analysis for suspicious activity
- [ ] Access control review
- [ ] Encryption key rotation
- [ ] Backup verification

---

## Security Incident Response

### If a Breach Occurs

1. **Contain** — Isolate affected systems
2. **Assess** — Determine scope of breach
3. **Notify** — Inform affected users (GDPR: 72 hours)
4. **Remediate** — Fix vulnerability
5. **Document** — Record incident details
6. **Review** — Update security measures

### Contact Information

- Security issues: security@promote.example
- Bug bounty program: See HACKING.md

---

## Dependencies to Monitor

| Package | Purpose | Security Notes |
|---------|---------|----------------|
| express | Web framework | Keep updated |
| mysql2 | Database driver | Parameterized queries |
| bcrypt | Password hashing | Use 12+ rounds |
| jsonwebtoken | Authentication | Short expiry times |
| helmet | Security headers | Enable all features |
| cors | Cross-origin | Whitelist domains |
| rate-limit | Rate limiting | Configure limits |

---

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MariaDB Security Documentation](https://mariadb.com/kb/en/security/)
