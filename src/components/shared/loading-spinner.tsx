import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Valid sizes for the loading spinner
 * @type {('sm' | 'md' | 'lg')}
 */
type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Props for the LoadingSpinner component
 * @interface LoadingSpinnerProps
 * @property {SpinnerSize} [size='md'] - Size of the spinner: 'sm' (small), 'md' (medium), or 'lg' (large)
 * @property {string} [className] - Additional CSS classes to apply to the spinner
 */
interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

/**
 * Mapping of spinner sizes to their respective Tailwind CSS classes
 * @const {Record<SpinnerSize, string>}
 */
const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

/**
 * A reusable loading spinner component that uses Tailwind CSS for styling
 * Displays an animated circular spinner with configurable size
 * 
 * @example
 * // Basic usage with default size (md)
 * <LoadingSpinner />
 * 
 * // Small spinner with custom classes
 * <LoadingSpinner size="sm" className="text-blue-500" />
 * 
 * // Large spinner
 * <LoadingSpinner size="lg" />
 * 
 * @param {LoadingSpinnerProps} props - Component props
 * @returns {JSX.Element} A spinning loader element
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
} 