import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // Increased to 30 minutes
      refetchOnMount: true,
      refetchOnReconnect: true,
    },

    mutations: {
      retry: false,
    },
  },
});

