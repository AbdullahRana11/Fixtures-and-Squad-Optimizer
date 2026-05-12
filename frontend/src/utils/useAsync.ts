// frontend/src/hooks/useAsync.ts
// ============================================================
// Enhanced useAsync Hook for Better UX
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncState<T, E = Error> {
  status: AsyncStatus;
  data: T | null;
  error: E | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

/**
 * Custom hook for managing async operations with loading/error states
 * Handles cleanup on unmount and prevents updates on unmounted components
 */
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { immediate = false, onSuccess, onError, onFinally } = options;

  const [state, setState] = useState<UseAsyncState<T, E>>({
    status: 'idle',
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((prev) => ({
      ...prev,
      status: 'pending',
      isLoading: true,
      isError: false,
      isSuccess: false,
    }));

    try {
      const response = await asyncFunction();

      if (!isMountedRef.current) return;

      setState({
        status: 'success',
        data: response,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
      });

      onSuccess?.(response);
      onFinally?.();
      return response;
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));

      setState({
        status: 'error',
        data: null,
        error: error as E,
        isLoading: false,
        isError: true,
        isSuccess: false,
      });

      onError?.(error);
      onFinally?.();
      throw error;
    }
  }, [asyncFunction, onSuccess, onError, onFinally]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset: () =>
      setState({
        status: 'idle',
        data: null,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
      }),
  };
}

/**
 * Hook for managing multiple async operations with loading states
 */
export function useAsyncMultiple<T extends Record<string, Promise<any>>>(
  asyncFunctions: { [K in keyof T]: () => T[K] }
) {
  const [states, setStates] = useState<
    Record<keyof T, UseAsyncState<Awaited<T[keyof T]>>>
  >(
    Object.fromEntries(
      Object.keys(asyncFunctions).map((key) => [
        key,
        { status: 'idle', data: null, error: null, isLoading: false, isError: false, isSuccess: false },
      ])
    ) as any
  );

  const executeAll = useCallback(async () => {
    const promises = Object.entries(asyncFunctions).map(([key, fn]) =>
      fn()
        .then((data: any) => ({ key, status: 'success', data, error: null }))
        .catch((error: any) => ({ key, status: 'error', data: null, error }))
    );

    const results = await Promise.all(promises);

    setStates((prev) =>
      Object.fromEntries(
        results.map(({ key, status, data, error }) => [
          key,
          {
            status,
            data,
            error,
            isLoading: false,
            isError: status === 'error',
            isSuccess: status === 'success',
          },
        ])
      ) as any
    );
  }, [asyncFunctions]);

  const isAnyLoading = Object.values(states).some((s) => s.isLoading);

  return {
    states,
    executeAll,
    isAnyLoading,
  };
}

/**
 * Hook for debounced async operations (e.g., search)
 */
export function useDebouncedAsync<T, E = Error>(
  asyncFunction: (query: string) => Promise<T>,
  delayMs = 500,
  options: UseAsyncOptions<T> = {}
) {
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { execute, ...rest } = useAsync(() => asyncFunction(query), {
    immediate: false,
    ...options,
  });

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        execute();
      }, delayMs);
    },
    [execute, delayMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    execute,
    ...rest,
  };
}
