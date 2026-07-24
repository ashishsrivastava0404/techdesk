# TechDesk — Testing Guide

## Overview

This document outlines the testing strategy, tools, and procedures for the TechDesk platform. The project includes comprehensive unit tests for backend services and build verification for the frontend.

---

## Test Structure

```
backend/
├── tests/
│   ├── errorHandler.test.js     # Error handling middleware tests
│   ├── credits.test.js          # Credit service tests
│   ├── fallback.test.js         # Redis fallback system tests
│   ├── categories.test.js       # Category hierarchy tests
│   └── ticketComments.test.js   # Threaded comments tests
└── jest.config.js               # Jest configuration
```

---

## Running Tests

### Backend Tests

```bash
# Run all tests
cd backend && npm test

# Run tests with coverage
cd backend && npm test -- --coverage

# Run specific test file
cd backend && npm test -- errorHandler.test.js

# Run tests in watch mode
cd backend && npm test -- --watch
```

### Frontend Build

```bash
# Development build
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

---

## Backend Tests

### Technology Stack
- **Jest** — Testing framework
- **Node.js ES Modules** — Using `NODE_OPTIONS='--experimental-vm-modules'`

### Configuration

```javascript
// backend/jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

---

## Error Handler Tests

**File:** `backend/tests/errorHandler.test.js`

### Test Coverage

| Test Suite | Tests | Description |
|------------|-------|-------------|
| errorHandler | 8 tests | Error middleware functionality |
| asyncHandler | 3 tests | Async wrapper behavior |
| notFoundHandler | 2 tests | 404 handling |

### Test Cases

#### errorHandler
```javascript
describe('errorHandler', () => {
  it('should log error details', () => { /* ... */ });
  it('should use custom statusCode when provided', () => { /* ... */ });
  it('should default to 500 status code', () => { /* ... */ });
  it('should expose error message in non-production', () => { /* ... */ });
  it('should hide error message in production', () => { /* ... */ });
  it('should include stack trace in development', () => { /* ... */ });
  it('should not include stack trace in production', () => { /* ... */ });
  it('should call Sentry captureException when req.sentry is available', () => { /* ... */ });
});
```

#### asyncHandler
```javascript
describe('asyncHandler', () => {
  it('should call the wrapped function with req, res, next', () => { /* ... */ });
  it('should catch errors and pass to next', () => { /* ... */ });
  it('should work with async functions returning values', () => { /* ... */ });
});
```

#### notFoundHandler
```javascript
describe('notFoundHandler', () => {
  it('should return 404 status', () => { /* ... */ });
  it('should return not found error with path', () => { /* ... */ });
});
```

---

## Credit Service Tests

**File:** `backend/tests/credits.test.js`

### Test Coverage

| Test Suite | Tests | Description |
|------------|-------|-------------|
| calculateTicketCost | 14 tests | Priority-based cost calculation |
| validateCreditDeduction | 4 tests | Credit deduction validation |
| validateTransfer | 2 tests | Transfer validation |
| payment processing | 3 tests | Payment indicator logic |
| balance calculation | 6 tests | Balance update logic |

### Test Cases

#### Priority-Based Cost Calculation
```javascript
describe('CreditService - calculateTicketCost', () => {
  describe('priority-based cost calculation', () => {
    it('should return 0 for low priority tickets', () => { /* ... */ });
    it('should return 0 for normal priority tickets', () => { /* ... */ });
    it('should return 50% of basePay for high priority tickets', () => { /* ... */ });
    it('should return 75% of basePay for urgent priority tickets', () => { /* ... */ });
    it('should return full basePay for critical priority tickets', () => { /* ... */ });
    it('should return 0 for unknown priority', () => { /* ... */ });
  });

  describe('rounding behavior', () => {
    it('should ceil the result for high priority with decimal', () => { /* ... */ });
    it('should ceil the result for urgent priority with decimal', () => { /* ... */ });
    it('should handle small decimal values correctly', () => { /* ... */ });
  });

  describe('edge cases', () => {
    it('should handle zero basePay', () => { /* ... */ });
    it('should handle large basePay values', () => { /* ... */ });
    it('should handle negative basePay values gracefully', () => { /* ... */ });
  });

  describe('relative cost relationships', () => {
    it('should have correct cost hierarchy', () => { /* ... */ });
    it('should have correct percentage relationships', () => { /* ... */ });
  });
});
```

#### Credit Validation
```javascript
describe('CreditService - credit validation logic', () => {
  describe('validateCreditDeduction', () => {
    it('should allow deduction when balance is sufficient', () => { /* ... */ });
    it('should allow deduction when balance equals amount', () => { /* ... */ });
    it('should throw error when balance is insufficient', () => { /* ... */ });
    it('should throw error when balance is 0', () => { /* ... */ });
  });

  describe('validateTransfer', () => {
    it('should allow transfer between different users', () => { /* ... */ });
    it('should throw error when transferring to self', () => { /* ... */ });
  });
});
```

### Credit Cost Hierarchy

| Priority | Cost % | Example ($100 basePay) |
|----------|--------|------------------------|
| Low | 0% | $0 |
| Normal | 0% | $0 |
| High | 50% | $50 |
| Urgent | 75% | $75 |
| Critical | 100% | $100 |

---

## Frontend Testing

### Build Verification

The frontend uses Vite for building. Tests are primarily build verification:

```bash
# Successful build output
✓ 69 modules transformed.
dist/index.html                   4.06 kB │ gzip:  1.27 kB
dist/assets/index-Cugl2fXz.css   21.31 kB │ gzip:  4.50 kB
dist/assets/index-skmTegsU.js   380.48 kB │ gzip: 98.76 kB
✓ built in 1.10s
```

### Build Checklist

- [x] No build errors
- [x] All modules resolved
- [x] Assets generated correctly
- [x] CSS bundled
- [x] JS bundled and minified

---

## API Testing

### Manual API Testing

Use curl or Postman to test API endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Rate Limiting Verification

```bash
# Test rate limiting (make 6+ requests to /api/auth)
# Should receive 429 after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

---

## Test Environment Setup

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Environment Variables
```bash
# backend/.env
NODE_ENV=test
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_NAME=promote_test
PORT=3001
JWT_SECRET=test-secret-key
```

---

## Test Execution

### Full Test Suite
```bash
cd backend && npm test
```

### Expected Output
```
> promote-backend@1.0.0 test
> NODE_OPTIONS='--experimental-vm-modules' jest

 PASS  tests/categories.test.js
  TicketCategoryHierarchy
    ✓ should have all main categories defined
    ✓ should have required properties on each category
    ✓ should have subcategories with topics
    ✓ should have valid topic structure
    ✓ should return array of categories with required fields
    ✓ should return category with subcategories
    ✓ should return null for invalid category
    ✓ should return complete path for valid hierarchy
    ✓ should return null for invalid paths
    ✓ should validate category paths correctly
    ✓ should get topic for valid path
    ✓ should have at least 7 main categories
    ✓ should have icons for all categories
    ✓ should have at least 1 subcategory per main category
    ✓ should have at least 1 topic per subcategory

 PASS  tests/ticketComments.test.js
  TicketComments
    ✓ should have required fields for comment object
    ✓ should support threaded replies via parent_id
    ✓ should distinguish internal vs public comments
    ✓ should allow ticket owner to view comments
    ✓ should allow assigned tech to view comments
    ✓ should allow admin to view all comments
    ✓ should restrict internal notes to technicians/admins only
    ✓ should organize comments into threads
    ✓ should support all message types
    ✓ should assign roles correctly
    ✓ should return success response format
    ✓ should return error response format

 PASS  tests/fallback.test.js
  In-Memory Cache Service
    ✓ should store and retrieve string values
    ✓ should store and retrieve object values
    ✓ should return null for non-existent keys
    ✓ should respect TTL and expire entries
    ✓ should delete existing keys
    ✓ should return false for non-existent keys
    ✓ should return true for existing keys
    ✓ should clear all cache entries
  In-Memory Session Service
    ✓ should create a session
    ✓ should retrieve existing session
    ✓ should return null for non-existent session
    ✓ should update existing session
    ✓ should delete existing session
    ✓ should delete all sessions for a user
  In-Memory Token Service
    ✓ should create refresh token
    ✓ should verify valid refresh token
    ✓ should revoke token
    ✓ should create password reset token
    ✓ should verify and consume password reset token
    ✓ should create OAuth state
    ✓ should verify and consume OAuth state
  Memory Store Statistics
    ✓ should return correct counts
    ✓ should clear all stores

 PASS  tests/errorHandler.test.js
 PASS  tests/credits.test.js

Test Suites: 5 passed, 5 total
Tests:       106 passed, 106 total
```

---

## Adding New Tests

### Create Test File
```bash
touch backend/tests/myService.test.js
```

### Write Tests
```javascript
// backend/tests/myService.test.js
import { describe, it, expect } from '@jest/globals';

describe('MyService', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

### Run Tests
```bash
npm test -- myService.test.js
```

---

## Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Error Handler | 12 | ✅ Complete |
| Credit Service | 29 | ✅ Complete |
| Redis Fallback System | 28 | ✅ Complete |
| Category Hierarchy | 17 | ✅ Complete |
| Threaded Comments | 20 | ✅ Complete |
| **Total** | **106** | ✅ **All Passing** |

---

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
```

---

## Troubleshooting

### Tests Not Running
1. Check Node.js version (18+ required)
2. Verify dependencies installed
3. Check jest.config.js exists

### Database Connection Errors
1. Ensure MySQL/MariaDB is running
2. Check database credentials in .env
3. Verify database exists

### Build Errors
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check for TypeScript errors (if applicable)
3. Verify all imports are correct

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vite Testing](https://vitejs.dev/guide/testing.html)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices)
