import React from 'react';
import { useChat } from '../../contexts/ChatContext';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  // Determine styling based on message role
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[80%] px-4 py-3 rounded-xl 
          ${isUser 
            ? 'bg-primary-600 text-white rounded-tr-none' 
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }
        `}
      >
        {/* Render message content with proper formatting */}
        <div className="prose prose-sm">
          {content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
