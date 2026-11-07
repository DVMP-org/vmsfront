export type PlaceKind = "site" | "building" | "unit" | "room" | "space";

export interface Place {
  id: string;
  organizationId: string;
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
