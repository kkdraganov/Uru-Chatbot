import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { AzureLoginButton } from '../components/AzureLoginButton';
import { UserCreate } from '../lib/api';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, register, user, isLoading, error } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Only redirect if user exists (meaning they're properly authenticated)
  // AND we've finished loading (prevents premature redirects)
  useEffect(() => {
    if (!isLoading && user) {
      // Add a small delay to prevent redirect during form submission
      const timer = setTimeout(() => {
        router.push('/chat');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

    if (!email || !password || (!isLoginMode && !name)) {
      setLocalError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    // Password validation for registration
    if (!isLoginMode) {
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let success = false;
      
      if (isLoginMode) {
        success = await login(email, password);
      } else {
        const userData: UserCreate = {
          email,
          password,
          name
        };
        success = await register(userData);
      }

      if (success) {
        router.push('/chat');
      } else {
        setLocalError(isLoginMode ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoginMode ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLoginMode ? 'Sign in to your Uru Chatbot account' : 'Get started with Uru Chatbot'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          {/* Azure SSO Button */}
          <div className="mb-6">
            <AzureLoginButton />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required={!isLoginMode}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLoginMode ? "current-password" : "new-password"}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder={isLoginMode ? "Enter your password" : "Create a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {!isLoginMode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            {displayError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                <div className="text-sm text-red-700 dark:text-red-400">{displayError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLoginMode ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLoginMode ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setLocalError(null);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium transition-colors"
            >
              {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
