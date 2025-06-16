import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/outline';


interface ChatInputProps {
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, isLoading, stopGeneration, currentConversation } = useChat();
  const { hasApiKey } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading || disabled) return;

    if (!hasApiKey()) {
      console.error('Please set your OpenAI API key in settings');
      return;
    }

    if (!currentConversation) {
      console.error('Please select or create a conversation');
      return;
    }

    try {
      // Send message
      await sendMessage(message.trim());

      // Clear input
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle stop generation
  const handleStop = () => {
    if (stopGeneration) {
      stopGeneration();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // max-h-30 equivalent
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Focus textarea when conversation changes
  useEffect(() => {
    if (currentConversation && textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [currentConversation, disabled]);

  const isDisabled = disabled || !hasApiKey() || !currentConversation;
  const canSend = message.trim() && !isDisabled && !isLoading;

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end space-x-3">
            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isDisabled
                    ? !hasApiKey()
                      ? "Please set your API key in settings..."
                      : !currentConversation
                      ? "Select a conversation to start chatting..."
                      : "Type your message..."
                    : "Type your message..."
                }
                className={`w-full border rounded-2xl py-3 px-4 pr-12 resize-none transition-all duration-200 ${
                  isDisabled
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                } placeholder-gray-400 dark:placeholder-gray-500`}
                rows={1}
                disabled={isDisabled}
                maxLength={10000}
              />

              {/* Character count */}
              {message.length > 8000 && (
                <div className="absolute bottom-1 left-3 text-xs text-gray-400">
                  {message.length}/10000
                </div>
              )}
            </div>

            {/* Send/Stop button */}
            <div className="flex-shrink-0">
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                  title="Stop generation"
                >
                  <StopIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  className={`p-3 rounded-2xl transition-colors ${
                    canSend
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Help text */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Press Enter to send, Shift+Enter for new line
            </span>
            {currentConversation && (
              <span>
                Model: {currentConversation.model}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
