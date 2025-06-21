import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import ChatInterface from '../../components/chat/ChatInterface';
import Sidebar from '../../components/chat/Sidebar';
import Header from '../../components/chat/Header';
import SettingsModal from '../../components/settings/SettingsModal';
import { ChatInterfaceSkeleton, SidebarSkeleton } from '../../components/chat/ChatSkeleton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ConversationCreate } from '../../lib/api';


const ChatPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, hasApiKey } = useAuth();
  const { isLoading: chatLoading } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user needs to set up API key
    if (user && !hasApiKey()) {
      setShowApiKeyPrompt(true);
      setSettingsOpen(true);
    }
  }, [user, hasApiKey, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
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
