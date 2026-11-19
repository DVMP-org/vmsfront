export type StayStatus =
  "reserved" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export interface Stay {
  id: string;
  site_id: string;
  status: StayStatus;
  planned_check_in: string;
  planned_check_out: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  notes: string | null;
  guests: {
    id: string;
    role: string;
    party: {
      id: string;
      display_name: string;
      email?: string | null;
      is_active?: boolean;
    };
  }[];
  room_assignments: {
    id: string;
    assigned_from: string;
    assigned_to: string | null;
    room: { id: string; name: string };
  }[];
}
export interface GuestSummary {
  party_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  stays_count: number;
  stay_id: string | null;
  stay_status: StayStatus | null;
  planned_check_in: string | null;
  planned_check_out: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
}

export interface GuestDetail extends GuestSummary {
  stays: Stay[];
}

/** Where a guest's onboarding magic link was delivered. */
export interface GuestOnboardingReceipt {
  sent: boolean;
  email: string;
}

export type RoomOperationalStatus =
  "available" | "reserved" | "occupied" | "cleaning" | "out_of_service";
export type HousekeepingStatus =
  "clean" | "dirty" | "in_progress" | "inspected";
export interface HospitalityRoom {
  id: string;
  name: string;
  room_number: string;
  room_type: string;
  /** The Place group this room is sold as, when one has been chosen. */
  place_group_id: string | null;
  place_group_name: string | null;
  floor: string | null;
  capacity: number;
  base_rate: string;
  currency: string;
  /** Catalogue codes; the vocabulary lives on the server. */
  amenities: string[];
  status: RoomOperationalStatus;
  housekeeping_status: HousekeepingStatus;
  current_stay_id: string | null;
  current_guest_name: string | null;
  next_arrival: string | null;
  next_guest_name: string | null;
  maintenance_open: number;
  updated_at: string;
}
export interface AvailabilityCell {
  date: string;
  status: "available" | "reserved" | "occupied" | "blocked";
  stay_id: string | null;
  guest_name: string | null;
}
export interface RoomAvailability {
  room: HospitalityRoom;
  days: AvailabilityCell[];
}
export interface HousekeepingTask {
  id: string;
  room_id: string;
  room_name: string;
  status: HousekeepingStatus;
  priority: "normal" | "high" | "urgent";
  assigned_to: string | null;
  notes: string | null;
  due_at: string | null;
  updated_at: string;
}
export interface HousekeepingEvent {
  id: string;
  event_type:
  | "housekeeping_updated"
  | "stay_checked_in"
  | "stay_checked_out"
  | "imported_snapshot";
  from_status: HousekeepingStatus | null;
  to_status: HousekeepingStatus | null;
  from_operational_status: RoomOperationalStatus | null;
  to_operational_status: RoomOperationalStatus | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  previous_assigned_to: string | null;
  previous_assigned_to_name: string | null;
  priority: "normal" | "high" | "urgent" | null;
  previous_priority: "normal" | "high" | "urgent" | null;
  notes: string | null;
  due_at: string | null;
  actor_name: string | null;
  /** Who made the change: the desk or the guest occupying the room. */
  actor_type: "admin" | "guest" | null;
  created_at: string;
}
export interface HousekeepingRoomDetail {
  room: HospitalityRoom;
  task: HousekeepingTask;
  history: HousekeepingEvent[];
}
export interface GuestFolioLine {
  id: string;
  description: string;
  category: "room" | "service" | "charge" | "payment";
  amount: string;
  currency: string;
  created_at: string;
}
export interface GuestFolio {
  id: string;
  stay_id: string;
  guest_name: string;
  status: "open" | "settled" | "void";
  currency: string;
  total: string;
  paid: string;
  balance: string;
  lines: GuestFolioLine[];
}

export type GuestHousekeepingRequest = "clean" | "dirty";

/** The guest's own room housekeeping state. */
export interface GuestRoomHousekeeping {
  stay_id: string;
  room_id: string;
  room_name: string;
  status: HousekeepingStatus;
  updated_at: string;
}
export interface HospitalityMaintenanceRequest {
  id: string;
  room_id: string | null;
  room_name: string | null;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
  reported_by: string;
  created_at: string;
  updated_at: string;
}
export const statusLabel = (status: string) =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
export const roomStatusLabel = (status: RoomOperationalStatus) =>
  status.replaceAll("_", " ");
export function localInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function interval(start: string, end: string) {
  const first = new Date(start);
  const last = new Date(end);
  if (
    !start ||
    !end ||
    !Number.isFinite(first.getTime()) ||
    !Number.isFinite(last.getTime()) ||
    last <= first
  )
    throw new Error("Departure must be after arrival.");
  return {
    planned_check_in: first.toISOString(),
    planned_check_out: last.toISOString(),
  };
}
export const guestName = (stay: Stay) =>
  stay.guests.find((g) => g.role === "primary")?.party.display_name ||
  stay.guests[0]?.party.display_name ||
  "Guest";
