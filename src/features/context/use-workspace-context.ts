"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorStatus } from "@/lib/error-utils";
import { contextApi } from "./api";

export function useWorkspaceContext() {
  const organization = useAppStore((state) => state.organization);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const user = useAuthStore((state) => state.user);
  const property = useAppStore((state) => state.selectedProperty);
  const query = useQuery({
    queryKey: ["workspace-context", organization?.id, user?.id, property?.id],
    queryFn: () => contextApi.workspace(property?.id),
    enabled: !!organization?.id && !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  useEffect(() => {
    const status = getApiErrorStatus(query.error);
    if (property && (status === 403 || status === 404)) {
      setSelectedProperty(null);
    }
  }, [property, query.error, setSelectedProperty]);

  return query;
}
