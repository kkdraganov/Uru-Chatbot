import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import {
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  ArchiveBoxIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';


interface Conversation {
  id: string;
  title: string;
  model: string;
  is_pinned: boolean;
  is_archived: boolean;
  message_count: number;
  updated_at: string;
  display_title: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  onNewChat: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onNewChat }) => {
  const {
    currentConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    isLoading
  } = useChat();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async (conversationId: string) => {
    if (editTitle.trim()) {
      try {
        await updateConversationTitle(conversationId, editTitle.trim());
        setEditingId(null);
        console.log('Title updated');
      } catch (error) {
        console.error('Failed to update title');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      console.log('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-2 p-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`group relative rounded-lg transition-colors ${
            currentConversation?.id === conversation.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div
            className="flex items-center p-3 cursor-pointer"
            onClick={() => selectConversation(conversation.id)}
          >
            {/* Icon and Pin indicator */}
            <div className="flex-shrink-0 mr-3 relative">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              {conversation.is_pinned && (
                <StarIconSolid className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingId === conversation.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(conversation.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(conversation.id);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.display_title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.model}
                    </span>
                    {conversation.message_count > 0 && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                    {conversation.is_archived && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Archived</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Actions Menu */}
            {editingId !== conversation.id && (
              <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Menu as="div" className="relative">
                  <Menu.Button
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisVerticalIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(conversation);
                              }}
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <PencilIcon className="h-4 w-4 mr-3" />
                              Rename
                            </button>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle pin functionality would go here
                                console.log('Pin/unpin functionality coming soon');
                              }}
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              {conversation.is_pinned ? (
                                <StarIconSolid className="h-4 w-4 mr-3 text-yellow-400" />
                              ) : (
                                <StarIcon className="h-4 w-4 mr-3" />
                              )}
                              {conversation.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle archive functionality would go here
                                console.log('Archive functionality coming soon');
                              }}
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <ArchiveBoxIcon className="h-4 w-4 mr-3" />
                              {conversation.is_archived ? 'Unarchive' : 'Archive'}
                            </button>
                          )}
                        </Menu.Item>

                        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(conversation.id);
                              }}
                              className={`${
                                active ? 'bg-red-50 dark:bg-red-900/20' : ''
                              } flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-400`}
                            >
                              <TrashIcon className="h-4 w-4 mr-3" />
                              Delete
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
