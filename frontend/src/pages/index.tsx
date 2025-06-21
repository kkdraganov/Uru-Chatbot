import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const IndexPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsRedirecting(true);
      if (user) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);
  
  // Show loading state while checking auth or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Uru Chatbot Interface</h2>
        <div className="animate-pulse flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
        </div>
        {(isLoading || isRedirecting) && (
          <p className="mt-4 text-sm text-gray-600">
            {isLoading ? 'Checking authentication...' : 'Redirecting...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default IndexPage;
