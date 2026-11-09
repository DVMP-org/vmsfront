"use client";

import { useQuery } from "@tanstack/react-query";

import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export function useHospitalityAccess() {
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const user = useAuthStore((state) => state.user);
  const contextKey = `${organization?.id}:${user?.id}`;
  const profile = useQuery({
    queryKey: ["hospitality-profile", contextKey],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: !!organization?.id && !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    organization,
    selectedProperty,
    user,
    contextKey,
    profile,
    isLoading:
      !organization?.id ||
      !user?.id ||
      profile.isPending ||
      !profile.isFetchedAfterMount,
    allowed: (action: string) =>
      profile.isFetchedAfterMount &&
      !profile.isError &&
      hasAdminPermission(profile.data, `hospitality_stays.${action}`),
  };
}
