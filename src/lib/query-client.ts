'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Retry up to 3 times for network errors, but not for 4xx errors
        if (failureCount >= 3) return false;
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          return status >= 500 || status === 408 || status === 429;
        }
        return true;
      },
    },
    mutations: {
      retry: false,
    },
  },
});