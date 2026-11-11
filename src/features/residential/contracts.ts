export type ResidentialSection =
  | "overview"
  | "units"
  | "occupancies"
  | "finance"
  | "access"
  | "maintenance"
  | "announcements";

export type AnnouncementAudience =
  | "all_residents"
  | "owners"
  | "tenants"
  | "staff";

export const announcementPriorities = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;

export type AnnouncementPriority = (typeof announcementPriorities)[number];

export interface Announcement {
  id: string;
  created_by_site_admin_id: string | null;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
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
  priority: AnnouncementPriority;
  is_pinned: boolean;
  expires_at?: string | null;
}

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
