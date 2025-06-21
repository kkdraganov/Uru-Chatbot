import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {
  UserIcon,
  SparklesIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp?: string;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  model,
  timestamp,
  isStreaming = false
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isUser ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <SparklesIcon className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
          {/* Header with name and timestamp */}
          <div className={`flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ${
            isUser ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <span className="font-medium">
              {isUser ? (user?.full_name || 'You') : (model || 'Assistant')}
            </span>
            {timestamp && (
              <span>{formatTime(timestamp)}</span>
            )}
            {isStreaming && (
              <span className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span>Typing...</span>
              </span>
            )}
          </div>

          {/* Message bubble */}
          <div
            className={`relative px-4 py-3 rounded-2xl max-w-none ${
              isUser
                ? 'bg-primary-600 text-white rounded-tr-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-md'
            }`}
          >
            {/* Copy button */}
            {!isStreaming && content && (
              <button
                onClick={handleCopy}
                className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10`}
                title="Copy message"
              >
                {copied ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
            )}

            {/* Content */}
            <div className={`prose prose-sm max-w-none ${
              isUser
                ? 'prose-invert'
                : 'prose-gray dark:prose-invert'
            }`}>
              {isAssistant ? (
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const inline = !className;
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !mt-2 !mb-2"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className={`${className} bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {content}
                </div>
              )}
            </div>

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-current animate-pulse ml-1"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
