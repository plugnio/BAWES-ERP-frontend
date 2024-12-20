'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Props for the ErrorBoundary component
 * @interface Props
 * @property {ReactNode} children - The components to be monitored for errors
 * @property {ReactNode} [fallback] - Optional custom UI to display when an error occurs
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * State interface for the ErrorBoundary component
 * @interface State
 * @property {boolean} hasError - Indicates if an error has occurred
 * @property {Error | null} error - The error object if an error occurred
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary is a React component that catches JavaScript errors in its child component tree.
 * It prevents the whole app from crashing and displays a fallback UI when an error occurs.
 * 
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback UI
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /**
   * Static method called when an error occurs in a child component
   * Updates the state to indicate an error has occurred
   * @param {Error} error - The error that was thrown
   * @returns {State} New state object with error information
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called when an error is caught
   * Logs the error to the console for debugging
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Additional information about the error
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  /**
   * Resets the error state when retry is attempted
   * This allows the component tree to re-render and potentially recover
   */
  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Renders either the error UI when an error occurs, or the children when no error
   * @returns {ReactNode} Either the fallback UI, default error alert, or children components
   */
  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4"
            onClick={this.handleRetry}
          >
            Try again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
} 