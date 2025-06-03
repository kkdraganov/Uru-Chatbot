import React from 'react';
import { useChat } from '../../contexts/ChatContext';

interface ConversationListProps {
  onNewChat: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onNewChat }) => {
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    deleteConversation,
    isLoading 
  } = useChat();
  
  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        disabled={isLoading}
        className="flex items-center justify-center w-full py-3 px-4 mb-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        New Chat
      </button>
      
      {/* Conversation List */}
      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No conversations yet
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div 
                  className={`
                    flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer
                    ${currentConversation?.id === conversation.id 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'hover:bg-gray-100'
                    }
                  `}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="flex items-center truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{conversation.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
