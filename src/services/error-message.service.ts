/**
 * Error Message Service
 * Standardizes error messages across the application
 */

export interface ErrorContext {
  operation?: 'login' | 'register' | 'logout' | 'refresh' | 'profile' | 'api';
  statusCode?: number;
  errorCode?: string;
  originalMessage?: string;
}

export class ErrorMessageService {
  private static instance: ErrorMessageService;

  private constructor() {}

  public static getInstance(): ErrorMessageService {
    if (!ErrorMessageService.instance) {
      ErrorMessageService.instance = new ErrorMessageService();
    }
    return ErrorMessageService.instance;
  }

  /**
   * Get user-friendly error message
   */
  public getErrorMessage(error: any, context: ErrorContext = {}): string {
    // Extract error information
    const statusCode = this.extractStatusCode(error, context);
    const errorCode = this.extractErrorCode(error, context);
    const originalMessage = this.extractOriginalMessage(error, context);

    // Get standardized message based on context and error details
    return this.getStandardizedMessage(statusCode, errorCode, originalMessage, context);
  }

  /**
   * Extract status code from error
   */
  private extractStatusCode(error: any, context: ErrorContext): number {
    if (context.statusCode) return context.statusCode;
    if (error?.status) return error.status;
    if (error?.response?.status) return error.response.status;
    if (error?.code === 'NETWORK_ERROR') return 0;
    return 500;
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: any, context: ErrorContext): string {
    if (context.errorCode) return context.errorCode;
    if (error?.code) return error.code;
    if (error?.response?.data?.code) return error.response.data.code;
    if (error?.response?.data?.error) return error.response.data.error;
    return 'UNKNOWN_ERROR';
  }

  /**
   * Extract original message from error
   */
  private extractOriginalMessage(error: any, context: ErrorContext): string {
    if (context.originalMessage) return context.originalMessage;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.data?.detail) return error.response.data.detail;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }

  /**
   * Get standardized error message
   */
  private getStandardizedMessage(
    statusCode: number,
    errorCode: string,
    originalMessage: string,
    context: ErrorContext
  ): string {
    // Handle network errors
    if (statusCode === 0 || errorCode === 'NETWORK_ERROR') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Handle timeout errors
    if (errorCode === 'TIMEOUT' || originalMessage.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Context-specific error messages
    switch (context.operation) {
      case 'login':
        return this.getLoginErrorMessage(statusCode, errorCode, originalMessage);
      
      case 'register':
        return this.getRegisterErrorMessage(statusCode, errorCode, originalMessage);
      
      case 'refresh':
        return this.getRefreshErrorMessage(statusCode, errorCode, originalMessage);
      
      case 'profile':
        return this.getProfileErrorMessage(statusCode, errorCode, originalMessage);
      
      default:
        return this.getGenericErrorMessage(statusCode, errorCode, originalMessage);
    }
  }

  /**
   * Get login-specific error messages
   */
  private getLoginErrorMessage(statusCode: number, errorCode: string, originalMessage: string): string {
    switch (statusCode) {
      case 400:
        if (originalMessage.toLowerCase().includes('invalid') || 
            originalMessage.toLowerCase().includes('incorrect') ||
            errorCode === 'INVALID_CREDENTIALS') {
          return 'Invalid email or password. Please check your credentials and try again.';
        }
        return 'Please check your login information and try again.';
      
      case 401:
        return 'Invalid email or password. Please check your credentials and try again.';
      
      case 403:
        if (originalMessage.toLowerCase().includes('disabled') || 
            originalMessage.toLowerCase().includes('inactive')) {
          return 'Your account has been disabled. Please contact support for assistance.';
        }
        if (originalMessage.toLowerCase().includes('verified') || 
            originalMessage.toLowerCase().includes('confirm')) {
          return 'Please verify your email address before logging in.';
        }
        return 'Access denied. Please contact support if you believe this is an error.';
      
      case 429:
        return 'Too many login attempts. Please wait a few minutes before trying again.';
      
      case 500:
      case 502:
      case 503:
        return 'Server is temporarily unavailable. Please try again in a few moments.';
      
      default:
        return 'Login failed. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Get registration-specific error messages
   */
  private getRegisterErrorMessage(statusCode: number, _errorCode: string, originalMessage: string): string {
    switch (statusCode) {
      case 400:
        if (originalMessage.toLowerCase().includes('email') && 
            originalMessage.toLowerCase().includes('exists')) {
          return 'An account with this email already exists. Please use a different email or try logging in.';
        }
        if (originalMessage.toLowerCase().includes('password')) {
          return 'Password does not meet requirements. Please choose a stronger password.';
        }
        if (originalMessage.toLowerCase().includes('email') && 
            originalMessage.toLowerCase().includes('invalid')) {
          return 'Please enter a valid email address.';
        }
        return 'Please check your information and try again.';
      
      case 409:
        return 'An account with this email already exists. Please use a different email or try logging in.';
      
      case 422:
        if (originalMessage.toLowerCase().includes('email')) {
          return 'Please enter a valid email address.';
        }
        if (originalMessage.toLowerCase().includes('password')) {
          return 'Password does not meet requirements. Please choose a stronger password.';
        }
        return 'Please check your information and correct any errors.';
      
      case 500:
      case 502:
      case 503:
        return 'Server is temporarily unavailable. Please try again in a few moments.';
      
      default:
        return 'Registration failed. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Get token refresh error messages
   */
  private getRefreshErrorMessage(statusCode: number, _errorCode: string, _originalMessage: string): string {
    switch (statusCode) {
      case 401:
        return 'Your session has expired. Please log in again.';
      
      case 403:
        return 'Session expired. Please log in again.';
      
      default:
        return 'Session expired. Please log in again.';
    }
  }

  /**
   * Get profile update error messages
   */
  private getProfileErrorMessage(statusCode: number, _errorCode: string, originalMessage: string): string {
    switch (statusCode) {
      case 400:
        if (originalMessage.toLowerCase().includes('email')) {
          return 'Please enter a valid email address.';
        }
        return 'Please check your information and try again.';
      
      case 401:
        return 'You need to log in again to update your profile.';
      
      case 409:
        return 'This email is already in use. Please choose a different email.';
      
      case 422:
        return 'Please check your information and correct any errors.';
      
      default:
        return 'Failed to update profile. Please try again.';
    }
  }

  /**
   * Get generic error messages
   */
  private getGenericErrorMessage(statusCode: number, _errorCode: string, originalMessage: string): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your information and try again.';
      
      case 401:
        return 'Authentication required. Please log in and try again.';
      
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 409:
        return 'Conflict detected. Please refresh and try again.';
      
      case 422:
        return 'Please check your information and correct any errors.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Server error. Please try again in a few moments.';
      
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      
      case 504:
        return 'Request timed out. Please try again.';
      
      default:
        // For unknown errors, provide a helpful fallback
        if (originalMessage && originalMessage !== 'An unexpected error occurred') {
          return `${originalMessage}. Please try again or contact support if the problem persists.`;
        }
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  public isRecoverableError(error: any, context: ErrorContext = {}): boolean {
    const statusCode = this.extractStatusCode(error, context);
    const errorCode = this.extractErrorCode(error, context);

    // Network errors are usually recoverable
    if (statusCode === 0 || errorCode === 'NETWORK_ERROR') {
      return true;
    }

    // Server errors are usually recoverable
    if (statusCode >= 500) {
      return true;
    }

    // Rate limiting is recoverable after waiting
    if (statusCode === 429) {
      return true;
    }

    // Timeout errors are recoverable
    if (errorCode === 'TIMEOUT') {
      return true;
    }

    // Client errors are usually not recoverable without changes
    return false;
  }

  /**
   * Get retry suggestion for recoverable errors
   */
  public getRetrySuggestion(error: any, context: ErrorContext = {}): string | null {
    if (!this.isRecoverableError(error, context)) {
      return null;
    }

    const statusCode = this.extractStatusCode(error, context);
    const errorCode = this.extractErrorCode(error, context);

    if (statusCode === 429) {
      return 'Please wait a few minutes before trying again.';
    }

    if (statusCode >= 500) {
      return 'Please try again in a few moments.';
    }

    if (statusCode === 0 || errorCode === 'NETWORK_ERROR') {
      return 'Please check your internet connection and try again.';
    }

    return 'Please try again.';
  }
}

// Export singleton instance
export const errorMessageService = ErrorMessageService.getInstance();
