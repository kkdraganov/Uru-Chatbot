import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ChatErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
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

    // Log chat-specific error details
    console.error('ChatErrorBoundary caught an error:', error);
    console.error('Chat Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log chat-specific context
    if (process.env.NODE_ENV === 'development') {
      console.group('💬 Chat Error Boundary Details');
      console.error('Chat Error:', error);
      console.error('Chat Component Stack:', errorInfo.componentStack);
      console.error('Retry Count:', this.state.retryCount);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }
  };

  handleResetChat = () => {
    // Reset the error boundary and clear retry count
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    // Clear any chat-related data from localStorage
    if (typeof window !== 'undefined') {
      // Clear any cached conversation data that might be causing issues
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('chat_') || key.startsWith('conversation_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Call custom retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children } = this.props;

    if (hasError) {
      const canRetry = retryCount < this.maxRetries;
      
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Chat Error
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {retryCount > 0 
                ? `We're having trouble loading the chat interface (attempt ${retryCount + 1}/${this.maxRetries + 1}).`
                : "There was an error loading the chat interface."
              }
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
                  <div>
                    <strong>Retry Count:</strong> {retryCount}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {canRetry ? (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Maximum retry attempts reached.
                  </p>
                  <button
                    onClick={this.handleResetChat}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    Reset Chat
                  </button>
                </div>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              If this problem continues, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ChatErrorBoundary;
