import React from 'react';
import { useChat } from '../../contexts/ChatContext';

interface ModelSelectorProps {
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ disabled = false }) => {
  const { currentConversation, changeModel, isLoading } = useChat();
  
  const models = [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o1-preview', name: 'o1-preview' },
    { id: 'o1-mini', name: 'o1-mini' }
  ];
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled && !isLoading) {
      changeModel(e.target.value);
    }
  };
  
  return (
    <div className="flex items-center">
      <label htmlFor="model-selector" className="mr-2 text-sm text-gray-600">
        Model:
      </label>
      <select
        id="model-selector"
        value={currentConversation?.model || 'gpt-4o'}
        onChange={handleModelChange}
        disabled={disabled || isLoading || !currentConversation}
        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
