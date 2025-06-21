import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate a unique event ID for this error
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      errorInfo,
      eventId,
    });

    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, also log to help with debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Props:', this.props);
      console.error('State:', this.state);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when any prop changes (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Error Details (Development)
                </h3>
                <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event ID for support */}
            {eventId && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Error ID:</strong> {eventId}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
