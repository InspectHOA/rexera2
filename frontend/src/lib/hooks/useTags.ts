import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

// Query keys for React Query
export const tagKeys = {
  all: ['tags'] as const,
  list: () => [...tagKeys.all, 'list'] as const,
  search: (query: string) => [...tagKeys.all, 'search', query] as const,
};

// Get all predefined tags
export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => api.tags.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes - tags don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search tags with debouncing
export function useTagSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: tagKeys.search(query),
    queryFn: () => api.tags.search(query),
    enabled: enabled && query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}