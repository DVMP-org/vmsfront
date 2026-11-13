export type CommercialSection =
  | "overview"
  | "inventory"
  | "tenants"
  | "finance"
  | "access"
  | "maintenance";

export type MaintenancePriority = "low" | "normal" | "high" | "urgent";
export type MaintenanceStatus =
  | "open"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export interface CommercialMaintenanceRequest {
  id: string;
  place_id: string;
  place: { id: string; name: string };
  reported_by_party_id: string | null;
  reported_by: { id: string; display_name: string } | null;
  assigned_to_party_id: string | null;
  assigned_to: { id: string; display_name: string } | null;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CommercialMaintenanceInput {
  place_id: string;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  due_at?: string | null;
}

export type CommercialStructuralKind = "building" | "unit" | "space";

export interface CommercialSpaceType {
  value: string;
  label: string;
  /** Structure the type is stored as. Only buildings may contain Places. */
  kind: CommercialStructuralKind;
}

/**
 * One list for the inventory form: a building is created exactly like a space,
 * it is just the structural kind that can hold other Places.
 */
export const commercialSpaceTypes: CommercialSpaceType[] = [
  { value: "building", label: "Building", kind: "building" },
  { value: "office", label: "Office", kind: "unit" },
  { value: "shop", label: "Shop", kind: "unit" },
  { value: "retail_unit", label: "Retail unit", kind: "unit" },
  { value: "warehouse", label: "Warehouse", kind: "unit" },
  { value: "conference_room", label: "Conference room", kind: "space" },
];

/** Lettable types only; used for filters and labels. */
export const commercialUnitTypes = commercialSpaceTypes.filter(
  (type) => type.kind !== "building",
);

export function commercialSpaceKind(typeValue: string): CommercialStructuralKind {
  return (
    commercialSpaceTypes.find((type) => type.value === typeValue)?.kind ?? "unit"
  );
}

export function commercialSpaceTypeLabel(value: string | null | undefined) {
  if (!value) return "Unspecified";
  return (
    commercialSpaceTypes.find((type) => type.value === value)?.label ??
    titleCase(value)
  );
}

export const tenantRoles = ["tenant", "member", "employee"] as const;
export const accessRoles = ["employee"] as const;
export const maintenancePriorities: MaintenancePriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];
export const maintenanceStatuses: MaintenanceStatus[] = [
  "open",
  "triaged",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
