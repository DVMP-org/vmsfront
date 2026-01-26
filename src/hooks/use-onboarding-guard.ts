"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/auth-store";
import { residentService } from "@/services/resident-service";
import { useQuery } from "@tanstack/react-query";

/**
 * Redirects resident users back to the onboarding flow when their
 * backend profile indicates onboarding is incomplete.
 */
export function useRequireResidentOnboarding(enabled: boolean = true) {
  const router = useRouter();
  const pathname = router.pathname;
  const token = useAuthStore((state) => state.token);

  const { data: resident, isLoading } = useQuery({
    queryKey: ["resident", "onboarded"],
    queryFn: async () => {
      try {
        const response = await residentService.getResident();
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404 || status === 400) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && !!token,
    retry: false,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!enabled || isLoading) return;

    console.log("resident", resident);

    const onboardingIncomplete = resident && resident.onboarded === false;
    const isOnboardingPage = pathname?.startsWith("/resident/onboarding");

    if (onboardingIncomplete && !isOnboardingPage) {
      const suffix = token ? `?token=${token}` : "";
      router.replace(`/resident/onboarding${suffix}`);
    }
  }, [enabled, isLoading, pathname, resident, router, token]);
}
