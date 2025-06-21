import React from 'react';
import ChatErrorBoundary from './ChatErrorBoundary';
import ChatInterface from './ChatInterface';
import { useChat } from '../../contexts/ChatContext';

const ChatInterfaceWrapper: React.FC = () => {
  const { refreshConversations } = useChat();

  const handleChatError = (error: Error, errorInfo: any) => {
    console.error('Chat interface error:', error);
    console.error('Error info:', errorInfo);
    
    // In production, you could send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  const handleRetry = () => {
    // Refresh conversations when retrying
    refreshConversations();
  };

  return (
    <ChatErrorBoundary
      onError={handleChatError}
      onRetry={handleRetry}
    >
      <ChatInterface />
    </ChatErrorBoundary>
  );
};

export default ChatInterfaceWrapper;
