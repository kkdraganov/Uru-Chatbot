import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import ApiKeyForm from '../components/settings/ApiKeyForm';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('api-key');

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'api-key' 
                ? 'border-b-2 border-primary-500 text-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('api-key')}
          >
            API Key
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'preferences' 
                ? 'border-b-2 border-primary-500 text-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'api-key' && (
            <ApiKeyForm />
          )}
          
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              <p className="text-gray-600">
                Preferences settings will be available in a future update.
              </p>
            </div>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/chat')}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
