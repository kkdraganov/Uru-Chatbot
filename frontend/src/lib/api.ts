import axios from 'axios';

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
        localStorage.removeItem('userId');
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

  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName
      }, {
        withCredentials: false
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  // Conversation endpoints
  getConversations: async () => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  getConversation: async (id: string) => {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  },

  createConversation: async (data: { title: string; model: string; system_prompt?: string }) => {
    const response = await apiClient.post('/conversations', data);
    return response.data;
  },

  updateConversation: async (id: string, data: { title?: string, model?: string }) => {
    const response = await apiClient.patch(`/conversations/${id}`, data);
    return response.data;
  },

  deleteConversation: async (id: string) => {
    const response = await apiClient.delete(`/conversations/${id}`);
    return response.data;
  },
  
  // Chat endpoints
  sendMessage: async (conversationId: string, message: string, apiKey: string, model?: string) => {
    const response = await apiClient.post('/chat/message', {
      conversation_id: parseInt(conversationId),
      message,
      api_key: apiKey,
      model
    });
    return response.data;
  },

  validateApiKey: async (apiKey: string) => {
    const response = await apiClient.post('/chat/validate-key', { api_key: apiKey });
    return response.data;
  },

  getAvailableModels: async () => {
    const response = await apiClient.get('/chat/models');
    return response.data;
  },

  getModelInfo: async (modelId: string) => {
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
  }
};
