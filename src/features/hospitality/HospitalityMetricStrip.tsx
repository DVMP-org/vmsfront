import { BedDouble, CalendarClock, UserRound, Users } from "lucide-react";
import type { WorkspaceRelationship } from "@/types";
import { MetricStrip } from "@/features/dashboard/MetricStrip";

const occupancyRoles = new Set([
  "resident",
  "resident_of",
  "owner",
  "tenant",
  "member",
  "member_of",
]);
const staffAndGuestRoles = new Set([
  "employee",
  "staff",
  "hotel_staff",
  "operator",
  "manager",
  "guest",
  "guest_of",
]);

export function HospitalityMetricStrip({
  relationships,
  reservedCount,
  checkedInCount,
  peopleLoading,
  peopleError,
  staysLoading,
  staysError,
  checkedInLoading,
  checkedInError,
}: {
  relationships: WorkspaceRelationship[];
  reservedCount: number;
  checkedInCount: number;
  peopleLoading: boolean;
  peopleError: boolean;
  staysLoading: boolean;
  staysError: boolean;
  checkedInLoading: boolean;
  checkedInError: boolean;
}) {
  const peopleState = peopleLoading
    ? "loading"
    : peopleError
      ? "error"
      : "ready";
  return (
    <MetricStrip
      label="Hospitality operating summary"
      metrics={[
        {
          icon: CalendarClock,
          label: "Reserved stays",
          value: reservedCount,
          detail: "Awaiting arrival review at this Site",
          href: "#stays",
          state: staysLoading ? "loading" : staysError ? "error" : "ready",
        },
        {
          icon: BedDouble,
          label: "Checked in",
          value: checkedInCount,
          detail: "Active guest stays at this Site",
          href: "#stays",
          state: checkedInLoading
            ? "loading"
            : checkedInError
              ? "error"
              : "ready",
        },
        {
          icon: UserRound,
          label: "Occupants",
          value: relationships.filter((row) =>
            occupancyRoles.has(row.role.toLowerCase()),
          ).length,
          detail: "Occupant relationships in loaded Site results",
          state: peopleState,
        },
        {
          icon: Users,
          label: "Staff & guests",
          value: relationships.filter((row) =>
            staffAndGuestRoles.has(row.role.toLowerCase()),
          ).length,
          detail: "Staff and guest relationships in loaded results",
          state: peopleState,
        },
      ]}
    />
  );
}
