export type PlaceKind = "building" | "unit" | "room" | "space";

export interface Site {
  id: string;
  organizationId: string;
  parentSiteId: string | null;
  name: string;
  slug: string;
  useCase: "residential" | "commercial" | "mixed_use" | "hospitality" | null;
  description: string | null;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: string;
  organizationId: string;
  siteId: string;
  parentId: string | null;
  name: string;
  slug: string;
  kind: PlaceKind;
  description: string | null;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
