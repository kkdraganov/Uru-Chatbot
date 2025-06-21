import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api, UserCreate, ValidateKeyRequest, ValidateKeyResponse } from '../lib/api';
import { storeApiKey, getApiKey, clearApiKey } from '../lib/encryption';

interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  preferences?: any;
  last_login?: string;
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
  register: (userData: UserCreate) => Promise<boolean>;
  logout: () => void;
  setApiKey: (apiKey: string) => void;
  getApiKey: () => string | null;
  hasApiKey: () => boolean;
  validateApiKey: (apiKey: string) => Promise<ValidateKeyResponse>;
  refreshUser: () => Promise<void>;
  azureLogin: (code: string) => Promise<boolean>;
  getDisplayEmail: (email: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Computed property: user is authenticated if user object exists
  const isAuthenticated = !!user;

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
        // isAuthenticated will be true automatically if user is set by refreshUser
      } else {
        // No token found, ensure user is null
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setUser(null);
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
      // isAuthenticated will be true automatically if user is set by refreshUser

      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, [isClient, refreshUser]);

  // Register function
  const register = useCallback(async (userData: UserCreate): Promise<boolean> => {
    if (!isClient) return false;

    setIsLoading(true);
    setError(null);

    try {
      await api.register(userData);
      return await login(userData.email, userData.password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
    // isAuthenticated will be false automatically when user is null
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
  const validateApiKey = useCallback(async (apiKey: string): Promise<ValidateKeyResponse> => {
    if (!isClient) {
      return { valid: false, error: 'Client not ready' };
    }

    try {
      const validateRequest: ValidateKeyRequest = { api_key: apiKey };
      const result = await api.validateApiKey(validateRequest);
      return result;
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Failed to validate API key'
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
    // isAuthenticated will be true automatically if user is set by refreshUser

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
