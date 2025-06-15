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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    // Check authentication status
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isClient) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.login(email, password);
      
      // Store token and user ID
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', email);
      
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, [isClient]);

  // Register function
  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isClient) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.register(email, password);
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
    localStorage.removeItem('userId');
    clearApiKey();
    setIsAuthenticated(false);
  }, [isClient]);

  // Set API key function
  const setApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    if (!isClient) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await api.validateApiKey(apiKey);
      
      if (result.valid) {
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
  }, [isClient]);

  // Check if API key exists
  const hasApiKey = useCallback((): boolean => {
    if (!isClient) return false;
    return !!getApiKey();
  }, [isClient]);

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
