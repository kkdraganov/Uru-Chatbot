import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '../lib/api';
import { storeApiKey, getApiKey, clearApiKey } from '../lib/encryption';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setApiKey: (apiKey: string) => Promise<boolean>;
  hasApiKey: () => boolean;
  clearApiKey: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication status on client-side only
  useEffect(() => {
    // This code only runs in the browser, after the component is mounted
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.login(email, password);
      
      // Store token and user ID
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', email); // Using email as user ID for simplicity
      
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.register(email, password);
      
      // Auto-login after registration
      return await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
      setIsLoading(false);
      return false;
    }
  }, [login]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    clearApiKey();
    setIsAuthenticated(false);
  }, []);

  // Set API key function
  const setApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate API key with backend
      const result = await api.validateApiKey(apiKey);
      
      if (result.valid) {
        // Store API key securely
        storeApiKey(apiKey);
        setIsLoading(false);
        return true;
      } else {
        setError('Invalid API key');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to validate API key');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check if API key exists
  const hasApiKey = useCallback((): boolean => {
    return !!getApiKey();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setApiKey,
    hasApiKey,
    clearApiKey
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
