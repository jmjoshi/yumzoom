import { AppErrorHandler, ErrorType } from '@/lib/error-handling';

describe('Error Handling System', () => {
  describe('AppErrorHandler', () => {
    it('creates standardized error objects', () => {
      const error = AppErrorHandler.createError(
        ErrorType.VALIDATION,
        'Invalid input',
        'VALIDATION_ERROR',
        400,
        { field: 'email' }
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.timestamp).toBeDefined();
      expect(error.requestId).toBeDefined();
    });

    it('gets user-friendly messages for different error types', () => {
      const authError = AppErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        'Auth failed',
        'AUTH_ERROR',
        401
      );
      
      const message = AppErrorHandler.getUserFriendlyMessage(authError);
      expect(message).toBe('Please log in to continue.');
    });

    it('gets user-friendly messages for validation errors', () => {
      const validationError = AppErrorHandler.createError(
        ErrorType.VALIDATION,
        'Invalid data',
        'VALIDATION_ERROR',
        400
      );
      
      const message = AppErrorHandler.getUserFriendlyMessage(validationError);
      expect(message).toBe('Please check your input and try again.');
    });

    it('gets user-friendly messages for network errors', () => {
      const networkError = AppErrorHandler.createError(
        ErrorType.NETWORK,
        'Network failed',
        'NETWORK_ERROR',
        503
      );
      
      const message = AppErrorHandler.getUserFriendlyMessage(networkError);
      expect(message).toBe('Please check your internet connection and try again.');
    });

    it('gets generic message for unknown errors', () => {
      const unknownError = AppErrorHandler.createError(
        ErrorType.UNKNOWN,
        'Something bad happened',
        'UNKNOWN_ERROR',
        500
      );
      
      const message = AppErrorHandler.getUserFriendlyMessage(unknownError);
      expect(message).toBe('Something went wrong. Please try again later.');
    });
  });
});
