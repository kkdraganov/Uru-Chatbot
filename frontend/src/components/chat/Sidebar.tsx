import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ConversationList from './ConversationList';
import { 
  PlusIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArchiveBoxIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';


interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const {
    conversations,
    createConversation,
    isLoading,
    error
  } = useChat();
  const { hasApiKey, isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const handleNewChat = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      alert('Please log in to create conversations');
      return;
    }

    // Check API key
    if (!hasApiKey()) {
      console.error('Please set your OpenAI API key in settings first');
      alert('Please set your OpenAI API key in settings first');
      return;
    }

    try {
      await createConversation('gpt-4o');
      console.log('New conversation created');
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  // Filter conversations based on search and filters
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesArchived = showArchived ? conv.is_archived : !conv.is_archived;
    const matchesPinned = showPinned ? conv.is_pinned : true;
    
    return matchesSearch && matchesArchived && matchesPinned;
  });

  // Sort conversations: pinned first, then by updated date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversations
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          disabled={isLoading || !isAuthenticated || !user || !hasApiKey()}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          title={
            !isAuthenticated || !user
              ? "Please log in to create conversations"
              : !hasApiKey()
              ? "Please set your OpenAI API key in settings"
              : "Create a new conversation"
          }
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        {/* Authentication/API Key Status */}
        {(!isAuthenticated || !user) && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Please log in to create conversations
            </p>
          </div>
        )}

        {isAuthenticated && user && !hasApiKey() && (
          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              Please set your OpenAI API key in settings
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-colors ${
              showPinned 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showPinned ? (
              <StarIconSolid className="h-3 w-3" />
            ) : (
              <StarIcon className="h-3 w-3" />
            )}
            <span>Pinned</span>
          </button>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-colors ${
              showArchived 
                ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ArchiveBoxIcon className="h-3 w-3" />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-red-600 dark:text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading conversations...</p>
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? (
              <p className="text-sm">No conversations match your search.</p>
            ) : conversations.length === 0 ? (
              <div>
                <p className="text-sm mb-2">No conversations yet.</p>
                <p className="text-xs">Click "New Chat" to get started!</p>
              </div>
            ) : (
              <p className="text-sm">No conversations in this view.</p>
            )}
          </div>
        ) : (
          <ConversationList 
            conversations={sortedConversations}
            onNewChat={handleNewChat}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          {conversations.length > 0 && (
            <p className="mt-1">
              {conversations.filter(c => c.is_pinned).length} pinned • {' '}
              {conversations.filter(c => c.is_archived).length} archived
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
