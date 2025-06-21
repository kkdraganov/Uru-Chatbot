import { useCallback, useState } from 'react';

interface ErrorState {
  error: Error | null;
  hasError: boolean;
  errorId: string | null;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  hasError: boolean;
  errorId: string | null;
  handleError: (error: Error, context?: string) => void;
  clearError: () => void;
  retryWithErrorHandling: <T>(fn: () => Promise<T>, context?: string) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    errorId: null,
  });

  const handleError = useCallback((error: Error, context?: string) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error with context
    console.error(`Error in ${context || 'unknown context'}:`, error);
    console.error('Error ID:', errorId);
    
    // Update state
    setErrorState({
      error,
      hasError: true,
      errorId,
    });

    // In development, provide more detailed logging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Handler - ${context || 'Unknown Context'}`);
      console.error('Error:', error);
      console.error('Error ID:', errorId);
      console.error('Stack:', error.stack);
      console.error('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      errorId: null,
    });
  }, []);

  const retryWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await fn();
      return result;
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, clearError]);

  return {
    error: errorState.error,
    hasError: errorState.hasError,
    errorId: errorState.errorId,
    handleError,
    clearError,
    retryWithErrorHandling,
  };
};

// Utility function for async error handling in components
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError: (error: Error) => void,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${context || 'async operation'}:`, error);
      onError(error as Error);
      return null;
    }
  };
};

// Error boundary context for sharing error state across components
export interface ErrorBoundaryContextType {
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  hasGlobalError: boolean;
}

// Utility for creating error boundary context
export const createErrorBoundaryContext = () => {
  const errorHandlers: Array<(error: Error, context?: string) => void> = [];
  
  return {
    subscribe: (handler: (error: Error, context?: string) => void) => {
      errorHandlers.push(handler);
      return () => {
        const index = errorHandlers.indexOf(handler);
        if (index > -1) {
          errorHandlers.splice(index, 1);
        }
      };
    },
    reportError: (error: Error, context?: string) => {
      errorHandlers.forEach(handler => handler(error, context));
    },
  };
};
