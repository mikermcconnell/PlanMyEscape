import React from 'react';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';

interface LoadingStateProps {
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  isOffline?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading = false,
  error = null,
  isEmpty = false,
  isOffline = false,
  emptyMessage = 'No items found',
  children,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 text-xs text-blue-500 hover:underline"
        >
          Try refreshing the page
        </button>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <WifiOff className="h-8 w-8 text-orange-500 mb-3" />
        <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
          You're offline. Changes will sync when connection is restored.
        </p>
      </div>
    );
  }

  if (isEmpty && !children) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-gray-500 ${className}`}>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Skeleton loader for list items
export const ItemSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse p-4 border rounded-lg mb-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </>
  );
};

// Inline loading indicator for buttons
export const ButtonLoader: React.FC<{ loading?: boolean; children: React.ReactNode }> = ({ 
  loading = false, 
  children 
}) => {
  return (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {children}
    </>
  );
};