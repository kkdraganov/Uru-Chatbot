import axios, { AxiosResponse } from 'axios';

// Function to determine API URL
function getApiUrl(): string {
  // DEBUG: Log environment variable check (api.ts:getApiUrl)
  console.log('[API] Checking NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
  console.log('[API] Environment check - ENVIRONMENT:', process.env.ENVIRONMENT);

  // First, try the explicit environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('[API] Using NEXT_PUBLIC_API_URL from environment:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're explicitly in development mode
  const isDevelopment = process.env.ENVIRONMENT === 'development';

  if (isDevelopment) {
    console.log('[API] Development mode detected, using localhost');
    return 'http://localhost:8000/api';
  }

  // If we're in the browser, try to detect from current location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('[API] Browser detected, current hostname:', hostname);

    // For localhost or development domains, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      console.log('[API] Local development hostname detected, using localhost backend');
      return 'http://localhost:8000/api';
    }

    // Check if we're on a production domain
    if (hostname.includes('.uruenterprises.com')) {
      // Extract the instance part (e.g., "dynamosoftware.chat-dev" from "dynamosoftware.chat-dev.uruenterprises.com")
      const instancePart = hostname.replace('.uruenterprises.com', '');
      const apiUrl = `https://api.${instancePart}.uruenterprises.com/api`;
      console.log('[API] Auto-detected production API URL from hostname:', apiUrl);
      return apiUrl;
    } else {
      console.log('[API] Hostname does not contain .uruenterprises.com, using localhost fallback');
    }
  } else {
    console.log('[API] Server-side rendering detected, using localhost fallback');
  }

  // Fallback to localhost for development
  console.log('[API] Using localhost fallback for development');
  return 'http://localhost:8000/api';
}

// Types matching OpenAPI schema exactly
export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  preferences?: any;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Conversation {
  id: number;
  title: string;
  ai_model: string;
  system_prompt?: string;
  user_id: number;
  is_archived: boolean;
  is_pinned: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title: string;
  ai_model: string;
  system_prompt?: string;
}

export interface ConversationUpdate {
  title?: string;
  ai_model?: string;
  system_prompt?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
}

export interface ChatRequest {
  conversation_id: number;
  message: string;
  api_key: string;
  ai_model?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  context_length: number;
  input_cost_per_token: number;
  output_cost_per_token: number;
  supports_streaming: boolean;
}

export interface AvailableModelsResponse {
  models: ModelInfo[];
  default_model: string;
}

export interface ValidateKeyRequest {
  api_key: string;
}

export interface ValidateKeyResponse {
  valid: boolean;
  models?: string[];
  organization?: string;
  usage_limit?: any;
  error?: string;
}

const API_URL = getApiUrl();

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
  // Add withCredentials for CORS
  withCredentials: true,
});

// DEBUG: Log API client initialization (api.ts:client_init)
console.log('[API] API Client initialized with baseURL:', API_URL);
console.log('[API] Client config - timeout: 10000ms, withCredentials: true');

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error);

    // Handle network errors
    if (!error.response) {
      console.error('Network Error - Unable to reach the server');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection.'));
    }

    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      // Only access localStorage in browser environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    // Handle validation errors (422)
    if (error.response.status === 422) {
      const validationErrors = error.response?.data?.detail;
      if (Array.isArray(validationErrors)) {
        // Extract validation error messages
        const errorMessages = validationErrors.map(err => {
          if (err.loc && err.msg) {
            const field = err.loc[err.loc.length - 1]; // Get the field name
            return `${field}: ${err.msg}`;
          }
          return err.msg || 'Validation error';
        });
        const errorMessage = errorMessages.join(', ');
        return Promise.reject(new Error(errorMessage));
      } else if (typeof validationErrors === 'string') {
        return Promise.reject(new Error(validationErrors));
      }
    }

    // Handle registration errors specifically
    if (error.response.status === 400 && error.config.url?.includes('/auth/register')) {
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please check your input and try again.';
      return Promise.reject(new Error(errorMessage));
    }

    // Handle other errors
    const errorMessage = error.response?.data?.detail || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  // Debug method to check API configuration
  getApiUrl: () => API_URL,

  // Auth endpoints
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Conversation endpoints - matching OpenAPI schema exactly
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/conversations/');
    return response.data;
  },

  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  createConversation: async (conversationData: ConversationCreate): Promise<Conversation> => {
    const response = await apiClient.post('/conversations/', conversationData);
    return response.data;
  },

  updateConversation: async (conversationId: number, updates: ConversationUpdate): Promise<Conversation> => {
    const response = await apiClient.patch(`/conversations/${conversationId}`, updates);
    return response.data;
  },

  deleteConversation: async (conversationId: number): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  // Chat endpoints - matching OpenAPI schema exactly
  sendMessage: async (chatRequest: ChatRequest): Promise<any> => {
    const response = await apiClient.post('/chat/message', chatRequest);
    return response.data;
  },

  validateApiKey: async (validateRequest: ValidateKeyRequest): Promise<ValidateKeyResponse> => {
    const response = await apiClient.post('/chat/validate-key', validateRequest);
    return response.data;
  },

  getAvailableModels: async (): Promise<AvailableModelsResponse> => {
    const response = await apiClient.get('/chat/models');
    return response.data;
  },

  getModelInfo: async (modelId: string): Promise<ModelInfo> => {
    const response = await apiClient.get(`/chat/models/${modelId}`);
    return response.data;
  },
  
  // Generic request method
  get: async (url: string) => {
    const response = await apiClient.get(url);
    return response;
  },
  
  post: async (url: string, data: any) => {
    const response = await apiClient.post(url, data);
    return response;
  },
  
  patch: async (url: string, data: any) => {
    const response = await apiClient.patch(url, data);
    return response;
  },
  
  delete: async (url: string) => {
    const response = await apiClient.delete(url);
    return response;
  },
  
  // Azure SSO login endpoint
  azureLogin: async (code: string): Promise<Token> => {
    const response = await apiClient.post('/auth/azure-login', { code });
    return response.data;
  },

  // Streaming support for chat messages
  sendMessageStream: async (chatRequest: ChatRequest): Promise<ReadableStream> => {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ ...chatRequest, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    return response.body;
  },
};
