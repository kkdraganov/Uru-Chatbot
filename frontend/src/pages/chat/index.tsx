import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import ChatInterface from '../../components/chat/ChatInterface';
import Sidebar from '../../components/chat/Sidebar';
import Header from '../../components/chat/Header';
import SettingsModal from '../../components/settings/SettingsModal';


const ChatPage: React.FC = () => {
  const { user, isLoading: authLoading, hasApiKey } = useAuth();
  const { isLoading: chatLoading } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  useEffect(() => {
    // Check if user needs to set up API key
    if (user && !hasApiKey()) {
      setShowApiKeyPrompt(true);
      setSettingsOpen(true);
    }
  }, [user, hasApiKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the chat interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setShowApiKeyPrompt(false);
        }}
        showApiKeyPrompt={showApiKeyPrompt}
      />
    </div>
  );
};

export default ChatPage;
