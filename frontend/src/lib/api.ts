import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    
    // Handle registration errors specifically
    if (error.response.status === 400 && error.config.url?.includes('/api/auth/register')) {
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please check your input and try again.';
      return Promise.reject(new Error(errorMessage));
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.detail || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  // Auth endpoints
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await apiClient.post('/api/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  register: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/register', { email, password }, {
        withCredentials: false
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
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
  
  createConversation: async (model: string) => {
    const response = await apiClient.post('/conversations', { 
      title: 'New conversation',
      model 
    });
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
      conversationId,
      message,
      apiKey,
      model
    });
    return response.data;
  },
  
  validateApiKey: async (apiKey: string) => {
    const response = await apiClient.post('/chat/validate-key', { apiKey });
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
