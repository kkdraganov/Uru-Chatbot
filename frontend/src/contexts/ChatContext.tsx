import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getApiKey } from '../lib/encryption';
import { useSSE } from '../hooks/useSSE';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  createConversation: (model: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  changeModel: (model: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    loadConversations().finally(() => setIsLoading(false));
  }, []);
  
  // Handle incoming SSE messages
  const handleSSEMessage = useCallback((data: string) => {
    if (!currentConversation || !isClient) return;
    
    try {
      const parsedData = JSON.parse(data);
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        const updatedMessages = [...prev.messages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        
        // If the last message is from the assistant, append to it
        if (lastMessage && lastMessage.role === 'assistant') {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + parsedData.content
          };
        } else {
          // Otherwise create a new message
          updatedMessages.push({
            role: 'assistant',
            content: parsedData.content
          });
        }
        
        return {
          ...prev,
          messages: updatedMessages
        };
      });
    } catch (err) {
      console.error('Failed to parse SSE message:', err);
    }
  }, [currentConversation, isClient]);
  
  // SSE connection for streaming responses
  const { connect, disconnect } = useSSE({
    url: isClient ? `${process.env.NEXT_PUBLIC_API_URL}/chat/stream?conversationId=${currentConversation?.id || ''}` : '',
    onMessage: handleSSEMessage,
    onError: (event) => {
      setError('Connection error: Please try again');
      setIsLoading(false);
    },
    onComplete: () => {
      setIsLoading(false);
    }
  });
  
  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const response = await api.getConversations();
      setConversations(response);
    } catch (err) {
      setError('Failed to load conversations');
    }
  }, [isClient]);
  
  // Create a new conversation
  const createConversation = useCallback(async (model: string) => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newConversation = await api.createConversation(model);
      
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation({
        ...newConversation,
        messages: []
      });
      setIsLoading(false);
    } catch (err) {
      setError('Failed to create conversation');
      setIsLoading(false);
    }
  }, [isClient]);
  
  // Select an existing conversation
  const selectConversation = useCallback(async (id: string) => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const conversation = await api.getConversation(id);
      setCurrentConversation({
        ...conversation,
        messages: []
      });
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load conversation');
      setIsLoading(false);
    }
  }, [isClient]);
  
  // Send a message in the current conversation
  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation || !isClient) return;
    
    setIsLoading(true);
    setError(null);
    
    // Get API key from secure storage
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('API key not found. Please add your OpenAI API key in settings.');
      setIsLoading(false);
      return;
    }
    
    // Update UI optimistically
    const newMessage: Message = { role: 'user', content };
    setCurrentConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
    
    try {
      // Send message to API
      await api.sendMessage(
        currentConversation.id,
        content,
        apiKey,
        currentConversation.model
      );
      
      // Connect to SSE stream to receive response
      connect();
    } catch (err) {
      setError('Failed to send message');
      setIsLoading(false);
    }
  }, [currentConversation, connect, isClient]);
  
  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    if (!isClient) return;
    
    try {
      await api.updateConversation(id, { title });
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, title } : conv
        )
      );
      
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return { ...prev, title };
        });
      }
    } catch (err) {
      setError('Failed to update conversation title');
    }
  }, [currentConversation, isClient]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (!isClient) return;
    
    try {
      await api.deleteConversation(id);
      
      setConversations(prev => 
        prev.filter(conv => conv.id !== id)
      );
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (err) {
      setError('Failed to delete conversation');
    }
  }, [currentConversation, isClient]);
  
  // Change the model for the current conversation
  const changeModel = useCallback(async (model: string) => {
    if (!currentConversation || !isClient) return;
    
    try {
      await api.updateConversation(currentConversation.id, { model });
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        return { ...prev, model };
      });
    } catch (err) {
      setError('Failed to change model');
    }
  }, [currentConversation, isClient]);
  
  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  const value = {
    conversations,
    currentConversation,
    isLoading,
    error,
    createConversation,
    selectConversation,
    sendMessage,
    updateConversationTitle,
    deleteConversation,
    changeModel
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
