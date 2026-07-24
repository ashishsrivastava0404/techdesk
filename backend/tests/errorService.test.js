/**
 * Error Service Tests
 * Comprehensive tests for error handling
 */

import { describe, it, expect } from '@jest/globals';
import { errorService, ERROR_CODES } from '../src/services/errorService.js';

// ============================================
// ERROR CODE TESTS
// ============================================

describe('Error Codes', () => {
  it('should have authentication error codes', () => {
    expect(ERROR_CODES.AUTH_REQUIRED).toBe('AUTH_001');
    expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_002');
    expect(ERROR_CODES.AUTH_TOKEN_EXPIRED).toBe('AUTH_003');
    expect(ERROR_CODES.AUTH_FORBIDDEN).toBe('AUTH_005');
  });

  it('should have validation error codes', () => {
    expect(ERROR_CODES.VALIDATION_REQUIRED).toBe('VAL_001');
    expect(ERROR_CODES.VALIDATION_INVALID_EMAIL).toBe('VAL_005');
    expect(ERROR_CODES.VALIDATION_MAX_LENGTH).toBe('VAL_004');
  });

  it('should have resource error codes', () => {
    expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RES_001');
    expect(ERROR_CODES.RESOURCE_ALREADY_EXISTS).toBe('RES_002');
  });

  it('should have business error codes', () => {
    expect(ERROR_CODES.BUSINESS_INSUFFICIENT_CREDITS).toBe('BIZ_001');
    expect(ERROR_CODES.BUSINESS_TICKET_ALREADY_CLAIMED).toBe('BIZ_005');
    expect(ERROR_CODES.BUSINESS_PAYMENT_FAILED).toBe('BIZ_007');
  });

  it('should have server error codes', () => {
    expect(ERROR_CODES.SERVER_DATABASE_ERROR).toBe('SRV_001');
    expect(ERROR_CODES.SERVER_INTERNAL_ERROR).toBe('SRV_003');
  });

  it('should have rate limit error codes', () => {
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_001');
  });
});

// ============================================
// CREATE ERROR TESTS
// ============================================

describe('createError', () => {
  it('should create error with correct code', () => {
    const error = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(error.code).toBe('RES_001');
  });

  it('should create error with user-friendly message', () => {
    const error = errorService.createError(ERROR_CODES.VALIDATION_REQUIRED);
    expect(error.userMessage).toContain('required');
  });

  it('should create error with custom message', () => {
    const error = errorService.createError(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      'Custom message',
      'Custom user message'
    );
    expect(error.message).toBe('Custom message');
    expect(error.userMessage).toBe('Custom user message');
  });

  it('should create error with details', () => {
    const error = errorService.createError(
      ERROR_CODES.VALIDATION_REQUIRED,
      null, null,
      { field: 'email', value: '' }
    );
    expect(error.details).toEqual({ field: 'email', value: '' });
  });

  it('should set correct status code', () => {
    const notFound = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(notFound.statusCode).toBe(404);

    const badRequest = errorService.createError(ERROR_CODES.VALIDATION_REQUIRED);
    expect(badRequest.statusCode).toBe(400);
  });

  it('should mark as operational error', () => {
    const error = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(error.isOperational).toBe(true);
  });
});

// ============================================
// VALIDATION ERROR TESTS
// ============================================

describe('validationError', () => {
  it('should create required field error', () => {
    const error = errorService.validationError('email', 'required');
    expect(error.code).toBe('VAL_001');
    expect(error.userMessage).toContain('Email');
    expect(error.userMessage).toContain('required');
  });

  it('should create min length error', () => {
    const error = errorService.validationError('password', 'minLength');
    expect(error.code).toBe('VAL_003');
    expect(error.userMessage).toContain('too short');
  });

  it('should create max length error', () => {
    const error = errorService.validationError('title', 'maxLength');
    expect(error.code).toBe('VAL_004');
    expect(error.userMessage).toContain('too long');
  });

  it('should create email validation error', () => {
    const error = errorService.validationError('email', 'email');
    expect(error.code).toBe('VAL_005');
    expect(error.userMessage).toContain('valid');
    expect(error.userMessage).toContain('email');
  });

  it('should create URL validation error', () => {
    const error = errorService.validationError('website', 'url');
    expect(error.code).toBe('VAL_006');
    expect(error.userMessage).toContain('valid');
  });

  it('should create enum validation error', () => {
    const error = errorService.validationError('status', 'enum');
    expect(error.code).toBe('VAL_007');
    expect(error.userMessage).toContain('select a valid option');
  });

  it('should include field in details', () => {
    const error = errorService.validationError('name', 'required');
    expect(error.details.field).toBe('name');
  });
});

// ============================================
// NOT FOUND ERROR TESTS
// ============================================

describe('notFoundError', () => {
  it('should create not found error', () => {
    const error = errorService.notFoundError('Ticket');
    expect(error.code).toBe('RES_001');
    expect(error.statusCode).toBe(404);
  });

  it('should include resource type in message', () => {
    const error = errorService.notFoundError('User');
    expect(error.userMessage).toContain('User');
  });

  it('should include identifier in details', () => {
    const error = errorService.notFoundError('Ticket', 123);
    expect(error.details.resourceType).toBe('Ticket');
    expect(error.details.identifier).toBe(123);
  });

  it('should format resource name properly', () => {
    const error = errorService.notFoundError('support_report');
    expect(error.userMessage).toContain('Support report');
  });
});

// ============================================
// AUTH ERROR TESTS
// ============================================

describe('authError', () => {
  it('should create auth required error', () => {
    const error = errorService.authError('required');
    expect(error.code).toBe('AUTH_001');
    expect(error.statusCode).toBe(401);
  });

  it('should create invalid credentials error', () => {
    const error = errorService.authError('invalid');
    expect(error.code).toBe('AUTH_002');
    expect(error.userMessage).toContain('incorrect');
  });

  it('should create expired token error', () => {
    const error = errorService.authError('expired');
    expect(error.code).toBe('AUTH_003');
    expect(error.userMessage).toContain('expired');
  });

  it('should create forbidden error', () => {
    const error = errorService.authError('forbidden');
    expect(error.code).toBe('AUTH_005');
    expect(error.statusCode).toBe(403);
  });
});

// ============================================
// BUSINESS ERROR TESTS
// ============================================

describe('businessError', () => {
  it('should create insufficient credits error', () => {
    const error = errorService.businessError('insufficientCredits');
    expect(error.code).toBe('BIZ_001');
    expect(error.userMessage).toContain('credits');
  });

  it('should create ticket claimed error', () => {
    const error = errorService.businessError('ticketClaimed');
    expect(error.code).toBe('BIZ_005');
    expect(error.userMessage).toContain('claimed');
  });

  it('should create ticket resolved error', () => {
    const error = errorService.businessError('ticketResolved');
    expect(error.code).toBe('BIZ_006');
    expect(error.userMessage).toContain('resolved');
  });

  it('should create payment failed error', () => {
    const error = errorService.businessError('paymentFailed');
    expect(error.code).toBe('BIZ_007');
    expect(error.userMessage).toContain('payment');
  });

  it('should create with custom message', () => {
    const error = errorService.businessError('notAllowed', 'Custom error');
    expect(error.message).toBe('Custom error');
  });
});

// ============================================
// DATABASE ERROR TESTS
// ============================================

describe('Database Error Handling', () => {
  it('should create database error', () => {
    const error = errorService.databaseError('insert');
    expect(error.code).toBe('SRV_001');
    expect(error.statusCode).toBe(500);
  });

  it('should handle duplicate entry error', () => {
    const dbError = { code: 'ER_DUP_ENTRY', message: 'Duplicate entry' };
    const error = errorService.handleDatabaseError(dbError);
    expect(error.code).toBe('BIZ_003');
  });

  it('should handle foreign key error', () => {
    const dbError = { code: 'ER_NO_REFERENCED_ROW_2', message: 'Foreign key error' };
    const error = errorService.handleDatabaseError(dbError);
    expect(error.code).toBe('RES_001');
  });

  it('should handle child row error', () => {
    const dbError = { code: 'ER_ROW_IS_REFERENCED_2', message: 'Cannot delete' };
    const error = errorService.handleDatabaseError(dbError);
    expect(error.code).toBe('BIZ_004');
  });
});

// ============================================
// FORMAT FIELD NAME TESTS
// ============================================

describe('formatFieldName', () => {
  it('should format snake_case', () => {
    expect(errorService.formatFieldName('customer_name')).toBe('Customer name');
  });

  it('should handle field names with underscores', () => {
    const formatted = errorService.formatFieldName('first_name');
    expect(formatted).toContain('First');
    expect(formatted).toContain('name');
  });

  it('should capitalize first letter', () => {
    expect(errorService.formatFieldName('email')).toBe('Email');
  });

  it('should handle multiple words', () => {
    expect(errorService.formatFieldName('support_ticket_id')).toBe('Support ticket id');
  });
});

// ============================================
// BUILD RESPONSE TESTS
// ============================================

describe('buildResponse', () => {
  it('should build success false', () => {
    const error = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    const response = errorService.buildResponse(error);
    expect(response.success).toBe(false);
  });

  it('should include error code', () => {
    const error = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    const response = errorService.buildResponse(error);
    expect(response.error.code).toBe('RES_001');
  });

  it('should include user-friendly message', () => {
    const error = errorService.createError(ERROR_CODES.VALIDATION_REQUIRED);
    const response = errorService.buildResponse(error);
    expect(response.error.message).toContain('required');
  });

  it('should include timestamp', () => {
    const error = errorService.createError(ERROR_CODES.RESOURCE_NOT_FOUND);
    const response = errorService.buildResponse(error);
    expect(response.timestamp).toBeDefined();
  });

  it('should include details in development', () => {
    const error = errorService.createError(
      ERROR_CODES.VALIDATION_REQUIRED,
      null, null,
      { field: 'test' }
    );
    const response = errorService.buildResponse(error);
    // Details should be included when NODE_ENV is not production
    expect(response.error).toBeDefined();
  });
});

// ============================================
// BUILD VALIDATION RESPONSE TESTS
// ============================================

describe('buildValidationResponse', () => {
  it('should build validation response', () => {
    const errors = [
      errorService.validationError('email', 'required'),
      errorService.validationError('password', 'minLength')
    ];
    const response = errorService.buildValidationResponse(errors);
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.errors).toHaveLength(2);
  });

  it('should include field in each error', () => {
    const errors = [errorService.validationError('email', 'required')];
    const response = errorService.buildValidationResponse(errors);
    
    expect(response.error.errors[0].field).toBe('email');
  });

  it('should include user message in each error', () => {
    const errors = [errorService.validationError('name', 'required')];
    const response = errorService.buildValidationResponse(errors);
    
    expect(response.error.errors[0].message).toBeDefined();
  });
});

// ============================================
// STATUS CODE TESTS
// ============================================

describe('Status Codes', () => {
  it('should have 401 for auth errors', () => {
    const error = errorService.authError('required');
    expect(error.statusCode).toBe(401);
  });

  it('should have 403 for forbidden', () => {
    const error = errorService.authError('forbidden');
    expect(error.statusCode).toBe(403);
  });

  it('should have 400 for validation errors', () => {
    const error = errorService.validationError('email', 'required');
    expect(error.statusCode).toBe(400);
  });

  it('should have 404 for not found', () => {
    const error = errorService.notFoundError('Ticket');
    expect(error.statusCode).toBe(404);
  });

  it('should have 402 for insufficient credits', () => {
    const error = errorService.businessError('insufficientCredits');
    expect(error.statusCode).toBe(402);
  });

  it('should have 409 for duplicate', () => {
    const dbError = { code: 'ER_DUP_ENTRY' };
    const error = errorService.handleDatabaseError(dbError);
    expect(error.statusCode).toBe(409);
  });

  it('should have 500 for database errors', () => {
    const error = errorService.databaseError();
    expect(error.statusCode).toBe(500);
  });

  it('should have 429 for rate limit', () => {
    const error = errorService.createError(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    expect(error.statusCode).toBe(429);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration: Real-world Scenarios', () => {
  it('should handle ticket not found', () => {
    const error = errorService.notFoundError('Ticket', 12345);
    const response = errorService.buildResponse(error);
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('RES_001');
    expect(error.details.identifier).toBe(12345);
  });

  it('should handle login failure', () => {
    const error = errorService.authError('invalid');
    const response = errorService.buildResponse(error);
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('AUTH_002');
    expect(response.error.message).toContain('incorrect');
  });

  it('should handle form validation', () => {
    const errors = [
      errorService.validationError('email', 'email'),
      errorService.validationError('password', 'minLength'),
      errorService.validationError('name', 'required')
    ];
    const response = errorService.buildValidationResponse(errors);
    
    expect(response.success).toBe(false);
    expect(response.error.errors).toHaveLength(3);
    expect(response.error.errors.some(e => e.field === 'email')).toBe(true);
    expect(response.error.errors.some(e => e.field === 'password')).toBe(true);
    expect(response.error.errors.some(e => e.field === 'name')).toBe(true);
  });

  it('should handle payment failure', () => {
    const error = errorService.businessError('paymentFailed');
    const response = errorService.buildResponse(error);
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('BIZ_007');
    expect(response.error.message).toContain('payment');
  });

  it('should handle duplicate ticket creation', () => {
    const dbError = { code: 'ER_DUP_ENTRY', message: 'Duplicate entry' };
    const error = errorService.handleDatabaseError(dbError);
    const response = errorService.buildResponse(error);
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('BIZ_003');
  });
});
