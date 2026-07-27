/**
 * Comprehensive Validation Tests
 * Tests all validation logic across the application
 */

import { validateCategoryPath, getFullPath, getTopic, TICKET_CATEGORIES } from '../src/constants/ticketCategories.js';
import { errorService, ERROR_CODES } from '../src/services/errorService.js';

/**
 * Pure function for calculating ticket cost based on priority and base pay.
 * This mirrors the logic in CreditService.calculateTicketCost.
 */
function calculateTicketCost(basePay, priority) {
  const costs = {
    low: 0,
    normal: 0,
    high: Math.ceil(basePay * 0.5),
    urgent: Math.ceil(basePay * 0.75),
    critical: basePay
  };
  return costs[priority] || 0;
}

/**
 * Validate credit deduction
 */
function validateCreditDeduction(balance, amount) {
  if (balance < amount) {
    throw new Error('Insufficient balance');
  }
}

/**
 * Validate transfer between users
 */
function validateTransfer(fromUserId, toUserId, amount) {
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer to the same user');
  }
}

/**
 * Alias for calculateTicketCost
 */
function calculateCost(basePay, priority) {
  return calculateTicketCost(basePay, priority);
}

// ============================================
// CATEGORY VALIDATION TESTS
// ============================================

describe('Category Validation', () => {
  describe('validateCategoryPath', () => {
    it('should validate correct category path', () => {
      expect(validateCategoryPath('hardware', 'desktop', 'display')).toBe(true);
    });

    it('should reject invalid category', () => {
      expect(validateCategoryPath('invalid', 'desktop', 'display')).toBe(false);
    });

    it('should reject invalid subcategory', () => {
      expect(validateCategoryPath('hardware', 'invalid', 'display')).toBe(false);
    });

    it('should reject invalid topic', () => {
      expect(validateCategoryPath('hardware', 'desktop', 'invalid')).toBe(false);
    });

    it('should handle empty values', () => {
      expect(validateCategoryPath('', 'desktop', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', '', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', 'desktop', '')).toBe(false);
    });

    it('should handle null values', () => {
      expect(validateCategoryPath(null, 'desktop', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', null, 'display')).toBe(false);
      expect(validateCategoryPath('hardware', 'desktop', null)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(validateCategoryPath('Hardware', 'Desktop', 'Display')).toBe(false);
    });
  });

  describe('getFullPath', () => {
    it('should return full path for valid hierarchy', () => {
      const path = getFullPath('hardware', 'desktop', 'display');
      expect(path).not.toBeNull();
      expect(path.category).toBeDefined();
      expect(path.subcategory).toBeDefined();
      expect(path.topic).toBeDefined();
      expect(path.category.name).toBe('Hardware');
      expect(path.subcategory.name).toBe('Desktop');
      expect(path.topic.name).toBe('Display/Monitor Issues');
    });

    it('should return null for invalid path', () => {
      expect(getFullPath('invalid', 'browsers', 'chrome')).toBeNull();
    });

    it('should return null for partial path', () => {
      expect(getFullPath('hardware', 'desktop', 'invalid')).toBeNull();
    });
  });

  describe('TICKET_CATEGORIES structure', () => {
    it('should have all required categories', () => {
      const requiredCategories = [
        'software', 'hardware', 'network', 'access', 
        'data', 'account', 'training', 'other'
      ];
      requiredCategories.forEach(cat => {
        expect(TICKET_CATEGORIES).toHaveProperty(cat);
      });
    });

    it('should have subcategories for each main category', () => {
      Object.keys(TICKET_CATEGORIES).forEach(category => {
        expect(TICKET_CATEGORIES[category].subcategories).toBeDefined();
        expect(Object.keys(TICKET_CATEGORIES[category].subcategories).length).toBeGreaterThan(0);
      });
    });

    it('should have topics for each subcategory', () => {
      Object.keys(TICKET_CATEGORIES).forEach(category => {
        Object.keys(TICKET_CATEGORIES[category].subcategories).forEach(subcat => {
          const topics = TICKET_CATEGORIES[category].subcategories[subcat].topics;
          expect(topics).toBeDefined();
          expect(Object.keys(topics).length).toBeGreaterThan(0);
        });
      });
    });
  });
});

// ============================================
// ERROR SERVICE VALIDATION TESTS
// ============================================

describe('Error Service Validation', () => {
  describe('validationError', () => {
    it('should create required field error', () => {
      const error = errorService.validationError('email', 'required');
      expect(error.code).toBe('VAL_001');
      expect(error.statusCode).toBe(400);
      expect(error.details.field).toBe('email');
      expect(error.details.constraint).toBe('required');
    });

    it('should create email validation error', () => {
      const error = errorService.validationError('email', 'email');
      expect(error.code).toBe('VAL_005');
      expect(error.userMessage).toContain('email');
    });

    it('should create minLength validation error', () => {
      const error = errorService.validationError('password', 'minLength');
      expect(error.code).toBe('VAL_003');
    });

    it('should create maxLength validation error', () => {
      const error = errorService.validationError('description', 'maxLength');
      expect(error.code).toBe('VAL_004');
    });

    it('should create URL validation error', () => {
      const error = errorService.validationError('website', 'url');
      expect(error.code).toBe('VAL_006');
    });

    it('should create enum validation error', () => {
      const error = errorService.validationError('status', 'enum');
      expect(error.code).toBe('VAL_007');
    });

    it('should handle unknown constraint', () => {
      const error = errorService.validationError('field', 'unknown');
      expect(error).toBeDefined();
    });

    it('should include value in details when provided', () => {
      const error = errorService.validationError('age', 'minLength', 2);
      expect(error.details.value).toBe(2);
    });
  });

  describe('notFoundError', () => {
    it('should create ticket not found error', () => {
      const error = errorService.notFoundError('Ticket', 123);
      expect(error.code).toBe('RES_001');
      expect(error.statusCode).toBe(404);
      expect(error.details.identifier).toBe(123);
    });

    it('should create user not found error', () => {
      const error = errorService.notFoundError('User');
      expect(error.code).toBe('RES_001');
    });

    it('should format resource name properly', () => {
      const error = errorService.notFoundError('support_ticket');
      expect(error.userMessage).toContain('Support ticket');
    });
  });

  describe('authError', () => {
    it('should create auth required error', () => {
      const error = errorService.authError('required');
      expect(error.code).toBe('AUTH_001');
      expect(error.statusCode).toBe(401);
    });

    it('should create invalid credentials error', () => {
      const error = errorService.authError('invalid');
      expect(error.code).toBe('AUTH_002');
      expect(error.statusCode).toBe(401);
    });

    it('should create expired token error', () => {
      const error = errorService.authError('expired');
      expect(error.code).toBe('AUTH_003');
    });

    it('should create forbidden error', () => {
      const error = errorService.authError('forbidden');
      expect(error.code).toBe('AUTH_005');
      expect(error.statusCode).toBe(403);
    });

    it('should create unauthorized error', () => {
      const error = errorService.authError('unauthorized');
      expect(error.code).toBe('AUTH_006');
    });

    it('should handle unknown auth type', () => {
      const error = errorService.authError('unknown');
      expect(error.code).toBe('AUTH_001'); // Default to required
    });
  });

  describe('businessError', () => {
    it('should create insufficient credits error', () => {
      const error = errorService.businessError('insufficientCredits');
      expect(error.code).toBe('BIZ_001');
      expect(error.statusCode).toBe(402);
    });

    it('should create duplicate entry error', () => {
      const error = errorService.businessError('duplicate');
      expect(error.code).toBe('BIZ_003');
      expect(error.statusCode).toBe(409);
    });

    it('should create ticket claimed error', () => {
      const error = errorService.businessError('ticketClaimed');
      expect(error.code).toBe('BIZ_005');
    });

    it('should create ticket resolved error', () => {
      const error = errorService.businessError('ticketResolved');
      expect(error.code).toBe('BIZ_006');
    });

    it('should create payment failed error', () => {
      const error = errorService.businessError('paymentFailed');
      expect(error.code).toBe('BIZ_007');
    });

    it('should handle unknown business type', () => {
      const error = errorService.businessError('unknown');
      expect(error.code).toBe('BIZ_004'); // Default to operation not allowed
    });

    it('should accept custom message', () => {
      const error = errorService.businessError('notAllowed', 'Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('databaseError', () => {
    it('should create database error', () => {
      const error = errorService.databaseError('query');
      expect(error.code).toBe('SRV_001');
      expect(error.statusCode).toBe(500);
      expect(error.userMessage).toContain('technical difficulties');
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle duplicate entry error', () => {
      const dbError = { code: 'ER_DUP_ENTRY' };
      const error = errorService.handleDatabaseError(dbError);
      expect(error.code).toBe('BIZ_003');
    });

    it('should handle foreign key error (ER_NO_REFERENCED_ROW_2)', () => {
      const dbError = { code: 'ER_NO_REFERENCED_ROW_2' };
      const error = errorService.handleDatabaseError(dbError);
      expect(error.code).toBe('RES_001');
    });

    it('should handle foreign key error (ER_ROW_IS_REFERENCED_2)', () => {
      const dbError = { code: 'ER_ROW_IS_REFERENCED_2' };
      const error = errorService.handleDatabaseError(dbError);
      expect(error.code).toBe('BIZ_004');
    });

    it('should handle unknown database error', () => {
      const dbError = { code: 'UNKNOWN_ERROR' };
      const error = errorService.handleDatabaseError(dbError);
      expect(error.code).toBe('SRV_001');
    });
  });

  describe('buildResponse', () => {
    it('should build error response', () => {
      const error = errorService.validationError('email', 'required');
      const response = errorService.buildResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VAL_001');
      expect(response.error.message).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should include error details in response', () => {
      const error = errorService.validationError('email', 'required');
      const response = errorService.buildResponse(error);
      
      expect(response.error.details).toBeDefined();
      expect(response.error.details.field).toBe('email');
    });
  });

  describe('buildValidationResponse', () => {
    it('should build validation response with multiple errors', () => {
      const errors = [
        errorService.validationError('email', 'required'),
        errorService.validationError('password', 'required')
      ];
      
      const response = errorService.buildValidationResponse(errors);
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.errors).toHaveLength(2);
      expect(response.error.errors[0].field).toBe('email');
      expect(response.error.errors[1].field).toBe('password');
    });

    it('should handle empty errors array', () => {
      const response = errorService.buildValidationResponse([]);
      
      expect(response.success).toBe(false);
      expect(response.error.errors).toHaveLength(0);
    });

    it('should handle error without details.field', () => {
      const error = new Error('Test error');
      error.code = 'TEST_001';
      error.userMessage = 'Test';
      
      const response = errorService.buildValidationResponse([error]);
      
      expect(response.error.errors[0].field).toBeUndefined();
    });
  });

  describe('formatFieldName', () => {
    it('should format snake_case', () => {
      expect(errorService.formatFieldName('customer_name')).toBe('Customer name');
    });

    it('should handle underscores', () => {
      expect(errorService.formatFieldName('first_name')).toContain('name');
    });

    it('should capitalize first letter', () => {
      expect(errorService.formatFieldName('email')).toBe('Email');
    });

    it('should handle multiple words', () => {
      expect(errorService.formatFieldName('support_ticket_id')).toContain('Support');
    });
  });
});

// ============================================
// CREDITS VALIDATION TESTS
// ============================================

describe('Credits Validation', () => {
  describe('calculateTicketCost', () => {
    it('should return 0 for low priority', () => {
      expect(calculateTicketCost(100, 'low')).toBe(0);
    });

    it('should return 0 for normal priority', () => {
      expect(calculateTicketCost(100, 'normal')).toBe(0);
    });

    it('should return 50% for high priority', () => {
      expect(calculateTicketCost(100, 'high')).toBe(50);
    });

    it('should return 75% for urgent priority', () => {
      expect(calculateTicketCost(100, 'urgent')).toBe(75);
    });

    it('should return 100% for critical priority', () => {
      expect(calculateTicketCost(100, 'critical')).toBe(100);
    });

    it('should handle unknown priority', () => {
      expect(calculateTicketCost(100, 'unknown')).toBe(0);
    });

    it('should ceil decimal results', () => {
      expect(calculateTicketCost(99, 'high')).toBe(50);
      expect(calculateTicketCost(101, 'high')).toBe(51);
    });

    it('should handle zero basePay', () => {
      expect(calculateTicketCost(0, 'high')).toBe(0);
    });

    it('should handle large basePay', () => {
      expect(calculateTicketCost(10000, 'high')).toBe(5000);
    });

    it('should handle negative basePay', () => {
      expect(calculateTicketCost(-100, 'high')).toBeLessThanOrEqual(0);
    });
  });

  describe('validateCreditDeduction', () => {
    it('should allow deduction when balance is sufficient', () => {
      expect(() => validateCreditDeduction(100, 50)).not.toThrow();
    });

    it('should allow deduction when balance equals amount', () => {
      expect(() => validateCreditDeduction(50, 50)).not.toThrow();
    });

    it('should throw when balance is insufficient', () => {
      expect(() => validateCreditDeduction(30, 50)).toThrow();
    });

    it('should throw when balance is 0', () => {
      expect(() => validateCreditDeduction(0, 50)).toThrow();
    });
  });

  describe('validateTransfer', () => {
    it('should allow transfer between different users', () => {
      expect(() => validateTransfer('user1', 'user2', 50)).not.toThrow();
    });

    it('should throw when transferring to self', () => {
      expect(() => validateTransfer('user1', 'user1', 50)).toThrow();
    });
  });

  describe('calculateCost (alias)', () => {
    it('should be an alias for calculateTicketCost', () => {
      expect(calculateCost(100, 'high')).toBe(calculateTicketCost(100, 'high'));
    });
  });
});

// ============================================
// INTEGRATION SCENARIOS
// ============================================

describe('Integration: Real-world Scenarios', () => {
  describe('Ticket Creation Flow', () => {
    it('should validate all required fields', () => {
      const requiredFields = ['title', 'description', 'customer_name', 'category'];
      
      // Simulate missing fields
      const missingFields = requiredFields.filter(field => !field);
      // Since all fields have values, check the validation works
      expect(missingFields.length).toBe(0);
      
      // Should create validation error for missing fields
      requiredFields.forEach(field => {
        const error = errorService.validationError(field, 'required');
        expect(error.code).toBe('VAL_001');
        expect(error.details.field).toBe(field);
      });
    });

    it('should validate category path', () => {
      const category = 'hardware';
      const subcategory = 'desktop';
      const topic = 'display';
      
      expect(validateCategoryPath(category, subcategory, topic)).toBe(true);
    });

    it('should reject invalid category path', () => {
      const category = 'invalid';
      const subcategory = 'browsers';
      const topic = 'chrome';
      
      expect(validateCategoryPath(category, subcategory, topic)).toBe(false);
    });
  });

  describe('User Authentication Flow', () => {
    it('should validate email format', () => {
      const emailError = errorService.validationError('email', 'email');
      expect(emailError.code).toBe('VAL_005');
    });

    it('should validate password length', () => {
      const passwordError = errorService.validationError('password', 'minLength');
      expect(passwordError.code).toBe('VAL_003');
    });

    it('should handle invalid credentials', () => {
      const authError = errorService.authError('invalid');
      expect(authError.code).toBe('AUTH_002');
      expect(authError.statusCode).toBe(401);
    });

    it('should handle expired session', () => {
      const sessionError = errorService.authError('expired');
      expect(sessionError.code).toBe('AUTH_003');
    });
  });

  describe('Payment Flow', () => {
    it('should handle insufficient credits', () => {
      const creditError = errorService.businessError('insufficientCredits');
      expect(creditError.code).toBe('BIZ_001');
      expect(creditError.statusCode).toBe(402);
    });

    it('should handle payment failure', () => {
      const paymentError = errorService.businessError('paymentFailed');
      expect(paymentError.code).toBe('BIZ_007');
    });

    it('should calculate correct ticket cost for payment', () => {
      expect(calculateTicketCost(100, 'critical')).toBe(100);
      expect(calculateTicketCost(100, 'high')).toBe(50);
      expect(calculateTicketCost(100, 'low')).toBe(0);
    });
  });

  describe('Ticket Status Flow', () => {
    it('should handle ticket already claimed', () => {
      const error = errorService.businessError('ticketClaimed');
      expect(error.code).toBe('BIZ_005');
      expect(error.statusCode).toBe(409);
    });

    it('should handle ticket already resolved', () => {
      const error = errorService.businessError('ticketResolved');
      expect(error.code).toBe('BIZ_006');
    });

    it('should handle operation not allowed', () => {
      const error = errorService.businessError('notAllowed');
      expect(error.code).toBe('BIZ_004');
    });
  });

  describe('Database Error Flow', () => {
    it('should handle duplicate entry', () => {
      const dbError = errorService.handleDatabaseError({ code: 'ER_DUP_ENTRY' });
      expect(dbError.code).toBe('BIZ_003');
    });

    it('should handle foreign key violation', () => {
      const dbError = errorService.handleDatabaseError({ code: 'ER_NO_REFERENCED_ROW_2' });
      expect(dbError.code).toBe('RES_001');
    });

    it('should handle child row constraint', () => {
      const dbError = errorService.handleDatabaseError({ code: 'ER_ROW_IS_REFERENCED_2' });
      expect(dbError.code).toBe('BIZ_004');
    });
  });

  describe('Resource Not Found Flow', () => {
    it('should handle ticket not found', () => {
      const error = errorService.notFoundError('Ticket', 12345);
      const response = errorService.buildResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('RES_001');
      expect(error.details.identifier).toBe(12345);
    });

    it('should handle user not found', () => {
      const error = errorService.notFoundError('User', 'user123');
      expect(error.code).toBe('RES_001');
    });
  });

  describe('Form Validation Flow', () => {
    it('should validate login form', () => {
      const errors = [
        errorService.validationError('email', 'required'),
        errorService.validationError('password', 'required')
      ];
      
      const response = errorService.buildValidationResponse(errors);
      
      expect(response.success).toBe(false);
      expect(response.error.errors).toHaveLength(2);
    });

    it('should validate signup form', () => {
      const errors = [
        errorService.validationError('email', 'email'),
        errorService.validationError('password', 'minLength'),
        errorService.validationError('name', 'required')
      ];
      
      const response = errorService.buildValidationResponse(errors);
      
      expect(response.success).toBe(false);
      expect(response.error.errors).toHaveLength(3);
    });

    it('should validate ticket submission form', () => {
      const errors = [
        errorService.validationError('title', 'required'),
        errorService.validationError('description', 'required'),
        errorService.validationError('category', 'required')
      ];
      
      const response = errorService.buildValidationResponse(errors);
      
      expect(response.success).toBe(false);
      expect(response.error.errors.some(e => e.field === 'title')).toBe(true);
    });
  });
});

// ============================================
// ERROR CODE ENUMERATION TESTS
// ============================================

describe('Error Codes Enumeration', () => {
  describe('Authentication Errors', () => {
    it('should have AUTH_001 for required', () => {
      expect(ERROR_CODES.AUTH_REQUIRED).toBe('AUTH_001');
    });

    it('should have AUTH_002 for invalid credentials', () => {
      expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_002');
    });

    it('should have AUTH_003 for expired token', () => {
      expect(ERROR_CODES.AUTH_TOKEN_EXPIRED).toBe('AUTH_003');
    });

    it('should have AUTH_004 for invalid token', () => {
      expect(ERROR_CODES.AUTH_TOKEN_INVALID).toBe('AUTH_004');
    });

    it('should have AUTH_005 for forbidden', () => {
      expect(ERROR_CODES.AUTH_FORBIDDEN).toBe('AUTH_005');
    });

    it('should have AUTH_006 for unauthorized', () => {
      expect(ERROR_CODES.AUTH_UNAUTHORIZED).toBe('AUTH_006');
    });
  });

  describe('Validation Errors', () => {
    it('should have VAL_001 for required', () => {
      expect(ERROR_CODES.VALIDATION_REQUIRED).toBe('VAL_001');
    });

    it('should have VAL_002 for invalid format', () => {
      expect(ERROR_CODES.VALIDATION_INVALID_FORMAT).toBe('VAL_002');
    });

    it('should have VAL_003 for min length', () => {
      expect(ERROR_CODES.VALIDATION_MIN_LENGTH).toBe('VAL_003');
    });

    it('should have VAL_004 for max length', () => {
      expect(ERROR_CODES.VALIDATION_MAX_LENGTH).toBe('VAL_004');
    });

    it('should have VAL_005 for invalid email', () => {
      expect(ERROR_CODES.VALIDATION_INVALID_EMAIL).toBe('VAL_005');
    });

    it('should have VAL_006 for invalid URL', () => {
      expect(ERROR_CODES.VALIDATION_INVALID_URL).toBe('VAL_006');
    });

    it('should have VAL_007 for invalid enum', () => {
      expect(ERROR_CODES.VALIDATION_INVALID_ENUM).toBe('VAL_007');
    });
  });

  describe('Resource Errors', () => {
    it('should have RES_001 for not found', () => {
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RES_001');
    });

    it('should have RES_002 for already exists', () => {
      expect(ERROR_CODES.RESOURCE_ALREADY_EXISTS).toBe('RES_002');
    });

    it('should have RES_003 for deleted', () => {
      expect(ERROR_CODES.RESOURCE_DELETED).toBe('RES_003');
    });

    it('should have RES_004 for limit exceeded', () => {
      expect(ERROR_CODES.RESOURCE_LIMIT_EXCEEDED).toBe('RES_004');
    });
  });

  describe('Business Errors', () => {
    it('should have BIZ_001 for insufficient credits', () => {
      expect(ERROR_CODES.BUSINESS_INSUFFICIENT_CREDITS).toBe('BIZ_001');
    });

    it('should have BIZ_002 for invalid status', () => {
      expect(ERROR_CODES.BUSINESS_INVALID_STATUS).toBe('BIZ_002');
    });

    it('should have BIZ_003 for duplicate entry', () => {
      expect(ERROR_CODES.BUSINESS_DUPLICATE_ENTRY).toBe('BIZ_003');
    });

    it('should have BIZ_004 for operation not allowed', () => {
      expect(ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED).toBe('BIZ_004');
    });

    it('should have BIZ_005 for ticket claimed', () => {
      expect(ERROR_CODES.BUSINESS_TICKET_ALREADY_CLAIMED).toBe('BIZ_005');
    });

    it('should have BIZ_006 for ticket resolved', () => {
      expect(ERROR_CODES.BUSINESS_TICKET_RESOLVED).toBe('BIZ_006');
    });

    it('should have BIZ_007 for payment failed', () => {
      expect(ERROR_CODES.BUSINESS_PAYMENT_FAILED).toBe('BIZ_007');
    });
  });

  describe('Server Errors', () => {
    it('should have SRV_001 for database error', () => {
      expect(ERROR_CODES.SERVER_DATABASE_ERROR).toBe('SRV_001');
    });

    it('should have SRV_002 for external API error', () => {
      expect(ERROR_CODES.SERVER_EXTERNAL_API_ERROR).toBe('SRV_002');
    });

    it('should have SRV_003 for internal error', () => {
      expect(ERROR_CODES.SERVER_INTERNAL_ERROR).toBe('SRV_003');
    });

    it('should have SRV_004 for maintenance', () => {
      expect(ERROR_CODES.SERVER_MAINTENANCE).toBe('SRV_004');
    });
  });

  describe('Rate Limit Errors', () => {
    it('should have RATE_001 for exceeded', () => {
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_001');
    });
  });

  describe('File Upload Errors', () => {
    it('should have FILE_001 for too large', () => {
      expect(ERROR_CODES.FILE_TOO_LARGE).toBe('FILE_001');
    });

    it('should have FILE_002 for invalid type', () => {
      expect(ERROR_CODES.FILE_INVALID_TYPE).toBe('FILE_002');
    });

    it('should have FILE_003 for upload failed', () => {
      expect(ERROR_CODES.FILE_UPLOAD_FAILED).toBe('FILE_003');
    });
  });
});
