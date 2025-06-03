# Uru ChatGPT Web Interface - Architecture Design

## Overview

This document outlines the architecture for the Uru ChatGPT Web Interface, a platform that allows clients to use their own OpenAI API keys through Uru's branded interface. The system follows a modern, scalable architecture with a FastAPI backend and Next.js frontend.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client Browser │────▶│  Next.js        │────▶│  FastAPI        │
│  (React SPA)    │◀────│  Frontend       │◀────│  Backend        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  PostgreSQL     │
                                               │  (Metadata)     │
                                               │                 │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  OpenAI API     │
                                               │  (Client Keys)  │
                                               │                 │
                                               └─────────────────┘
```

### Key Components

1. **Frontend (Next.js)**
   - Chat interface
   - Settings management
   - API key handling (client-side only)
   - SSE client implementation

2. **Backend (FastAPI)**
   - Authentication service
   - Conversation metadata management
   - SSE streaming implementation
   - Model adapter pattern

3. **Database (PostgreSQL)**
   - Stores conversation metadata only
   - No message content storage
   - User account information

4. **External Services**
   - OpenAI API (using client-provided keys)
   - Future: Additional AI providers

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── security.py        # Security utilities
│   │   └── dependencies.py    # FastAPI dependencies
│   ├── adapters/
│   │   ├── base.py            # ModelAdapter base class
│   │   ├── openai_adapter.py  # OpenAI implementation
│   │   └── factory.py         # Adapter factory
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py        # Authentication routes
│   │   │   ├── chat.py        # Chat routes
│   │   │   └── conversations.py # Conversation management
│   │   ├── dependencies.py    # API-specific dependencies
│   │   └── router.py          # API router setup
│   ├── models/
│   │   ├── user.py            # User model
│   │   └── conversation.py    # Conversation metadata model
│   ├── schemas/
│   │   ├── user.py            # User schemas
│   │   ├── chat.py            # Chat schemas
│   │   └── conversation.py    # Conversation schemas
│   ├── streaming/
│   │   ├── sse.py             # SSE implementation
│   │   └── manager.py         # Streaming connection manager
│   ├── db/
│   │   ├── base.py            # Database setup
│   │   └── repositories/      # Repository pattern implementations
│   └── services/
│       ├── auth.py            # Authentication service
│       └── chat.py            # Chat service
└── requirements.txt           # Python dependencies
```

### Key Design Patterns

#### ModelAdapter Pattern

The ModelAdapter pattern provides an abstraction layer for different AI providers:

```python
# adapters/base.py
from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any, Optional

class ModelAdapter(ABC):
    """Base class for AI model adapters."""
    
    @abstractmethod
    async def generate_stream(
        self, 
        messages: list[Dict[str, str]], 
        model: str, 
        api_key: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming response from the model."""
        pass
    
    @abstractmethod
    async def validate_api_key(self, api_key: str) -> bool:
        """Validate if the provided API key is valid."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> list[str]:
        """Return list of available models for this adapter."""
        pass
```

```python
# adapters/openai_adapter.py
import openai
from openai import AsyncOpenAI
from .base import ModelAdapter

class OpenAIAdapter(ModelAdapter):
    """OpenAI implementation of ModelAdapter."""
    
    def __init__(self):
        self.available_models = [
            "gpt-4o", 
            "gpt-4o-mini", 
            "o1-preview", 
            "o1-mini"
        ]
    
    async def generate_stream(
        self, 
        messages: list[Dict[str, str]], 
        model: str, 
        api_key: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming response from OpenAI."""
        client = AsyncOpenAI(api_key=api_key)
        
        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def validate_api_key(self, api_key: str) -> bool:
        """Validate if the provided OpenAI API key is valid."""
        client = AsyncOpenAI(api_key=api_key)
        try:
            # Make a minimal API call to validate the key
            await client.models.list()
            return True
        except:
            return False
    
    def get_available_models(self) -> list[str]:
        """Return list of available models for OpenAI."""
        return self.available_models
```

#### SSE Implementation

Server-Sent Events (SSE) implementation for streaming responses:

```python
# streaming/sse.py
from fastapi import Request
from typing import AsyncIterator
import asyncio

class SSEResponse:
    """Server-Sent Events response handler."""
    
    def __init__(
        self, 
        content_iterator: AsyncIterator[str],
        event_type: str = "message"
    ):
        self.content_iterator = content_iterator
        self.event_type = event_type
    
    async def __call__(self, request: Request):
        """Generate SSE response."""
        async def event_generator():
            try:
                # Send initial connection established message
                yield f"event: {self.event_type}\ndata: Connection established\n\n"
                
                # Stream content from iterator
                async for content in self.content_iterator:
                    if await request.is_disconnected():
                        break
                    
                    # Format as SSE event
                    yield f"event: {self.event_type}\ndata: {content}\n\n"
                
                # Send completion message
                yield f"event: complete\ndata: Stream completed\n\n"
            except Exception as e:
                # Send error message
                yield f"event: error\ndata: {str(e)}\n\n"
        
        return event_generator()
```

#### Repository Pattern

Clean data access layer for conversation metadata:

```python
# db/repositories/conversation.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate

class ConversationRepository:
    """Repository for conversation operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, data: ConversationCreate, user_id: int) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            title=data.title,
            user_id=user_id,
            model=data.model
        )
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation
    
    async def get_by_id(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """Get conversation by ID for a specific user."""
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def get_all_by_user(self, user_id: int) -> List[Conversation]:
        """Get all conversations for a user."""
        query = select(Conversation).where(
            Conversation.user_id == user_id
        ).order_by(Conversation.updated_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update(
        self, 
        conversation_id: int, 
        user_id: int, 
        data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update conversation metadata."""
        conversation = await self.get_by_id(conversation_id, user_id)
        if not conversation:
            return None
        
        for key, value in data.dict(exclude_unset=True).items():
            setattr(conversation, key, value)
        
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation
    
    async def delete(self, conversation_id: int, user_id: int) -> bool:
        """Delete a conversation."""
        conversation = await self.get_by_id(conversation_id, user_id)
        if not conversation:
            return False
        
        await self.session.delete(conversation)
        await self.session.commit()
        return True
```

### Authentication System

JWT-based authentication with role-based access control:

```python
# core/security.py
from datetime import datetime, timedelta
from typing import Any, Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: str | Any, 
    expires_delta: Optional[timedelta] = None,
    scopes: list[str] = []
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "scopes": scopes
    }
    
    return jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)
```

## Frontend Architecture

### Directory Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── pages/
│   │   ├── index.tsx          # Home page
│   │   ├── chat/
│   │   │   ├── index.tsx      # Chat interface
│   │   │   └── [id].tsx       # Specific conversation
│   │   ├── settings.tsx       # Settings page
│   │   ├── login.tsx          # Login page
│   │   ├── register.tsx       # Registration page
│   │   └── _app.tsx           # Next.js app wrapper
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx     # App header
│   │   │   ├── Sidebar.tsx    # Conversation sidebar
│   │   │   └── Layout.tsx     # Main layout wrapper
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx  # Message input
│   │   │   ├── ChatMessage.tsx # Message display
│   │   │   ├── ModelSelector.tsx # Model dropdown
│   │   │   └── ConversationList.tsx # Sidebar conversations
│   │   ├── settings/
│   │   │   ├── ApiKeyForm.tsx # API key management
│   │   │   └── Preferences.tsx # User preferences
│   │   └── ui/                # Reusable UI components
│   ├── hooks/
│   │   ├── useAuth.ts         # Authentication hook
│   │   ├── useChat.ts         # Chat functionality
│   │   ├── useSSE.ts          # SSE connection
│   │   └── useLocalStorage.ts # Encrypted storage
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Authentication context
│   │   └── ChatContext.tsx    # Chat state management
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── encryption.ts      # Client-side encryption
│   │   └── validators.ts      # Input validation
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles and Tailwind config
├── tailwind.config.js         # Tailwind CSS configuration
├── next.config.js             # Next.js configuration
└── package.json               # Project dependencies
```

### Key Frontend Components

#### API Key Management

Secure client-side API key handling:

```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js';

/**
 * Encrypts sensitive data with a user-specific key
 */
export const encryptData = (data: string, userKey: string): string => {
  return CryptoJS.AES.encrypt(data, userKey).toString();
};

/**
 * Decrypts sensitive data with a user-specific key
 */
export const decryptData = (encryptedData: string, userKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, userKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generates a device-specific key for additional encryption layer
 */
export const generateDeviceKey = (): string => {
  // Create a unique device identifier based on browser fingerprint
  // This is a simplified version - in production use a robust fingerprinting library
  const browserInfo = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height
  ].join('|');
  
  return CryptoJS.SHA256(browserInfo).toString();
};

/**
 * Securely stores API key in localStorage with encryption
 */
export const storeApiKey = (apiKey: string): void => {
  if (!apiKey) return;
  
  // Get user ID from auth context to use as encryption key
  const userId = localStorage.getItem('userId') || 'default-user';
  const deviceKey = generateDeviceKey();
  const encryptionKey = `${userId}-${deviceKey}`;
  
  // Double encryption
  const encryptedKey = encryptData(apiKey, encryptionKey);
  localStorage.setItem('encrypted_api_key', encryptedKey);
};

/**
 * Retrieves and decrypts API key from localStorage
 */
export const getApiKey = (): string | null => {
  const encryptedKey = localStorage.getItem('encrypted_api_key');
  if (!encryptedKey) return null;
  
  // Get user ID from auth context to use as encryption key
  const userId = localStorage.getItem('userId') || 'default-user';
  const deviceKey = generateDeviceKey();
  const encryptionKey = `${userId}-${deviceKey}`;
  
  try {
    return decryptData(encryptedKey, encryptionKey);
  } catch (error) {
    console.error('Failed to decrypt API key');
    return null;
  }
};

/**
 * Removes API key from localStorage
 */
export const clearApiKey = (): void => {
  localStorage.removeItem('encrypted_api_key');
};
```

#### SSE Client Implementation

Robust SSE client with reconnection logic:

```typescript
// hooks/useSSE.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSSEOptions {
  url: string;
  onMessage: (data: string) => void;
  onError?: (error: Event) => void;
  onComplete?: () => void;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

interface UseSSEReturn {
  isConnected: boolean;
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSSE = ({
  url,
  onMessage,
  onError,
  onComplete,
  headers = {},
  withCredentials = true
}: UseSSEOptions): UseSSEReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  const connect = useCallback(() => {
    // Clean up existing connection
    disconnect();
    
    try {
      // Create new EventSource connection
      const eventSource = new EventSource(url, { withCredentials });
      eventSourceRef.current = eventSource;
      
      // Set up event handlers
      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        setError(null);
      };
      
      eventSource.onerror = (event) => {
        setError(event);
        setIsConnected(false);
        
        // Handle reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current += 1;
          
          setTimeout(() => {
            if (eventSourceRef.current === eventSource) {
              connect();
            }
          }, timeout);
        } else if (onError) {
          onError(event);
        }
      };
      
      // Message event handler
      eventSource.addEventListener('message', (event) => {
        onMessage(event.data);
      });
      
      // Complete event handler
      eventSource.addEventListener('complete', () => {
        if (onComplete) {
          onComplete();
        }
        disconnect();
      });
      
      // Error event handler for specific error events
      eventSource.addEventListener('error', (event) => {
        const data = JSON.parse(event.data);
        if (onError) {
          onError(new ErrorEvent('error', { message: data.message }));
        }
        disconnect();
      });
    } catch (err) {
      console.error('Failed to establish SSE connection:', err);
      setError(err as Event);
    }
  }, [url, onMessage, onError, onComplete, disconnect, withCredentials]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    isConnected,
    error,
    connect,
    disconnect
  };
};
```

#### Chat Context

Global state management for chat functionality:

```typescript
// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle incoming SSE messages
  const handleSSEMessage = useCallback((data: string) => {
    if (!currentConversation) return;
    
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
  }, [currentConversation]);
  
  // SSE connection for streaming responses
  const { connect, disconnect } = useSSE({
    url: `/api/chat/stream?conversationId=${currentConversation?.id || ''}`,
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
    try {
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (err) {
      setError('Failed to load conversations');
    }
  }, []);
  
  // Create a new conversation
  const createConversation = useCallback(async (model: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/conversations', { model });
      const newConversation = response.data;
      
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to create conversation');
      setIsLoading(false);
    }
  }, []);
  
  // Select an existing conversation
  const selectConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/conversations/${id}`);
      setCurrentConversation(response.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load conversation');
      setIsLoading(false);
    }
  }, []);
  
  // Send a message in the current conversation
  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return;
    
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
      // Start SSE connection for streaming response
      await api.post(`/chat/message`, {
        conversationId: currentConversation.id,
        message: content,
        apiKey // This will be sent securely over HTTPS
      });
      
      // Connect to SSE stream to receive response
      connect();
    } catch (err) {
      setError('Failed to send message');
      setIsLoading(false);
    }
  }, [currentConversation, connect]);
  
  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      await api.patch(`/conversations/${id}`, { title });
      
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
  }, [currentConversation]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(`/conversations/${id}`);
      
      setConversations(prev => 
        prev.filter(conv => conv.id !== id)
      );
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (err) {
      setError('Failed to delete conversation');
    }
  }, [currentConversation]);
  
  // Change the model for the current conversation
  const changeModel = useCallback(async (model: string) => {
    if (!currentConversation) return;
    
    try {
      await api.patch(`/conversations/${currentConversation.id}`, { model });
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        return { ...prev, model };
      });
    } catch (err) {
      setError('Failed to change model');
    }
  }, [currentConversation]);
  
  // Load conversations on initial mount
  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  // Clean up SSE connection on unmount
  React.useEffect(() => {
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
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     User        │       │  Conversation   │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ email           │       │ title           │
│ hashed_password │       │ user_id         │
│ is_active       │       │ model           │
│ role            │       │ created_at      │
│ created_at      │       │ updated_at      │
└─────────────────┘       │ token_count     │
        │                 └─────────────────┘
        │                         ▲
        └─────────────────────────┘
```

### SQL Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table (metadata only)
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    token_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Conversations

- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}` - Get conversation details
- `PATCH /api/conversations/{id}` - Update conversation metadata
- `DELETE /api/conversations/{id}` - Delete conversation

### Chat

- `POST /api/chat/message` - Send message and initiate streaming
- `GET /api/chat/stream` - SSE endpoint for streaming responses
- `POST /api/chat/validate-key` - Validate OpenAI API key

## Security Considerations

### API Key Handling

1. **Client-side only storage**: API keys are never sent to or stored on the server
2. **Encrypted storage**: Keys are encrypted before storing in localStorage
3. **HTTPS-only**: All communication is over HTTPS
4. **Key validation**: Keys are validated before use
5. **Clear on logout**: Keys are removed from storage on logout

### Authentication

1. **JWT-based**: Stateless authentication using JWT tokens
2. **Role-based access**: Foundation for future permission system
3. **Token expiration**: Short-lived tokens with refresh mechanism
4. **CSRF protection**: Implemented in all forms

### Data Protection

1. **No message storage**: Chat content is never stored on the server
2. **Metadata only**: Only conversation metadata is persisted
3. **Input validation**: All inputs are validated and sanitized
4. **Rate limiting**: Prevents abuse of the system

## Deployment Architecture

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.dynamosoftware.${INSTANCE}.com
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - SECRET_KEY=${JWT_SECRET}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - CORS_ORIGINS=https://dynamosoftware.${INSTANCE}.com
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx:/etc/nginx/conf.d
      - ./deployment/certbot/conf:/etc/letsencrypt
      - ./deployment/certbot/www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    volumes:
      - ./deployment/certbot/conf:/etc/letsencrypt
      - ./deployment/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Elestio Configuration

```yaml
# elestio.yml
app_name: uru-chatbot
instance: ${INSTANCE_NAME}
services:
  - name: frontend
    type: web
    tech: nextjs
    domain: dynamosoftware.${INSTANCE}.com
    https: true
    port: 3000
    dockerfile: ./frontend/Dockerfile
    env:
      - NEXT_PUBLIC_API_URL=https://api.dynamosoftware.${INSTANCE}.com
    resources:
      cpu: 1
      memory: 1G

  - name: backend
    type: api
    tech: python
    domain: api.dynamosoftware.${INSTANCE}.com
    https: true
    port: 8000
    dockerfile: ./backend/Dockerfile
    env:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - SECRET_KEY=${JWT_SECRET}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - CORS_ORIGINS=https://dynamosoftware.${INSTANCE}.com
    resources:
      cpu: 1
      memory: 1G

  - name: db
    type: database
    tech: postgresql
    version: 14
    env:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    resources:
      cpu: 0.5
      memory: 1G
    volumes:
      - data:/var/lib/postgresql/data

env_variables:
  - name: JWT_SECRET
    description: Secret key for JWT token generation
    required: true
    generate: true
    type: string
    length: 32

  - name: DB_USER
    description: Database username
    required: true
    default: postgres
    type: string

  - name: DB_PASSWORD
    description: Database password
    required: true
    generate: true
    type: password
    length: 16

  - name: DB_NAME
    description: Database name
    required: true
    default: uru_chatbot
    type: string

  - name: INSTANCE_NAME
    description: Instance name for subdomain
    required: true
    type: string
```

## Future Extensibility

### Multi-Provider Support

The ModelAdapter pattern allows easy integration of additional AI providers:

```python
# adapters/anthropic_adapter.py
from anthropic import AsyncAnthropic
from .base import ModelAdapter

class AnthropicAdapter(ModelAdapter):
    """Anthropic Claude implementation of ModelAdapter."""
    
    def __init__(self):
        self.available_models = [
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku"
        ]
    
    async def generate_stream(
        self, 
        messages: list[Dict[str, str]], 
        model: str, 
        api_key: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming response from Anthropic Claude."""
        client = AsyncAnthropic(api_key=api_key)
        
        # Convert messages to Anthropic format
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "user":
                anthropic_messages.append({"role": "user", "content": msg["content"]})
            elif msg["role"] == "assistant":
                anthropic_messages.append({"role": "assistant", "content": msg["content"]})
            elif msg["role"] == "system":
                # Handle system messages (Anthropic has different format)
                system_content = msg["content"]
        
        try:
            stream = await client.messages.create(
                model=model,
                messages=anthropic_messages,
                system=system_content if "system_content" in locals() else "",
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.type == "content_block_delta" and chunk.delta.text:
                    yield chunk.delta.text
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def validate_api_key(self, api_key: str) -> bool:
        """Validate if the provided Anthropic API key is valid."""
        client = AsyncAnthropic(api_key=api_key)
        try:
            # Make a minimal API call to validate the key
            await client.models.list()
            return True
        except:
            return False
    
    def get_available_models(self) -> list[str]:
        """Return list of available models for Anthropic."""
        return self.available_models
```

### Tool Integration Framework

Abstract framework for future tool integrations:

```python
# core/tools.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class Tool(ABC):
    """Base class for tool integrations."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description."""
        pass
    
    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """Tool parameters schema."""
        pass
    
    @abstractmethod
    async def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the tool with given parameters."""
        pass

class ToolRegistry:
    """Registry for available tools."""
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool) -> None:
        """Register a tool."""
        self._tools[tool.name] = tool
    
    def get_tool(self, name: str) -> Optional[Tool]:
        """Get tool by name."""
        return self._tools.get(name)
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available tools."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters
            }
            for tool in self._tools.values()
        ]
```

### OAuth Integration

Structure for future OAuth provider integration:

```python
# core/oauth.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class OAuthProvider(ABC):
    """Base class for OAuth providers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass
    
    @abstractmethod
    def get_authorization_url(self, redirect_uri: str) -> str:
        """Get authorization URL for OAuth flow."""
        pass
    
    @abstractmethod
    async def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens."""
        pass
    
    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token."""
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        pass

class OAuthRegistry:
    """Registry for OAuth providers."""
    
    def __init__(self):
        self._providers: Dict[str, OAuthProvider] = {}
    
    def register(self, provider: OAuthProvider) -> None:
        """Register an OAuth provider."""
        self._providers[provider.name] = provider
    
    def get_provider(self, name: str) -> Optional[OAuthProvider]:
        """Get provider by name."""
        return self._providers.get(name)
    
    def list_providers(self) -> list[str]:
        """List all available providers."""
        return list(self._providers.keys())
```

## Conclusion

This architecture design provides a solid foundation for the Uru ChatGPT Web Interface, addressing all the key requirements:

1. **Multi-Model Support**: Flexible model selection with the ModelAdapter pattern
2. **Client API Key Security**: Client-side encryption and no server storage
3. **Streaming Responses**: Robust SSE implementation with fallback mechanisms
4. **Extensibility**: Abstract patterns for future provider and tool integrations
5. **Deployment Ready**: Docker and Elestio configurations for easy deployment

The design follows modern best practices for web application development, with a clear separation of concerns, robust security measures, and a focus on user experience. The architecture is also designed to be easily extended for future requirements, such as multi-provider support, OAuth integration, and tool integrations.
