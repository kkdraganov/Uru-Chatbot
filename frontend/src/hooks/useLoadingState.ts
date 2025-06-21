import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  minLoadingTime?: number; // Minimum time to show loading state (prevents flashing)
  timeout?: number; // Timeout for operations
}

interface UseLoadingStateReturn<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: T | null) => void;
}

export const useLoadingState = <T = any>(
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn<T> => {
  const {
    initialLoading = false,
    minLoadingTime = 300, // 300ms minimum loading time
    timeout = 30000 // 30 second timeout
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    data: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (minTimeRef.current) clearTimeout(minTimeRef.current);
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null
    });
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (minTimeRef.current) {
      clearTimeout(minTimeRef.current);
      minTimeRef.current = null;
    }
  }, []);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    // Clear any existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (minTimeRef.current) clearTimeout(minTimeRef.current);

    // Start loading
    startTimeRef.current = Date.now();
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      });

      // Execute the async function with timeout
      const result = await Promise.race([
        asyncFn(),
        timeoutPromise
      ]);

      // Clear timeout since operation completed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Calculate remaining minimum loading time
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const remainingTime = Math.max(0, minLoadingTime - elapsed);

      // Ensure minimum loading time is respected
      if (remainingTime > 0) {
        await new Promise(resolve => {
          minTimeRef.current = setTimeout(resolve, remainingTime);
        });
      }

      // Update state with success
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: result,
        error: null
      }));

      return result;

    } catch (error) {
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Calculate remaining minimum loading time even for errors
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const remainingTime = Math.max(0, minLoadingTime - elapsed);

      if (remainingTime > 0) {
        await new Promise(resolve => {
          minTimeRef.current = setTimeout(resolve, remainingTime);
        });
      }

      // Update state with error
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      console.error('useLoadingState error:', error);
      return null;
    }
  }, [minLoadingTime, timeout]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    execute,
    reset,
    setLoading,
    setError,
    setData
  };
};

// Utility hook for simple async operations
export const useAsyncOperation = <T = any>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseLoadingStateOptions = {}
) => {
  const loadingState = useLoadingState<T>(options);

  useEffect(() => {
    if (asyncFn) {
      loadingState.execute(asyncFn);
    }
  }, dependencies);

  return loadingState;
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const getLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    getLoading,
    isAnyLoading
  };
};
