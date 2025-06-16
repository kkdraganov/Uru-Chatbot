import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const TestPage: React.FC = () => {
  const [tests, setTests] = useState<{ name: string; status: 'pending' | 'pass' | 'fail'; message?: string }[]>([
    { name: 'Auth Context', status: 'pending' },
    { name: 'Chat Context', status: 'pending' },
    { name: 'API Connection', status: 'pending' },
    { name: 'Environment Variables', status: 'pending' },
  ]);

  const { user, isLoading: authLoading } = useAuth();
  const { conversations, isLoading: chatLoading } = useChat();

  useEffect(() => {
    runTests();
  }, []);

  const updateTest = (name: string, status: 'pass' | 'fail', message?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message } : test
    ));
  };

  const runTests = async () => {
    // Test 1: Auth Context
    try {
      if (typeof useAuth === 'function') {
        updateTest('Auth Context', 'pass', 'Auth context is available');
      } else {
        updateTest('Auth Context', 'fail', 'Auth context not found');
      }
    } catch (error) {
      updateTest('Auth Context', 'fail', `Error: ${error}`);
    }

    // Test 2: Chat Context
    try {
      if (typeof useChat === 'function') {
        updateTest('Chat Context', 'pass', 'Chat context is available');
      } else {
        updateTest('Chat Context', 'fail', 'Chat context not found');
      }
    } catch (error) {
      updateTest('Chat Context', 'fail', `Error: ${error}`);
    }

    // Test 3: API Connection
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          updateTest('API Connection', 'pass', `Connected to ${apiUrl}`);
        } else {
          updateTest('API Connection', 'fail', `API returned ${response.status}`);
        }
      } else {
        updateTest('API Connection', 'fail', 'NEXT_PUBLIC_API_URL not configured');
      }
    } catch (error) {
      updateTest('API Connection', 'fail', `Connection failed: ${error}`);
    }

    // Test 4: Environment Variables
    try {
      const requiredEnvs = ['NEXT_PUBLIC_API_URL'];
      const missing = requiredEnvs.filter(env => !process.env[env]);
      
      if (missing.length === 0) {
        updateTest('Environment Variables', 'pass', 'All required env vars present');
      } else {
        updateTest('Environment Variables', 'fail', `Missing: ${missing.join(', ')}`);
      }
    } catch (error) {
      updateTest('Environment Variables', 'fail', `Error: ${error}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Uru Chatbot - System Test
          </h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Test Results */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
              <div className="space-y-3">
                {tests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(test.status)}</span>
                      <span className="font-medium text-gray-700">{test.name}</span>
                    </div>
                    <span className={`text-sm ${getStatusColor(test.status)}`}>
                      {test.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={runTests}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Run Tests Again
              </button>
            </div>

            {/* System Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong>Environment:</strong> {process.env.NODE_ENV || 'Unknown'}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong>Auth Status:</strong> {authLoading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong>Chat Status:</strong> {chatLoading ? 'Loading...' : `${conversations.length} conversations`}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'Server-side'}
                </div>
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Details</h2>
            <div className="space-y-2">
              {tests.map((test, index) => (
                test.message && (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <strong>{test.name}:</strong> {test.message}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex space-x-4">
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Home
            </Link>
            <Link
              href="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Chat Interface →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
