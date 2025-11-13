"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/service-worker.js");
        } catch (error) {
          console.error("Service worker registration failed", error);
        }
      };
      register();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
