import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';

interface ChatInputProps {
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, isLoading } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    // Send message
    await sendMessage(message);
    
    // Clear input
    setMessage('');
  };
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
  
  return (
    <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full border border-gray-300 rounded-xl py-3 px-4 pr-12 resize-none max-h-32 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={1}
            disabled={disabled || isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled || isLoading}
            className={`absolute right-3 bottom-3 rounded-lg p-1 ${
              !message.trim() || disabled || isLoading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};

export default ChatInput;
