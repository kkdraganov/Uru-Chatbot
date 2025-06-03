import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from '../chat/ChatMessage';
import ChatInput from '../chat/ChatInput';
import ModelSelector from '../chat/ModelSelector';

const ChatInterface: React.FC = () => {
  const { hasApiKey } = useAuth();
  const { currentConversation, isLoading, error } = useChat();
  
  // Check if API key is set
  const apiKeyMissing = !hasApiKey();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with model selector */}
      <div className="border-b border-gray-200 bg-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">
          {currentConversation?.title || 'New Conversation'}
        </h2>
        <ModelSelector disabled={apiKeyMissing || !currentConversation} />
      </div>
      
      {/* Chat messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {apiKeyMissing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md bg-white rounded-xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2m-2 0H9" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">API Key Required</h3>
              <p className="text-gray-600 mb-4">
                Please add your OpenAI API key in the settings to start chatting.
              </p>
              <a 
                href="/settings" 
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Settings
              </a>
            </div>
          </div>
        ) : !currentConversation ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Conversation Selected</h3>
              <p className="text-gray-600">
                Select a conversation from the sidebar or create a new one to start chatting.
              </p>
            </div>
          </div>
        ) : currentConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-xl font-medium text-gray-800 mb-2">Start a New Conversation</h3>
              <p className="text-gray-600">
                Send a message to start chatting with the AI assistant.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentConversation.messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                role={message.role} 
                content={message.content} 
              />
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat input */}
      <ChatInput disabled={apiKeyMissing || !currentConversation} />
    </div>
  );
};

export default ChatInterface;
