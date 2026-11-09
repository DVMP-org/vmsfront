"use client";

import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export function useHospitalityAccess() {
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const user = useAuthStore((state) => state.user);
  const access = useSiteAccess();
  const contextKey = access.contextKey;
  const profile = access.workspace;

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
      access.allowed(`hospitality_stays.${action}`),
  };
}
