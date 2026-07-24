/**
 * Error Service
 * Unified error handling with user-friendly messages
 */

// Error codes for programmatic handling
export const ERROR_CODES = {
  // Authentication & Authorization (1000-1999)
  AUTH_REQUIRED: 'AUTH_001',
  AUTH_INVALID_CREDENTIALS: 'AUTH_002',
  AUTH_TOKEN_EXPIRED: 'AUTH_003',
  AUTH_TOKEN_INVALID: 'AUTH_004',
  AUTH_FORBIDDEN: 'AUTH_005',
  AUTH_UNAUTHORIZED: 'AUTH_006',

  // Validation Errors (2000-2999)
  VALIDATION_REQUIRED: 'VAL_001',
  VALIDATION_INVALID_FORMAT: 'VAL_002',
  VALIDATION_MIN_LENGTH: 'VAL_003',
  VALIDATION_MAX_LENGTH: 'VAL_004',
  VALIDATION_INVALID_EMAIL: 'VAL_005',
  VALIDATION_INVALID_URL: 'VAL_006',
  VALIDATION_INVALID_ENUM: 'VAL_007',

  // Resource Errors (3000-3999)
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_ALREADY_EXISTS: 'RES_002',
  RESOURCE_DELETED: 'RES_003',
  RESOURCE_LIMIT_EXCEEDED: 'RES_004',

  // Business Logic Errors (4000-4999)
  BUSINESS_INSUFFICIENT_CREDITS: 'BIZ_001',
  BUSINESS_INVALID_STATUS: 'BIZ_002',
  BUSINESS_DUPLICATE_ENTRY: 'BIZ_003',
  BUSINESS_OPERATION_NOT_ALLOWED: 'BIZ_004',
  BUSINESS_TICKET_ALREADY_CLAIMED: 'BIZ_005',
  BUSINESS_TICKET_RESOLVED: 'BIZ_006',
  BUSINESS_PAYMENT_FAILED: 'BIZ_007',

  // Server Errors (5000-5999)
  SERVER_DATABASE_ERROR: 'SRV_001',
  SERVER_EXTERNAL_API_ERROR: 'SRV_002',
  SERVER_INTERNAL_ERROR: 'SRV_003',
  SERVER_MAINTENANCE: 'SRV_004',

  // Rate Limiting (6000-6999)
  RATE_LIMIT_EXCEEDED: 'RATE_001',

  // File Upload Errors (7000-7999)
  FILE_TOO_LARGE: 'FILE_001',
  FILE_INVALID_TYPE: 'FILE_002',
  FILE_UPLOAD_FAILED: 'FILE_003'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  // Authentication
  [ERROR_CODES.AUTH_REQUIRED]: {
    message: 'Please log in to continue',
    userMessage: 'Authentication required. Please log in to access this feature.'
  },
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
    message: 'Invalid email or password',
    userMessage: 'The email or password you entered is incorrect. Please try again.'
  },
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: {
    message: 'Session expired',
    userMessage: 'Your session has expired. Please log in again.'
  },
  [ERROR_CODES.AUTH_TOKEN_INVALID]: {
    message: 'Invalid session',
    userMessage: 'Your session is invalid. Please log in again.'
  },
  [ERROR_CODES.AUTH_FORBIDDEN]: {
    message: 'Access denied',
    userMessage: 'You do not have permission to access this resource.'
  },
  [ERROR_CODES.AUTH_UNAUTHORIZED]: {
    message: 'Unauthorized',
    userMessage: 'You are not authorized to perform this action.'
  },

  // Validation
  [ERROR_CODES.VALIDATION_REQUIRED]: {
    message: 'Required field missing',
    userMessage: 'This field is required. Please fill it in.'
  },
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: {
    message: 'Invalid format',
    userMessage: 'The format of this field is incorrect.'
  },
  [ERROR_CODES.VALIDATION_MIN_LENGTH]: {
    message: 'Value too short',
    userMessage: 'This value is too short. Please enter a longer value.'
  },
  [ERROR_CODES.VALIDATION_MAX_LENGTH]: {
    message: 'Value too long',
    userMessage: 'This value is too long. Please enter a shorter value.'
  },
  [ERROR_CODES.VALIDATION_INVALID_EMAIL]: {
    message: 'Invalid email address',
    userMessage: 'Please enter a valid email address.'
  },
  [ERROR_CODES.VALIDATION_INVALID_URL]: {
    message: 'Invalid URL',
    userMessage: 'Please enter a valid URL.'
  },
  [ERROR_CODES.VALIDATION_INVALID_ENUM]: {
    message: 'Invalid value',
    userMessage: 'Please select a valid option.'
  },

  // Resources
  [ERROR_CODES.RESOURCE_NOT_FOUND]: {
    message: 'Resource not found',
    userMessage: 'The requested item could not be found.'
  },
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: {
    message: 'Resource already exists',
    userMessage: 'This item already exists. Please use a different one.'
  },
  [ERROR_CODES.RESOURCE_DELETED]: {
    message: 'Resource deleted',
    userMessage: 'This item has been deleted and is no longer available.'
  },
  [ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: {
    message: 'Limit exceeded',
    userMessage: 'You have reached the maximum limit for this action.'
  },

  // Business Logic
  [ERROR_CODES.BUSINESS_INSUFFICIENT_CREDITS]: {
    message: 'Insufficient credits',
    userMessage: 'You do not have enough credits for this action. Please add more credits.'
  },
  [ERROR_CODES.BUSINESS_INVALID_STATUS]: {
    message: 'Invalid status',
    userMessage: 'This action cannot be performed in the current status.'
  },
  [ERROR_CODES.BUSINESS_DUPLICATE_ENTRY]: {
    message: 'Duplicate entry',
    userMessage: 'This entry already exists. Please use a different one.'
  },
  [ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED]: {
    message: 'Operation not allowed',
    userMessage: 'This action is not allowed at this time.'
  },
  [ERROR_CODES.BUSINESS_TICKET_ALREADY_CLAIMED]: {
    message: 'Ticket already claimed',
    userMessage: 'This ticket has already been claimed by another technician.'
  },
  [ERROR_CODES.BUSINESS_TICKET_RESOLVED]: {
    message: 'Ticket already resolved',
    userMessage: 'This ticket has already been resolved.'
  },
  [ERROR_CODES.BUSINESS_PAYMENT_FAILED]: {
    message: 'Payment failed',
    userMessage: 'The payment could not be processed. Please try again or use a different method.'
  },

  // Server
  [ERROR_CODES.SERVER_DATABASE_ERROR]: {
    message: 'Database error',
    userMessage: 'We are experiencing technical difficulties. Please try again later.'
  },
  [ERROR_CODES.SERVER_EXTERNAL_API_ERROR]: {
    message: 'Service unavailable',
    userMessage: 'A required service is temporarily unavailable. Please try again later.'
  },
  [ERROR_CODES.SERVER_INTERNAL_ERROR]: {
    message: 'Unexpected error',
    userMessage: 'Something went wrong. Please try again.'
  },
  [ERROR_CODES.SERVER_MAINTENANCE]: {
    message: 'Maintenance',
    userMessage: 'We are currently performing maintenance. Please try again later.'
  },

  // Rate Limiting
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    message: 'Too many requests',
    userMessage: 'You are making requests too quickly. Please wait a moment and try again.'
  },

  // Files
  [ERROR_CODES.FILE_TOO_LARGE]: {
    message: 'File too large',
    userMessage: 'The uploaded file is too large. Please use a smaller file.'
  },
  [ERROR_CODES.FILE_INVALID_TYPE]: {
    message: 'Invalid file type',
    userMessage: 'This type of file is not allowed. Please upload a different file.'
  },
  [ERROR_CODES.FILE_UPLOAD_FAILED]: {
    message: 'Upload failed',
    userMessage: 'The file could not be uploaded. Please try again.'
  }
};

// HTTP status codes mapping
const HTTP_STATUS_CODES = {
  [ERROR_CODES.AUTH_REQUIRED]: 401,
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 401,
  [ERROR_CODES.AUTH_TOKEN_INVALID]: 401,
  [ERROR_CODES.AUTH_FORBIDDEN]: 403,
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 403,
  [ERROR_CODES.VALIDATION_REQUIRED]: 400,
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 400,
  [ERROR_CODES.VALIDATION_MIN_LENGTH]: 400,
  [ERROR_CODES.VALIDATION_MAX_LENGTH]: 400,
  [ERROR_CODES.VALIDATION_INVALID_EMAIL]: 400,
  [ERROR_CODES.VALIDATION_INVALID_URL]: 400,
  [ERROR_CODES.VALIDATION_INVALID_ENUM]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
  [ERROR_CODES.RESOURCE_DELETED]: 410,
  [ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.BUSINESS_INSUFFICIENT_CREDITS]: 402,
  [ERROR_CODES.BUSINESS_INVALID_STATUS]: 400,
  [ERROR_CODES.BUSINESS_DUPLICATE_ENTRY]: 409,
  [ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED]: 400,
  [ERROR_CODES.BUSINESS_TICKET_ALREADY_CLAIMED]: 409,
  [ERROR_CODES.BUSINESS_TICKET_RESOLVED]: 409,
  [ERROR_CODES.BUSINESS_PAYMENT_FAILED]: 402,
  [ERROR_CODES.SERVER_DATABASE_ERROR]: 500,
  [ERROR_CODES.SERVER_EXTERNAL_API_ERROR]: 503,
  [ERROR_CODES.SERVER_INTERNAL_ERROR]: 500,
  [ERROR_CODES.SERVER_MAINTENANCE]: 503,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.FILE_TOO_LARGE]: 413,
  [ERROR_CODES.FILE_INVALID_TYPE]: 415,
  [ERROR_CODES.FILE_UPLOAD_FAILED]: 500
};

class ErrorService {
  /**
   * Create an AppError with user-friendly message
   */
  createError(code, customMessage = null, customUserMessage = null, details = null) {
    const errorInfo = ERROR_MESSAGES[code];
    
    const error = new Error(customMessage || (errorInfo ? errorInfo.message : 'An error occurred'));
    error.code = code;
    error.userMessage = customUserMessage || (errorInfo ? errorInfo.userMessage : 'Something went wrong. Please try again.');
    error.statusCode = HTTP_STATUS_CODES[code] || 500;
    error.isOperational = true;
    
    if (details) {
      error.details = details;
    }

    return error;
  }

  /**
   * Create validation error
   */
  validationError(field, constraint, value = null) {
    const details = { field, constraint };
    if (value !== null) details.value = value;

    let code = ERROR_CODES.VALIDATION_REQUIRED;
    let message = `${field} is required`;
    let userMessage = `${this.formatFieldName(field)} is required. Please fill it in.`;

    switch (constraint) {
      case 'minLength':
        code = ERROR_CODES.VALIDATION_MIN_LENGTH;
        message = `${field} is too short`;
        userMessage = `${this.formatFieldName(field)} is too short. Please enter a longer value.`;
        break;
      case 'maxLength':
        code = ERROR_CODES.VALIDATION_MAX_LENGTH;
        message = `${field} is too long`;
        userMessage = `${this.formatFieldName(field)} is too long. Please enter a shorter value.`;
        break;
      case 'email':
        code = ERROR_CODES.VALIDATION_INVALID_EMAIL;
        message = `Invalid email format`;
        userMessage = 'Please enter a valid email address.';
        break;
      case 'url':
        code = ERROR_CODES.VALIDATION_INVALID_URL;
        message = `Invalid URL format`;
        userMessage = 'Please enter a valid URL.';
        break;
      case 'enum':
        code = ERROR_CODES.VALIDATION_INVALID_ENUM;
        message = `Invalid value for ${field}`;
        userMessage = `Please select a valid option for ${this.formatFieldName(field)}.`;
        break;
    }

    return this.createError(code, message, userMessage, details);
  }

  /**
   * Create not found error
   */
  notFoundError(resourceType, identifier = null) {
    const details = { resourceType };
    if (identifier) details.identifier = identifier;

    const resourceName = this.formatFieldName(resourceType);
    return this.createError(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      `${resourceType} not found`,
      `${resourceName} could not be found. It may have been deleted or does not exist.`,
      details
    );
  }

  /**
   * Create authentication error
   */
  authError(type = 'required') {
    const codeMap = {
      required: ERROR_CODES.AUTH_REQUIRED,
      invalid: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      expired: ERROR_CODES.AUTH_TOKEN_EXPIRED,
      invalidToken: ERROR_CODES.AUTH_TOKEN_INVALID,
      forbidden: ERROR_CODES.AUTH_FORBIDDEN,
      unauthorized: ERROR_CODES.AUTH_UNAUTHORIZED
    };

    return this.createError(codeMap[type] || ERROR_CODES.AUTH_REQUIRED);
  }

  /**
   * Create business logic error
   */
  businessError(type, customMessage = null) {
    const codeMap = {
      insufficientCredits: ERROR_CODES.BUSINESS_INSUFFICIENT_CREDITS,
      invalidStatus: ERROR_CODES.BUSINESS_INVALID_STATUS,
      duplicate: ERROR_CODES.BUSINESS_DUPLICATE_ENTRY,
      notAllowed: ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED,
      ticketClaimed: ERROR_CODES.BUSINESS_TICKET_ALREADY_CLAIMED,
      ticketResolved: ERROR_CODES.BUSINESS_TICKET_RESOLVED,
      paymentFailed: ERROR_CODES.BUSINESS_PAYMENT_FAILED
    };

    return this.createError(codeMap[type] || ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED, customMessage);
  }

  /**
   * Create database error
   */
  databaseError(operation = 'query') {
    return this.createError(
      ERROR_CODES.SERVER_DATABASE_ERROR,
      `Database ${operation} failed`,
      'We are experiencing technical difficulties. Please try again later.'
    );
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error, operation = 'Database operation') {
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return this.createError(
        ERROR_CODES.BUSINESS_DUPLICATE_ENTRY,
        'Duplicate entry',
        'This entry already exists. Please use a different one.'
      );
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return this.notFoundError('Related resource');
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return this.createError(
        ERROR_CODES.BUSINESS_OPERATION_NOT_ALLOWED,
        'Cannot delete',
        'This item cannot be deleted because it is being used by other items.'
      );
    }

    // Generic database error
    console.error(`Database error during ${operation}:`, error);
    return this.databaseError(operation);
  }

  /**
   * Format field name for user display
   */
  formatFieldName(field) {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Build error response for API
   */
  buildResponse(error) {
    const response = {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.userMessage || 'An unexpected error occurred',
        ...(process.env.NODE_ENV !== 'production' && error.details && { details: error.details }),
        ...(process.env.NODE_ENV !== 'production' && { technicalMessage: error.message })
      },
      timestamp: new Date().toISOString()
    };

    return response;
  }

  /**
   * Build validation error response for forms
   */
  buildValidationResponse(errors) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your input and try again.',
        errors: errors.map(err => ({
          field: err.details?.field || err.field,
          message: err.userMessage || err.message,
          code: err.code
        }))
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const errorService = new ErrorService();
export default errorService;
