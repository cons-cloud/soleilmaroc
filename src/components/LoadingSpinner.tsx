import React from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'primary' | 'white' | 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'indigo' | 'purple' | 'pink';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-4',
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'border-primary-500 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
  red: 'border-red-500 border-t-transparent',
  green: 'border-green-500 border-t-transparent',
  blue: 'border-blue-500 border-t-transparent',
  yellow: 'border-yellow-500 border-t-transparent',
  indigo: 'border-indigo-500 border-t-transparent',
  purple: 'border-purple-500 border-t-transparent',
  pink: 'border-pink-500 border-t-transparent',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const colorClass = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`inline-block ${className}`} role="status">
      <div
        className={`animate-spin rounded-full ${sizeClass} ${colorClass}`}
        aria-hidden="true"
      >
        <span className="sr-only">Chargement...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
