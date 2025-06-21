import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import { api, Conversation, ConversationCreate, ConversationUpdate, ChatRequest } from '../lib/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentMessages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingMessage: string;
  createConversation: (conversationData: ConversationCreate) => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateConversation: (id: number, updates: ConversationUpdate) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  changeModel: (model: string) => Promise<void>;
  stopGeneration: () => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, getApiKey } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Helper function to handle unauthorized errors
  const handleUnauthorizedError = useCallback(() => {
    // Clear tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userId');

    // Redirect to login
    router.push('/login');
  }, [router]);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    if (user) {
      refreshConversations();
    }
  }, [user]);

  // Refresh conversations from API
  const refreshConversations = useCallback(async () => {
    if (!isClient || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getConversations();

      // Ensure all conversations have messages array initialized
      const conversationsWithMessages = data.map((conv: any) => ({
        ...conv,
        messages: conv.messages || []
      }));

      setConversations(conversationsWithMessages);

      // If no current conversation and we have conversations, select the most recent one
      if (!currentConversation && conversationsWithMessages.length > 0) {
        setCurrentConversation(conversationsWithMessages[0]);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);

      // Handle unauthorized errors by redirecting to login
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      }

      setError(err.response?.data?.detail || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [isClient, user, currentConversation, handleUnauthorizedError]);
  
  // Stop generation function
  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setStreamingMessage('');
    }
  }, [abortController]);
  
  // Create a new conversation
  const createConversation = useCallback(async (conversationData: ConversationCreate) => {
    if (!isClient) {
      console.error('Client not initialized');
      return;
    }

    if (!user) {
      console.error('User not authenticated - cannot create conversation');
      setError('Please log in to create conversations');
      return;
    }

    // Check if user has a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setError('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newConversation = await api.createConversation(conversationData);

      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setCurrentMessages([]);
      setIsLoading(false);

      console.log('New conversation created');
    } catch (err: any) {
      console.error('Failed to create conversation:', err);

      // Handle specific error cases
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      } else if (err.response?.status === 403) {
        setError('You do not have permission to create conversations.');
      } else {
        setError(err.message || 'Failed to create conversation');
      }

      setIsLoading(false);
    }
  }, [isClient, user, handleUnauthorizedError]);
  
  // Select an existing conversation
  const selectConversation = useCallback(async (id: number) => {
    if (!isClient || !user) return;

    // Stop any ongoing generation
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    setIsLoading(true);
    setError(null);
    setStreamingMessage('');

    try {
      const conversation = conversations.find(c => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
        setCurrentMessages([]); // Messages will be loaded separately if needed
      } else {
        // Fetch from API if not in local state
        const fetchedConversation = await api.getConversation(id);
        setCurrentConversation(fetchedConversation);
        setCurrentMessages([]); // Messages will be loaded separately if needed
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);

      // Handle unauthorized errors by redirecting to login
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      }

      setError(err.message || 'Failed to load conversation');
      setIsLoading(false);
    }
  }, [isClient, user, conversations, abortController, handleUnauthorizedError]);
  
  // Send a message in the current conversation
  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation || !isClient || !user) return;

    setIsLoading(true);
    setError(null);
    setStreamingMessage('');

    // Get API key from secure storage
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('API key not found. Please add your OpenAI API key in settings.');
      setIsLoading(false);
      return;
    }

    // Add user message to current messages
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setCurrentMessages(prev => [...prev, userMessage]);

    try {
      // Create abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Prepare chat request
      const chatRequest: ChatRequest = {
        conversation_id: currentConversation.id,
        message: content,
        api_key: apiKey,
        ai_model: currentConversation.ai_model,
        stream: true
      };

      // Send message and get streaming response
      const response = await fetch(`${api.getApiUrl()}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(chatRequest),
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorizedError();
          return;
        }
        throw new Error(`HTTP error - status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk' && data.content) {
                assistantMessage += data.content;
                setStreamingMessage(assistantMessage);
              } else if (data.type === 'complete') {
                // Add final assistant message to current messages
                const finalAssistantMessage: Message = {
                  role: 'assistant',
                  content: assistantMessage,
                  timestamp: new Date().toISOString(),
                  model: currentConversation.ai_model
                };

                setCurrentMessages(prev => [...prev, finalAssistantMessage]);
                setStreamingMessage('');
                setIsLoading(false);
                setAbortController(null);

                // Refresh conversations to update stats
                refreshConversations();
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown error occurred');
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Failed to send message:', err);

      if (err.name === 'AbortError') {
        setError('Message generation was stopped');
      } else {
        setError(err.message || 'Failed to send message');
      }

      setIsLoading(false);
      setStreamingMessage('');
      setAbortController(null);
    }
  }, [currentConversation, isClient, user, getApiKey, refreshConversations, handleUnauthorizedError]);
  
  // Update conversation
  const updateConversation = useCallback(async (id: number, updates: ConversationUpdate) => {
    if (!isClient || !user) return;

    try {
      const updatedConversation = await api.updateConversation(id, updates);

      setConversations(prev =>
        prev.map(conv =>
          conv.id === id ? updatedConversation : conv
        )
      );

      if (currentConversation?.id === id) {
        setCurrentConversation(updatedConversation);
      }
    } catch (err: any) {
      console.error('Failed to update conversation:', err);

      // Handle unauthorized errors by redirecting to login
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      }

      setError('Failed to update conversation');
    }
  }, [currentConversation, isClient, user, handleUnauthorizedError]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: number) => {
    if (!isClient || !user) return;

    try {
      await api.deleteConversation(id);

      setConversations(prev =>
        prev.filter(conv => conv.id !== id)
      );

      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setCurrentMessages([]);
      }

      console.log('Conversation deleted');
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);

      // Handle unauthorized errors by redirecting to login
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      }

      setError('Failed to delete conversation');
    }
  }, [currentConversation, isClient, user, handleUnauthorizedError]);

  // Change the model for the current conversation
  const changeModel = useCallback(async (model: string) => {
    if (!currentConversation || !isClient || !user) return;

    try {
      const updatedConversation = await api.updateConversation(currentConversation.id, { ai_model: model });

      setCurrentConversation(updatedConversation);

      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation.id ? updatedConversation : conv
        )
      );

    } catch (err: any) {
      console.error('Failed to change model:', err);

      // Handle unauthorized errors by redirecting to login
      if (err.response?.status === 401) {
        handleUnauthorizedError();
        return;
      }

      setError('Failed to change model');
    }
  }, [currentConversation, isClient, user, handleUnauthorizedError]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const value = {
    conversations,
    currentConversation,
    currentMessages,
    isLoading,
    error,
    streamingMessage,
    createConversation,
    selectConversation,
    sendMessage,
    updateConversation,
    deleteConversation,
    changeModel,
    stopGeneration,
    refreshConversations
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
