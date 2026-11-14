"use client";

import { useQuery } from "@tanstack/react-query";

import { maintenanceApi } from "@/features/maintenance/api";
import { contractorsApi } from "@/features/contractors/api";

import { commercialApi } from "./api";

/**
 * Commercial overview data. Every screen in this feature reads through here so
 * the maintenance summary and the maintenance page share one source: the
 * generic `/admin/maintenance` table, filtered by `domain=commercial`.
 */
export const commercialKeys = {
  tree: (contextKey: string) => ["commercial", contextKey, "tree"] as const,
  relationships: (contextKey: string) =>
    ["commercial", contextKey, "relationships"] as const,
  /** Every relationship, live or ended: inventory shows who occupies a space. */
  inventoryRelationships: (contextKey: string) =>
    ["commercial", contextKey, "relationships", "all"] as const,
  assignments: (contextKey: string) =>
    ["commercial", contextKey, "charges"] as const,
  maintenance: (contextKey: string) =>
    ["commercial", contextKey, "maintenance"] as const,
  contractors: (siteId?: string | null) =>
    ["commercial", siteId ?? "no-site", "contractors"] as const,
};

export function useCommercialTree(contextKey: string, enabled: boolean) {
  return useQuery({
    queryKey: commercialKeys.tree(contextKey),
    queryFn: commercialApi.tree,
    enabled,
  });
}

export function useCommercialRelationships(
  contextKey: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: commercialKeys.relationships(contextKey),
    queryFn: () => commercialApi.relationships({ status: "active" }),
    enabled,
  });
}

export function useCommercialInventoryRelationships(
  contextKey: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: commercialKeys.inventoryRelationships(contextKey),
    queryFn: () => commercialApi.relationships(),
    enabled,
  });
}

export function useCommercialChargeAssignments(
  contextKey: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: commercialKeys.assignments(contextKey),
    queryFn: commercialApi.chargeAssignments,
    enabled,
  });
}

export function useCommercialMaintenance(contextKey: string, enabled: boolean) {
  return useQuery({
    queryKey: commercialKeys.maintenance(contextKey),
    queryFn: () => maintenanceApi.list({ domain: "commercial", page_size: 100 }),
    enabled,
    retry: false,
  });
}

export function useCommercialContractors(
  contextKey: string,
  siteId?: string | null,
) {
  return useQuery({
    queryKey: commercialKeys.contractors(siteId),
    queryFn: () => contractorsApi.list(),
    enabled: Boolean(siteId),
    retry: false,
  });
}
