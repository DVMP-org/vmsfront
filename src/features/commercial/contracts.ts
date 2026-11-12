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

export const commercialUnitTypes = [
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "retail_unit", label: "Retail unit" },
  { value: "warehouse", label: "Warehouse" },
  { value: "conference_room", label: "Conference room" },
] as const;

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
