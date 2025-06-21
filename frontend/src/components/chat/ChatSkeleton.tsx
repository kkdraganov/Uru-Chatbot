import React from 'react';
import { SkeletonLoader, SkeletonText, SkeletonAvatar } from '../ui/SkeletonLoader';

export const ChatMessageSkeleton: React.FC<{
  isUser?: boolean;
  className?: string;
}> = ({ isUser = false, className }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
    <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
      {!isUser && <SkeletonAvatar size="sm" />}
      
      <div className={`rounded-2xl p-4 ${
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <SkeletonText 
          lines={Math.floor(Math.random() * 3) + 1} 
          className={isUser ? 'opacity-30' : ''} 
        />
      </div>
    </div>
  </div>
);

export const ChatInterfaceSkeleton: React.FC = () => (
  <div className="flex flex-col h-full bg-white dark:bg-gray-900">
    {/* Chat messages area */}
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Simulate a conversation with alternating messages */}
        <ChatMessageSkeleton isUser={false} />
        <ChatMessageSkeleton isUser={true} />
        <ChatMessageSkeleton isUser={false} />
        <ChatMessageSkeleton isUser={true} />
        <ChatMessageSkeleton isUser={false} />
        
        {/* Loading indicator for new message */}
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
      </div>
    </div>

    {/* Chat input skeleton */}
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <SkeletonLoader height="2.5rem" rounded="lg" />
        </div>
        <SkeletonLoader width="2.5rem" height="2.5rem" rounded="lg" />
      </div>
    </div>
  </div>
);

export const ConversationListSkeleton: React.FC<{
  items?: number;
}> = ({ items = 5 }) => {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-3">
            <SkeletonLoader width="1.25rem" height="1.25rem" rounded="sm" />
            <SkeletonLoader height="1rem" width="60%" />
          </div>
          <div className="ml-8">
            <SkeletonLoader height="0.75rem" width="80%" />
            <div className="flex items-center space-x-2 mt-1">
              <SkeletonLoader height="0.625rem" width="3rem" />
              <SkeletonLoader height="0.625rem" width="2rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SidebarSkeleton: React.FC = () => {
  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header skeleton */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <SkeletonLoader height="1.5rem" width="8rem" />
          <SkeletonLoader width="2rem" height="2rem" rounded="md" />
        </div>

        {/* Search bar skeleton */}
        <SkeletonLoader height="2.5rem" rounded="lg" />

        {/* Filter buttons skeleton */}
        <div className="flex space-x-2 mt-3">
          <SkeletonLoader height="1.75rem" width="4rem" rounded="md" />
          <SkeletonLoader height="1.75rem" width="4rem" rounded="md" />
          <SkeletonLoader height="1.75rem" width="4rem" rounded="md" />
        </div>
      </div>

      {/* Conversations list skeleton */}
      <div className="flex-1 overflow-y-auto">
        <ConversationListSkeleton />
      </div>

      {/* Footer skeleton */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <SkeletonLoader height="0.875rem" width="60%" />
            <SkeletonLoader height="0.75rem" width="40%" className="mt-1" />
          </div>
          <SkeletonLoader width="1.5rem" height="1.5rem" rounded="sm" />
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceSkeleton;
