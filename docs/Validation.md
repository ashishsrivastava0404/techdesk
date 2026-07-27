# Validation Documentation

## Overview

This document describes the comprehensive validation system implemented across the TechDesk application, covering all validations, notifications, and routing patterns.

## Table of Contents

1. [Validation Types](#validation-types)
2. [Error Codes](#error-codes)
3. [Notification System](#notification-system)
4. [Routing Validation](#routing-validation)
5. [API Validation](#api-validation)
6. [Form Validation](#form-validation)
7. [Database Error Handling](#database-error-handling)

---

## Validation Types

### Category Validation

The ticket category system uses a hierarchical structure:

```
Category > Subcategory > Topic
```

**Categories:**
- `hardware` - Physical equipment and device problems
- `software` - Application and software issues
- `network` - Network connectivity problems
- `access` - Permission and access issues
- `data` - Data management and storage
- `account` - User account related issues
- `training` - Training and learning resources
- `other` - Miscellaneous issues

**Validation Functions:**

```javascript
// Validate complete category path
validateCategoryPath(category, subcategory, topic) → boolean

// Get full path details
getFullPath(category, subcategory, topic) → {
  category: { id, name, icon },
  subcategory: { id, name },
  topic: { id, name }
}
```

### Authentication Validation

| Error Type | Code | Status | Description |
|------------|------|--------|-------------|
| Required | AUTH_001 | 401 | Authentication is required |
| Invalid Credentials | AUTH_002 | 401 | Email or password is incorrect |
| Token Expired | AUTH_003 | 401 | Session has expired |
| Token Invalid | AUTH_004 | 401 | Invalid authentication token |
| Forbidden | AUTH_005 | 403 | Access denied |
| Unauthorized | AUTH_006 | 401 | Not authorized to perform action |

### Form Validation

| Constraint | Code | Description |
|------------|------|-------------|
| Required | VAL_001 | Field is required |
| Invalid Format | VAL_002 | Format is invalid |
| Min Length | VAL_003 | Below minimum length |
| Max Length | VAL_004 | Exceeds maximum length |
| Invalid Email | VAL_005 | Email format is invalid |
| Invalid URL | VAL_006 | URL format is invalid |
| Invalid Enum | VAL_007 | Value not in allowed list |

---

## Error Codes

### Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 1000-1999 | Authentication | Auth and session errors |
| 2000-2999 | Validation | Form and input validation |
| 3000-3999 | Resource | Resource not found/already exists |
| 4000-4999 | Business | Business logic errors |
| 5000-5999 | Server | Internal server errors |
| RATE_* | Rate Limit | Rate limiting errors |
| FILE_* | File Upload | File handling errors |

### Error Service API

```javascript
// Create generic error
errorService.createError(code, customMessage, userMessage, details)

// Create validation error
errorService.validationError(field, constraint, value)

// Create not found error
errorService.notFoundError(resourceType, identifier)

// Create auth error
errorService.authError(type)

// Create business error
errorService.businessError(type, customMessage)

// Create database error
errorService.databaseError(operation)

// Handle database errors
errorService.handleDatabaseError(dbError)

// Build API response
errorService.buildResponse(error)
errorService.buildValidationResponse(errors)
```

---

## Notification System

### Notification Types

| Event | Channels | Priority |
|-------|----------|----------|
| Ticket Created | in_app, email | normal |
| Ticket Claimed | in_app, email | high |
| Ticket Resolved | in_app, email, push | normal |
| Comment Added | in_app, push | normal |
| Payment Received | in_app, email | high |
| Payout Approved | in_app, email | normal |
| New Lead | in_app, push | high |
| Rating Received | in_app | normal |
| Reminder | in_app, SMS | low |

### Notification Channels

- **in_app** - In-application notifications
- **email** - Email notifications
- **push** - Push notifications
- **sms** - SMS notifications

### Quiet Hours

Users can configure quiet hours to prevent notifications during specified times:

```javascript
isInQuietHours(userPreferences, currentTime) → boolean
```

---

## Routing Validation

### Route Types

| Route Type | Auth Required | Role Required |
|------------|--------------|--------------|
| Public | No | None |
| Protected | Yes | None |
| Tech | Yes | tech |
| Admin | Yes | admin |

### Protected Routes

```javascript
// Public routes (no auth required)
/           - Landing page
/login      - Login page
/signup     - Signup page
/terms      - Terms of service
/privacy    - Privacy policy
/cookies    - Cookie policy
/faq        - FAQ page
/pricing    - Pricing page

// Protected routes (auth required)
/dashboard      - User dashboard
/submit        - Submit ticket
/mytickets     - My tickets
/notifications  - Notifications

// Tech routes (tech role required)
/available   - Available tickets
/leads       - Lead management
/earnings    - Earnings tracker

// Admin routes (admin role required)
/admin           - Admin dashboard
/admin/users     - User management
/admin/payments  - Payment management
/admin/credits   - Credit management
/admin/analytics - Analytics
/admin/settings   - Settings
```

---

## API Validation

### Ticket API

**POST /api/tickets**

Required fields:
- `title` - Ticket title
- `description` - Detailed description
- `customer_name` - Customer's name
- `category` - Category ID
- `subcategory` - Subcategory ID
- `topic` - Topic ID

Validation:
- Category path must be valid
- Title required, max 200 characters
- Description required, max 5000 characters

### Message API

**POST /api/messages**

Required fields:
- `ticket_id` - Ticket ID
- `content` - Message content (non-empty)
- `type` - Message type (comment, note, internal, resolution)

### Credit API

**POST /api/credits/deduct**

Validation:
- Balance must be sufficient
- Amount must be positive
- Cannot transfer to self

---

## Form Validation

### Login Form

| Field | Validation |
|-------|------------|
| email | Required, valid email format |
| password | Required |

### Signup Form

| Field | Validation |
|-------|------------|
| email | Required, valid email format |
| password | Required, min 8 characters |
| name | Required |

### Ticket Submission Form

| Field | Validation |
|-------|------------|
| title | Required, max 200 chars |
| description | Required, max 5000 chars |
| category | Required, valid category path |
| priority | Required, one of: low, normal, high, urgent, critical |

---

## Database Error Handling

| Error Code | Error Code Returned | Description |
|------------|---------------------|-------------|
| ER_DUP_ENTRY | BIZ_003 | Duplicate entry |
| ER_NO_REFERENCED_ROW_2 | RES_001 | Foreign key violation (referenced row doesn't exist) |
| ER_ROW_IS_REFERENCED_2 | BIZ_004 | Cannot delete (child rows exist) |
| Other | SRV_001 | General database error |

---

## Credit System Validation

### Ticket Cost Calculation

| Priority | Cost % | Example ($100 base) |
|----------|--------|---------------------|
| low | 0% | $0 |
| normal | 0% | $0 |
| high | 50% | $50 |
| urgent | 75% | $75 |
| critical | 100% | $100 |

### Validation Rules

- **Credit Deduction**: Balance must be >= amount
- **Transfer**: Cannot transfer to self
- **Negative Balance**: Not allowed

---

## Testing

Run all validation tests:

```bash
# Backend validation tests
cd backend
npm test -- validation.test.js

# All backend tests
npm test

# Frontend tests
cd ../frontend
npm test
```

### Test Coverage

| Category | Tests |
|----------|-------|
| Category Validation | 15 |
| Error Service | 45 |
| Credits Validation | 15 |
| Integration Scenarios | 25 |
| Error Codes | 21 |
| **Total** | **121** |

---

## Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": "field_name",
      "constraint": "constraint_type"
    }
  },
  "timestamp": "ISO8601 timestamp"
}
```

### Validation Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "timestamp": "ISO8601 timestamp"
}
```

---

## Fallback Behavior

### i18n Fallbacks

- Unknown language → English (en)
- Missing translation → English template
- Unknown template key → Error thrown

### Error Fallbacks

- Unknown error code → Generic message
- Missing user message → Technical message
- Unknown database error → SRV_001 (Server Error)

### Payment Fallbacks

- Unknown priority → 0 (free)
- Missing credit balance → 0
- Failed deduction → Throw error

---

## References

- [Error Handling](./Error-Handling.md)
- [Messaging Integration](./MessagingIntegration.md)
- [Testing](./Testing.md)
- [Security](./Security.md)
