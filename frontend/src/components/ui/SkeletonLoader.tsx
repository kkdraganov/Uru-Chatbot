import React from 'react';
import { clsx } from 'clsx';

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  width,
  height,
  rounded = 'md',
  animate = true
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700',
        roundedClasses[rounded],
        animate && 'animate-pulse',
        className
      )}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className, lastLineWidth = '75%' }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        height="1rem"
        width={index === lines - 1 ? lastLineWidth : '100%'}
        className="block"
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <SkeletonLoader
      className={clsx(sizeClasses[size], className)}
      rounded="full"
    />
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  showAvatar?: boolean;
  showImage?: boolean;
}> = ({ className, showAvatar = false, showImage = false }) => (
  <div className={clsx('p-4 border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
    {showImage && (
      <SkeletonLoader height="12rem" className="mb-4" />
    )}
    
    <div className="flex items-start space-x-3">
      {showAvatar && <SkeletonAvatar />}
      
      <div className="flex-1 space-y-3">
        <SkeletonLoader height="1.25rem" width="60%" />
        <SkeletonText lines={2} />
        
        <div className="flex space-x-2">
          <SkeletonLoader height="0.75rem" width="4rem" />
          <SkeletonLoader height="0.75rem" width="3rem" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
  showAvatar?: boolean;
}> = ({ items = 5, className, showAvatar = false }) => (
  <div className={clsx('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="1rem" width="70%" />
          <SkeletonLoader height="0.75rem" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
