import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return null;
  }
  
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('App-level error caught:', error);
          console.error('Error info:', errorInfo);
        }

        // In production, you could send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
      resetKeys={[router.asPath]} // Reset error boundary on route changes
    >
      <ThemeProvider>
        <ToastProvider>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Theme provider error:', error);
            }}
          >
            <AuthProvider>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('Auth provider error:', error);
                }}
              >
                <ChatProvider>
                  <ErrorBoundary
                    onError={(error, errorInfo) => {
                      console.error('Chat provider error:', error);
                    }}
                  >
                    <Component {...pageProps} />
                  </ErrorBoundary>
                </ChatProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
