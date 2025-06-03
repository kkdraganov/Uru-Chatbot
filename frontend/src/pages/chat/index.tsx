import React from 'react';
import { useRouter } from 'next/router';
import { useChat } from '../../contexts/ChatContext';
import Layout from '../../components/layout/Layout';
import ChatInterface from '../../components/chat/ChatInterface';
import ConversationList from '../../components/chat/ConversationList';

const ChatPage: React.FC = () => {
  const router = useRouter();
  const { createConversation } = useChat();
  
  const handleNewChat = async () => {
    // Create a new conversation with default model
    await createConversation('gpt-4o');
  };
  
  return (
    <Layout>
      <div className="flex h-[calc(100vh-10rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white p-4 border-r border-gray-200 hidden md:block">
          <ConversationList onNewChat={handleNewChat} />
        </div>
        
        {/* Mobile sidebar button */}
        <div className="md:hidden fixed bottom-20 left-4 z-10">
          <button
            onClick={() => {/* Toggle mobile sidebar */}}
            className="bg-primary-600 text-white p-3 rounded-full shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
