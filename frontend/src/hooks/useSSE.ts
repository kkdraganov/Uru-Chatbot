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
  const isClient = typeof window !== 'undefined';
  
  const disconnect = useCallback(() => {
    if (!isClient) return;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, [isClient]);
  
  const connect = useCallback(() => {
    if (!isClient || !url) return;
    
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
        // MessageEvent has data property, but regular Event doesn't
        const messageEvent = event as MessageEvent;
        if (messageEvent.data) {
          try {
            const data = JSON.parse(messageEvent.data);
            if (onError) {
              onError(new ErrorEvent('error', { message: data.message }));
            }
          } catch (err) {
            if (onError) {
              onError(event);
            }
          }
        } else {
          if (onError) {
            onError(event);
          }
        }
        disconnect();
      });
    } catch (err) {
      console.error('Failed to establish SSE connection:', err);
      setError(err as Event);
    }
  }, [url, onMessage, onError, onComplete, disconnect, withCredentials, isClient]);
  
  // Clean up on unmount
  useEffect(() => {
    if (!isClient) return;
    
    return () => {
      disconnect();
    };
  }, [disconnect, isClient]);
  
  return {
    isConnected,
    error,
    connect,
    disconnect
  };
};
