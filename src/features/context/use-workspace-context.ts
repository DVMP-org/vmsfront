"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { storedSiteId } from "@/lib/site-context";
import { getSubdomain } from "@/lib/subdomain-utils";
import { useSearchParams } from "next/navigation";
import { contextApi } from "./api";

export function useWorkspaceContext() {
  const organization = useAppStore((state) => state.organization);
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  const user = useAuthStore((state) => state.user);
  const site = useAppStore((state) => state.selectedSite);

  const searchParams = useSearchParams();
  const urlSiteId = searchParams?.get("site_id") || searchParams?.get("site");
  const effectiveSiteId =
    urlSiteId || site?.id || storedSiteId(organization?.slug || null);
  const tenantSlug = getSubdomain();

  const query = useQuery({
    queryKey: [
      "workspace-context",
      organization?.id,
      user?.id,
      effectiveSiteId,
    ],
    queryFn: () => contextApi.workspace(effectiveSiteId),
    enabled:
      !!organization?.id &&
      !!user?.id &&
      (!tenantSlug || tenantSlug === organization.slug),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  useEffect(() => {
    const activeSite =
      query.data?.management?.selected_site ||
      query.data?.management?.authoritative_site;
    if (
      activeSite &&
      (!effectiveSiteId || activeSite.id === effectiveSiteId) &&
      (!site || site.id !== activeSite.id || site.name !== activeSite.name)
    ) {
      setSelectedSite({ id: activeSite.id, name: activeSite.name });
    }
  }, [query.data, site, effectiveSiteId, setSelectedSite]);

  return query;
}
