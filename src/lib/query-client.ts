import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // Increased to 30 minutes
      refetchOnMount: "always", // Explicitly set to 'always' if we want it to fetch even if not stale, but usually we don't.
      // Actually, 'true' is better (only fetch if stale).
      refetchOnReconnect: true,
    },

    mutations: {
      retry: false,
    },
  },
});

