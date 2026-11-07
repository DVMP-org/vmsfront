import { apiClient } from "@/lib/api-client";
export type FacetKey = "parties" | "places";
export interface PartyMeta {
  kind: "person" | "organization";
  user_linked: boolean;
}
export interface PlaceMeta {
  kind: string;
  slug: string;
  parent_id: string | null;
}
export interface FacetItem {
  value: string;
  label: string;
  disabled: boolean;
  description?: string | null;
  meta: PartyMeta | PlaceMeta;
}
export interface FacetPage {
  facet: FacetKey;
  contract_version: "vmscore.facets/v1";
  items: FacetItem[];
  has_more: boolean;
  next_cursor: string | null;
  revision: string;
}
export type FacetFilters = {
  parties: {
    kind?: "person" | "organization";
    is_active?: boolean;
    place_id?: string;
    role?: string;
  };
  places: {
    kind?: string;
    is_active?: boolean;
    parent_id?: string;
    root_only?: boolean;
  };
};
export async function loadFacets<K extends FacetKey>(
  facet: K,
  options: {
    filters: FacetFilters[K];
    search?: string;
    cursor?: string | null;
    ids?: string[];
    signal?: AbortSignal;
  },
) {
  const params = new URLSearchParams({
    filters: JSON.stringify(options.filters),
    limit: "20",
  });
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.cursor) params.set("cursor", options.cursor);
  options.ids?.forEach((id) => params.append("ids", id));
  const data = await apiClient.get<FacetPage>(`/facets/${facet}?${params}`, {
    signal: options.signal,
  });
  if (data.contract_version !== "vmscore.facets/v1" || data.facet !== facet)
    throw new Error("Unsupported option contract. Refresh and try again.");
  return data;
}
