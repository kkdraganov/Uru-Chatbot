import React from 'react';
import { clsx } from 'clsx';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  className?: string;
  text?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'blue',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    gray: 'bg-gray-600',
    white: 'bg-white',
    green: 'bg-green-600',
    red: 'bg-red-600'
  };

  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      <div className="flex space-x-1">
        <div
          className={clsx(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={clsx(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={clsx(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {text && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingDots;
