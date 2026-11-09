export type ResidentialSection =
  | "overview"
  | "units"
  | "occupancies"
  | "finance"
  | "access"
  | "maintenance"
  | "announcements";

export type MaintenancePriority = "low" | "normal" | "high" | "urgent";
export type MaintenanceStatus =
  | "open"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export interface MaintenanceRequest {
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

export interface MaintenanceInput {
  place_id: string;
  reported_by_party_id?: string | null;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  due_at?: string | null;
}

export type AnnouncementAudience =
  | "all_residents"
  | "owners"
  | "tenants"
  | "staff";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  is_pinned: boolean;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  is_pinned: boolean;
  expires_at?: string | null;
}

export const maintenanceStatuses: MaintenanceStatus[] = [
  "open",
  "triaged",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

export const maintenancePriorities: MaintenancePriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export const occupancyRoles = [
  "resident",
  "owner",
  "tenant",
  "household_member",
] as const;

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
