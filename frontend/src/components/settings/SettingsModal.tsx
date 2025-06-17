import React, { useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showApiKeyPrompt?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  showApiKeyPrompt = false 
}) => {
  const { user, setApiKey, getApiKey, validateApiKey } = useAuth();
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKeyValue] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    models?: string[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existingKey = getApiKey();
      if (existingKey) {
        setApiKeyValue(existingKey);
      }
    }
  }, [isOpen, getApiKey]);

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      console.error('Please enter an API key');
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await validateApiKey(apiKey);
      setValidationResult(result);
      
      if (result.valid) {
        console.log('API key is valid!');
      } else {
        console.error(result.error || 'Invalid API key');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationResult({ valid: false, error: errorMessage });
      console.error(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      console.error('Please enter an API key');
      return;
    }

    if (validationResult && !validationResult.valid) {
      console.error('Please validate your API key first');
      return;
    }

    setApiKey(apiKey);
    console.log('API key saved successfully');
    
    if (showApiKeyPrompt) {
      onClose();
    }
  };

  const handleRemoveApiKey = () => {
    setApiKey('');
    setApiKeyValue('');
    setValidationResult(null);
    console.log('API key removed');
  };

  const tabs = [
    { name: 'API Key', id: 'api-key' },
    { name: 'Profile', id: 'profile' },
    { name: 'Preferences', id: 'preferences' }
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Settings
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
                    {tabs.map((tab) => (
                      <Tab
                        key={tab.id}
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                            selected
                              ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
                          }`
                        }
                      >
                        {tab.name}
                      </Tab>
                    ))}
                  </Tab.List>
                  
                  <Tab.Panels className="mt-6">
                    {/* API Key Tab */}
                    <Tab.Panel className="space-y-4">
                      {showApiKeyPrompt && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                API Key Required
                              </h3>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Please add your OpenAI API key to start chatting. Your key is stored securely in your browser and never sent to our servers.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          OpenAI API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKeyValue(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                          >
                            {showApiKey ? (
                              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {validationResult && (
                          <div className={`mt-2 p-3 rounded-lg ${
                            validationResult.valid 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}>
                            <div className="flex">
                              {validationResult.valid ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
                              ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                              )}
                              <div className="ml-3">
                                <p className={`text-sm ${
                                  validationResult.valid 
                                    ? 'text-green-800 dark:text-green-200' 
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                  {validationResult.valid 
                                    ? 'API key is valid!' 
                                    : validationResult.error || 'Invalid API key'
                                  }
                                </p>
                                {validationResult.valid && validationResult.models && (
                                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                    {validationResult.models.length} models available
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Your API key is encrypted and stored locally in your browser. It's never sent to our servers.
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={handleValidateApiKey}
                          disabled={validating || !apiKey.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          {validating ? 'Validating...' : 'Validate Key'}
                        </button>
                        <button
                          onClick={handleSaveApiKey}
                          disabled={!apiKey.trim()}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Save Key
                        </button>
                        {getApiKey() && (
                          <button
                            onClick={handleRemoveApiKey}
                            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </Tab.Panel>

                    {/* Profile Tab */}
                    <Tab.Panel className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Role
                            </label>
                            <input
                              type="text"
                              value={user?.role || ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize"
                            />
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>

                    {/* Preferences Tab */}
                    <Tab.Panel className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>

                        {/* Theme Selection */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Theme
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: 'Light', icon: SunIcon },
                              { value: 'dark', label: 'Dark', icon: MoonIcon },
                              { value: 'system', label: 'System', icon: ComputerDesktopIcon }
                            ].map(({ value, label, icon: Icon }) => (
                              <button
                                key={value}
                                onClick={() => setTheme(value as any)}
                                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                                  theme === value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <Icon className="h-6 w-6 mb-2" />
                                <span className="text-sm font-medium">{label}</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            System theme follows your device's appearance settings.
                          </p>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SettingsModal;
