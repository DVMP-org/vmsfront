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

  // The server resolved this hint to a Site; that answer is authoritative for
  // ``selectedSite``. Without this, a stale or Place-shaped hint (an old
  // cookie, a shared link) left the store empty and the next Site-scoped
  // request reached the plugin guard without a Site.
  //
  // Only primitives are listed as dependencies: the effect array must keep a
  // constant shape across renders (a hook hot-replaced while mounted otherwise
  // trips "The final argument passed to useEffect changed size").
  const resolvedSiteId =
    query.data?.management?.selected_site?.id ??
    query.data?.management?.authoritative_site?.id ??
    null;
  const resolvedSiteName =
    query.data?.management?.selected_site?.name ??
    query.data?.management?.authoritative_site?.name ??
    null;
  const selectedSiteId = site?.id ?? null;
  const selectedSiteName = site?.name ?? null;

  useEffect(() => {
    if (!resolvedSiteId) return;
    if (selectedSiteId === resolvedSiteId && selectedSiteName === resolvedSiteName) {
      return;
    }
    setSelectedSite({ id: resolvedSiteId, name: resolvedSiteName ?? "" });
  }, [
    resolvedSiteId,
    resolvedSiteName,
    selectedSiteId,
    selectedSiteName,
    setSelectedSite,
  ]);

  return query;
}
