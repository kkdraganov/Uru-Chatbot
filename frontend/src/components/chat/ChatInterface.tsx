import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from '../chat/ChatMessage';
import ChatInput from '../chat/ChatInput';
import { ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ChatInterface: React.FC = () => {
  const { hasApiKey } = useAuth();
  const { currentConversation, isLoading, error, streamingMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Check if API key is set
  const apiKeyMissing = !hasApiKey();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages, streamingMessage, isAtBottom]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
    setIsAtBottom(atBottom);
  };

  // Scroll to bottom button
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 relative"
        onScroll={handleScroll}
      >
        {apiKeyMissing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">API Key Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please add your OpenAI API key in the settings to start chatting. Your key is stored securely in your browser.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Open Settings
              </button>
            </div>
          </div>
        ) : !currentConversation ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Welcome to Uru Chatbot</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a conversation from the sidebar or create a new one to start chatting with AI.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>✨ Powered by OpenAI</p>
                <p>🔒 Your API key stays private</p>
                <p>💬 Real-time streaming responses</p>
              </div>
            </div>
          </div>
        ) : currentConversation.messages.length === 0 && !streamingMessage ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Start a New Conversation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Send a message below to start chatting with {currentConversation.model}.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Model: <span className="font-medium">{currentConversation.model}</span></p>
                {currentConversation.system_prompt && (
                  <p className="mt-1">Custom system prompt active</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {currentConversation.messages.map((message, index) => (
              <ChatMessage
                key={`${currentConversation.id}-${index}`}
                role={message.role}
                content={message.content}
                model={message.role === 'assistant' ? currentConversation.model : undefined}
                timestamp={new Date().toISOString()} // In real app, this would come from message data
              />
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <ChatMessage
                role="assistant"
                content={streamingMessage}
                model={currentConversation.model}
                isStreaming={true}
                timestamp={new Date().toISOString()}
              />
            )}

            {/* Loading indicator */}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {!isAtBottom && currentConversation && currentConversation.messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <ChatInput disabled={apiKeyMissing || !currentConversation} />
      </div>
    </div>
  );
};

export default ChatInterface;
