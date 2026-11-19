import { CalendarClock, ShieldCheck, UserRound, Users } from "lucide-react";
import type { WorkspaceRelationship } from "@/types";
import { MetricStrip } from "@/features/dashboard/MetricStrip";

const occupancyRoles = new Set([
  "resident", "resident_of", "owner", "tenant", "member", "member_of",
]);
const staffAndGuestRoles = new Set([
  "employee", "staff", "hotel_staff", "operator", "manager", "guest", "guest_of",
]);

export function HospitalityMetricStrip({
  administratorCount,
  relationships,
  reservedCount,
  peopleLoading,
  peopleError,
  administratorsLoading,
  administratorsError,
  staysLoading,
  staysError,
}: {
  administratorCount: number;
  relationships: WorkspaceRelationship[];
  reservedCount: number;
  peopleLoading: boolean;
  peopleError: boolean;
  administratorsLoading: boolean;
  administratorsError: boolean;
  staysLoading: boolean;
  staysError: boolean;
}) {
  const peopleState = peopleLoading ? "loading" : peopleError ? "error" : "ready";
  const administratorState = administratorsLoading
    ? "loading"
    : administratorsError
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
          detail: "Reserved stays at the selected Site",
          state: staysLoading ? "loading" : staysError ? "error" : "ready",
        },
        {
          icon: UserRound,
          label: "Occupants",
          value: relationships.filter((row) => occupancyRoles.has(row.role.toLowerCase())).length,
          detail: "Occupant relationships in loaded Site results",
          state: peopleState,
        },
        {
          icon: Users,
          label: "Staff & guests",
          value: relationships.filter((row) => staffAndGuestRoles.has(row.role.toLowerCase())).length,
          detail: "Staff and guest relationships in loaded results",
          state: peopleState,
        },
        {
          icon: ShieldCheck,
          label: "Administrators",
          value: administratorCount,
          detail: "Administrators for the selected Site",
          state: administratorState,
        },
      ]}
    />
  );
}
