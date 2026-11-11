/** Stable tenant dimensions shared by Site queries and mutations. */
export interface SiteQueryScope {
  organizationId: string | null;
  siteId: string | null;
  userId: string | null;
}

// Organization and plugin callers may supply their own opaque namespace.
export type QueryContext = SiteQueryScope | string;

export const queryKeys = {
  scope: (
    organizationId?: string | null,
    siteId?: string | null,
    userId?: string | null,
  ): SiteQueryScope => ({
    organizationId: organizationId || null,
    siteId: siteId || null,
    userId: userId || null,
  }),
  charges: {
    all: ["charges"] as const,
    definitions: (scope: QueryContext, page: number, siteId?: string) =>
      ["charges", scope, "definitions", page, siteId] as const,
  },
  places: { all: ["places"] as const },
  relationships: { all: ["place-relationships"] as const },
  people: { all: ["site-people"] as const },
  invitations: {
    all: ["workspace", "visit-authorizations"] as const,
    list: (placeId: string, partyId: string) =>
      ["workspace", "visit-authorizations", placeId, partyId] as const,
    detail: (id: string) =>
      ["workspace", "visit-authorizations", "detail", id] as const,
    checkpoints: (id: string) =>
      ["workspace", "visit-authorizations", "checkpoints", id] as const,
    credentials: (id: string) =>
      ["workspace", "visit-authorizations", "credentials", id] as const,
  },
};
