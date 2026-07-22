# Promote — Error Handling Guide

## Overview

This document describes the error handling patterns used in the Promote application, including backend API errors and frontend error states.

## Table of Contents

1. [HTTP Status Codes](#http-status-codes)
2. [Error Response Format](#error-response-format)
3. [Backend Error Handling](#backend-error-handling)
4. [Frontend Error Handling](#frontend-error-handling)
5. [Common Errors](#common-errors)
6. [Logging](#logging)

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Internal Server Error | Unexpected error |

---

## Error Response Format

### Backend Format

All API errors return a consistent JSON format:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors with multiple issues:

```json
{
  "error": "Validation failed",
  "details": [
    "Title must be at least 3 characters",
    "Description is required"
  ]
}
```

### Frontend Toast Format

Errors displayed to users via toast notifications:

```javascript
// From AppContext
const { showToast } = useApp();
showToast('Error message', 'error');
```

---

## Backend Error Handling

### Global Error Handler

```javascript
// backend/src/index.js
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  
  res.status(500).json({ error: message });
});
```

### Route-Level Error Handling

```javascript
// Pattern: Try-catch with consistent error responses
router.post('/', async (req, res) => {
  try {
    const { title, description, customer_name } = req.body;
    
    // Validation
    if (!title || !description || !customer_name) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }
    
    // Database operation
    const [result] = await pool.query(
      'INSERT INTO tickets (title, description, customer_name) VALUES (?, ?, ?)',
      [title, description, customer_name]
    );
    
    // Success response
    const [rows] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
    
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ 
      error: 'Failed to create ticket' 
    });
  }
});
```

### Custom Error Classes

```javascript
// For specific error types
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

// Usage
throw new NotFoundError('Ticket');
```

---

## Frontend Error Handling

### API Client Error Handling

```javascript
// frontend/src/api/index.js
async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Request failed' 
      }));
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Component-Level Error Handling

```javascript
// Example: Loading data with error handling
function MyTickets() {
  const { user, showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.tickets.list({ 
          customer_name: user.name 
        });
        setTickets(data);
      } catch (err) {
        setError(err.message);
        showToast('Failed to load tickets', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.name) {
      fetchTickets();
    }
  }, [user?.name]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div>
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### Form Submission Error Handling

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    await api.tickets.create({
      title,
      description,
      customer_name: user.name
    });
    showToast('Ticket created successfully!');
    // Redirect or reset form
  } catch (error) {
    showToast(error.message || 'Failed to create ticket', 'error');
  } finally {
    setLoading(false);
  }
};
```

---

## Common Errors

### Backend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing required fields` | Incomplete POST data | Include all required fields |
| `Ticket not found` | Invalid ticket ID | Verify ID exists |
| `Not authorized` | User lacks permission | Check user role |
| `Failed to create ticket` | Database error | Check DB connection |

### Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Network Error` | API unreachable | Check backend is running |
| `Failed to load` | API returned error | Check API response |
| `Invalid input` | Form validation failed | Fix input values |

### Database Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ER_DUP_ENTRY` | Duplicate key | Use unique values |
| `ER_NO_SUCH_TABLE` | Table doesn't exist | Run database init |
| `ER_ACCESS_DENIED` | Wrong credentials | Check .env settings |

---

## Logging

### Backend Logging

```javascript
// Console logging for development
console.log('Info message');
console.error('Error message');
console.warn('Warning message');

// Structured logging for production
const log = {
  timestamp: new Date().toISOString(),
  level: 'error',
  message: error.message,
  stack: error.stack,
  path: req.path,
  method: req.method,
  user: req.user?.name
};

console.log(JSON.stringify(log));
```

### Log Levels

```javascript
// Usage examples
console.debug('Debug: entering function');  // Development only
console.log('Info: operation succeeded');     // General info
console.warn('Warning: unusual condition');   // Non-critical issues
console.error('Error: operation failed');    // Errors
```

### Request Logging

```javascript
// Log all requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});
```

---

## Error Recovery

### Retry Logic

```javascript
const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

### Fallback Values

```javascript
// Provide fallback for failed data loads
const [data, setData] = useState([]);

useEffect(() => {
  api.tickets.list()
    .then(setData)
    .catch(() => {
      // Keep empty array as fallback
      showToast('Failed to load, showing cached data');
    });
}, []);
```

---

## User-Facing Error Messages

### Customer Messages

| Situation | Message |
|----------|---------|
| Ticket creation failed | "Unable to submit ticket. Please try again." |
| Not authorized | "You don't have permission to view this." |
| Rate limited | "Too many requests. Please wait a moment." |

### Tech Messages

| Situation | Message |
|----------|---------|
| Ticket claim failed | "Unable to claim ticket. It may have been taken." |
| Already claimed | "This ticket is already assigned to another tech." |
| Cannot resolve | "Ticket must be claimed before marking resolved." |

### Admin Messages

| Situation | Message |
|----------|---------|
| User update failed | "Unable to update user. Please try again." |
| Setting lock | "This setting cannot be modified." |
| Payout rejected | "Unable to process payout. Please verify details." |

---

## Testing Error Handling

```javascript
// Example Jest tests
describe('API Error Handling', () => {
  test('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'Test' }); // Missing description
      
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
  
  test('returns 404 for non-existent ticket', async () => {
    const res = await request(app)
      .get('/api/tickets/99999');
      
    expect(res.status).toBe(404);
  });
});
```

---

## Best Practices

1. **Always catch errors** — Prevent unhandled promise rejections
2. **Log errors** — Include context for debugging
3. **User-friendly messages** — Don't expose technical details
4. **Consistent format** — Use the same error structure everywhere
5. **Graceful degradation** — Show fallback UI when possible
6. **Toast notifications** — Inform users of errors briefly
