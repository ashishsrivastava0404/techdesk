import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { errorHandler, asyncHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

describe('errorHandler middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      sentry: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should log error details', () => {
      const err = new Error('Test error');
      err.stack = 'Error: Test error\n at test.js:1';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', expect.objectContaining({
        message: 'Test error',
        path: '/test',
        method: 'GET'
      }));
    });

    it('should use custom statusCode when provided', () => {
      const err = new Error('Bad request');
      err.statusCode = 400;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad request'
      }));
    });

    it('should default to 500 status code', () => {
      const err = new Error('Internal error');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should expose error message in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const err = new Error('Detailed error message');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Detailed error message'
      }));
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const err = new Error('Sensitive error details');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'An unexpected error occurred'
      }));
      expect(mockRes.json).not.toHaveBeenCalledWith(expect.objectContaining({
        error: 'Sensitive error details'
      }));
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const err = new Error('Test error');
      err.stack = 'Error: Test error\n at test.js:1';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        stack: 'Error: Test error\n at test.js:1'
      }));
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const err = new Error('Test error');
      err.stack = 'Error: Test error\n at test.js:1';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.not.objectContaining({
        stack: expect.anything()
      }));
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should call Sentry captureException when req.sentry is available', () => {
      const captureException = jest.fn();
      mockReq.sentry = { captureException };
      const err = new Error('Sentry test');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe('asyncHandler', () => {
    it('should call the wrapped function with req, res, next', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should catch errors and pass to next', async () => {
      const testError = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(testError);
      const wrapped = asyncHandler(mockFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should work with async functions returning values', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrapped = asyncHandler(mockFn);
      const jsonMock = jest.fn();
      mockRes.json = jsonMock;

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return not found error with path', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not found',
        path: '/test'
      });
    });
  });
});
