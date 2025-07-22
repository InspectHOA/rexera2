/**
 * Comprehensive error handling hook for consistent error management
 */

import { useState, useCallback } from 'react';
import { formatErrorMessage } from '@/lib/utils/formatting';

export interface ErrorState {
  error: string | null;
  hasError: boolean;
  isLoading: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: unknown) => void;
}

export function useErrorHandling(options: ErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    isLoading: false,
  });

  const {
    showToast = false,
    logError = true,
    fallbackMessage = 'An unexpected error occurred',
    onError,
  } = options;

  const setError = useCallback((error: unknown) => {
    const errorMessage = formatErrorMessage(error) || fallbackMessage;
    
    setErrorState({
      error: errorMessage,
      hasError: true,
      isLoading: false,
    });

    if (logError) {
      console.error('Error caught by useErrorHandling:', error);
    }

    onError?.(error);
  }, [logError, fallbackMessage, onError]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      isLoading: false,
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: loading,
      ...(loading ? { error: null, hasError: false } : {}),
    }));
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<ErrorHandlerOptions>
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };
    
    try {
      setLoading(true);
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      const errorMessage = formatErrorMessage(error) || mergedOptions.fallbackMessage || fallbackMessage;
      
      setErrorState({
        error: errorMessage,
        hasError: true,
        isLoading: false,
      });

      if (mergedOptions.logError !== false) {
        console.error('Error in executeWithErrorHandling:', error);
      }

      mergedOptions.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, fallbackMessage, setLoading, clearError]);

  return {
    ...errorState,
    setError,
    clearError,
    setLoading,
    executeWithErrorHandling,
  };
}

// Specialized error handlers for common scenarios
export function useApiErrorHandling() {
  return useErrorHandling({
    fallbackMessage: 'Failed to communicate with the server',
    logError: true,
  });
}

export function useFormErrorHandling() {
  return useErrorHandling({
    fallbackMessage: 'Please check your input and try again',
    logError: false,
  });
}

export function useDataLoadingErrorHandling() {
  return useErrorHandling({
    fallbackMessage: 'Failed to load data',
    logError: true,
  });
}