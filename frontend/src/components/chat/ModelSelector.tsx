import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';


interface ModelInfo {
  id: string;
  name: string;
  description: string;
  context_length: number;
  input_cost_per_token: number;
  output_cost_per_token: number;
  supports_streaming: boolean;
}

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onModelChange,
  disabled = false
}) => {
  const { getApiKey } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Default models if API call fails
  const defaultModels: ModelInfo[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most advanced multimodal model',
      context_length: 128000,
      input_cost_per_token: 0.005 / 1000,
      output_cost_per_token: 0.015 / 1000,
      supports_streaming: true
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast and efficient model for simple tasks',
      context_length: 128000,
      input_cost_per_token: 0.00015 / 1000,
      output_cost_per_token: 0.0006 / 1000,
      supports_streaming: true
    },
    {
      id: 'o1',
      name: 'o1',
      description: 'Advanced reasoning model',
      context_length: 200000,
      input_cost_per_token: 0.015 / 1000,
      output_cost_per_token: 0.06 / 1000,
      supports_streaming: false
    },
    {
      id: 'o1-mini',
      name: 'o1 Mini',
      description: 'Efficient reasoning model',
      context_length: 128000,
      input_cost_per_token: 0.003 / 1000,
      output_cost_per_token: 0.012 / 1000,
      supports_streaming: false
    }
  ];

  const loadAvailableModels = useCallback(async () => {
    try {
      setLoading(true);
      const apiKey = getApiKey();

      if (!apiKey) {
        setModels(defaultModels);
        return;
      }

      // In a real implementation, you'd call your API to get available models
      // For now, we'll use the default models
      setModels(defaultModels);
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels(defaultModels);
    } finally {
      setLoading(false);
    }
  }, [getApiKey]);

  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  const handleModelChange = (modelId: string) => {
    if (!disabled && !loading) {
      onModelChange(modelId);
      const model = models.find(m => m.id === modelId);
      if (model) {
        console.log(`Switched to ${model.name}`);
      }
    }
  };

  const formatCost = (cost: number) => {
    return `$${(cost * 1000).toFixed(4)}/1K tokens`;
  };

  return (
    <Listbox value={currentModel} onChange={handleModelChange} disabled={disabled || loading}>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
          <span className="flex items-center">
            <span className="block truncate font-medium text-gray-900 dark:text-white">
              {selectedModel?.name || 'Select Model'}
            </span>
            {selectedModel && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {selectedModel.context_length.toLocaleString()} ctx
              </span>
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-96 w-80 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {models.map((model) => (
              <Listbox.Option
                key={model.id}
                className={({ active }) =>
                  `relative cursor-default select-none py-3 pl-3 pr-9 ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white'
                  }`
                }
                value={model.id}
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className={`block truncate font-medium ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {model.name}
                        </span>
                        {!model.supports_streaming && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            No streaming
                          </span>
                        )}
                      </div>
                      <span className={`block text-sm ${active ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {model.description}
                      </span>
                      <div className={`flex items-center space-x-4 text-xs mt-1 ${active ? 'text-blue-200' : 'text-gray-400'}`}>
                        <span>{model.context_length.toLocaleString()} tokens</span>
                        <span>In: {formatCost(model.input_cost_per_token)}</span>
                        <span>Out: {formatCost(model.output_cost_per_token)}</span>
                      </div>
                    </div>

                    {selected ? (
                      <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-blue-600'}`}>
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default ModelSelector;
