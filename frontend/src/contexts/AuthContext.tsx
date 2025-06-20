import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '../lib/api';
import { storeApiKey, getApiKey, clearApiKey } from '../lib/encryption';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  full_name: string;
  created_at: string;
  updated_at: string;
}

// Utility function to convert Azure external user email format to original email
const getDisplayEmail = (email: string): string => {
  if (email.includes('#EXT#@')) {
    // Convert Azure external user format back to original email
    // alan_uruenterprises.com#EXT#@alanuruenterprises.onmicrosoft.com -> alan@uruenterprises.com
    const parts = email.split('#EXT#@');
    if (parts.length === 2) {
      const originalEmail = parts[0].replace('_', '@'); // Replace first underscore with @
      return originalEmail;
    }
  }
  return email;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  setApiKey: (apiKey: string) => void;
  getApiKey: () => string | null;
  hasApiKey: () => boolean;
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string; models?: string[] }>;
  refreshUser: () => Promise<void>;
  azureLogin: (code: string) => Promise<boolean>;
  getDisplayEmail: (email: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Validate token and get user info
        await refreshUser();
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!isClient) return;

    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, [isClient]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isClient) return false;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);

      // Store token
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Get user data
      await refreshUser();

      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, [isClient, refreshUser]);

  // Register function
  const register = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> => {
    if (!isClient) return false;

    setIsLoading(true);
    setError(null);

    try {
      await api.register(email, password, firstName, lastName);
      return await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
      setIsLoading(false);
      return false;
    }
  }, [login, isClient]);

  // Logout function
  const logout = useCallback(() => {
    if (!isClient) return;

    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    clearApiKey();
    setUser(null);
    setIsAuthenticated(false);
  }, [isClient]);

  // Set API key function
  const setApiKeyFunc = useCallback((apiKey: string) => {
    if (!isClient) return;
    storeApiKey(apiKey);
  }, [isClient]);

  // Get API key function
  const getApiKeyFunc = useCallback((): string | null => {
    if (!isClient) return null;
    return getApiKey();
  }, [isClient]);

  // Validate API key function
  const validateApiKey = useCallback(async (apiKey: string) => {
    if (!isClient) {
      return { valid: false, error: 'Client not ready' };
    }

    try {
      const result = await api.validateApiKey(apiKey);
      return result;
    } catch (err: any) {
      return {
        valid: false,
        error: err.response?.data?.detail || 'Failed to validate API key'
      };
    }
  }, [isClient]);

  // Azure login
const azureLogin = useCallback(async (code: string): Promise<boolean> => {
  if (!isClient) return false;

  setIsLoading(true);
  setError(null);

  try {
    const data = await api.azureLogin(code);

    // Store token
    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    // Get user data
    await refreshUser();
  
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Azure login failed');
    setIsLoading(false);
    return false;
  }
}, [isClient, refreshUser]);

  // Check if API key exists
  const hasApiKey = useCallback((): boolean => {
    if (!isClient) return false;
    return !!getApiKey();
  }, [isClient]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setApiKey: setApiKeyFunc,
    getApiKey: getApiKeyFunc,
    hasApiKey,
    validateApiKey,
    refreshUser,
    azureLogin,
    getDisplayEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
