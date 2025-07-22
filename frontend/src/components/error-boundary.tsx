'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { formatErrorMessage } from '@/lib/utils/formatting';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'section';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'page' | 'component' | 'section';
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, level }: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isComponentLevel = level === 'component';

  const containerClasses = isPageLevel 
    ? 'min-h-screen flex items-center justify-center bg-background'
    : isComponentLevel
    ? 'flex items-center justify-center p-8 bg-card border border-border rounded-lg'
    : 'flex items-center justify-center p-4 bg-muted rounded';

  const iconSize = isPageLevel ? 'h-16 w-16' : 'h-8 w-8';
  const titleSize = isPageLevel ? 'text-2xl' : 'text-lg';

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertCircle className={`${iconSize} text-destructive`} />
        </div>
        
        <h2 className={`${titleSize} font-semibold text-foreground mb-2`}>
          {isPageLevel ? 'Something went wrong' : 'Error loading content'}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          {formatErrorMessage(error)}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-6 p-3 bg-muted rounded text-xs">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details
            </summary>
            <pre className="whitespace-pre-wrap overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          
          {isPageLevel && (
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized error fallbacks
export function PageErrorFallback({ error, resetError }: Omit<ErrorFallbackProps, 'level'>) {
  return <DefaultErrorFallback error={error} resetError={resetError} level="page" />;
}

export function ComponentErrorFallback({ error, resetError }: Omit<ErrorFallbackProps, 'level'>) {
  return <DefaultErrorFallback error={error} resetError={resetError} level="component" />;
}

export function SectionErrorFallback({ error, resetError }: Omit<ErrorFallbackProps, 'level'>) {
  return <DefaultErrorFallback error={error} resetError={resetError} level="section" />;
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack: string }) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('useErrorHandler caught an error:', error, errorInfo);
    }
  };
}

export default ErrorBoundary;