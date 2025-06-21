import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log auth-specific error details
    console.error('AuthErrorBoundary caught an error:', error);
    console.error('Auth Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log auth-specific context
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Auth Error Boundary Details');
      console.error('Auth Error:', error);
      console.error('Auth Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Clear auth-related data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoToLogin = () => {
    // Clear auth data and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <UserIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Error
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an error with the authentication system. This might be due to an expired session or a temporary issue.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Development Error Details
                </h4>
                <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                  <div className="mb-1">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoToLogin}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Go to Login
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              If this problem continues, try clearing your browser data or contact support.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default AuthErrorBoundary;
