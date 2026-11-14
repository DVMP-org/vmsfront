import type { VisitAuthorization } from "@/features/access-journey/api";
import type { FilterDefinition } from "@/components/ui/DataTable";

/** One row per visitor, not per invitation. */
export interface VisitorRow {
  key: string;
  /** Hidden column the table searches: name, invitation ID and suffix. */
  search_text: string;
  guestName: string;
  visitorId: string;
  guestId: string;
  invitationId: string;
  host: string;
  destination: string;
  validTo: string;
  guestState: string;
  status: string;
}

export function buildVisitorRows(
  invitations: VisitAuthorization[],
): VisitorRow[] {
  return invitations.flatMap((invitation) =>
    invitation.guests.map((guest) => {
      const visitorId = `${invitation.code}-${guest.suffix}`;
      const status =
        guest.state === "checked_in"
          ? "checked_in"
          : (invitation.display_status ?? invitation.status);
      return {
        key: `${invitation.id}:${guest.id}`,
        search_text: [
          guest.display_name_snapshot,
          guest.email_snapshot ?? "",
          guest.phone_snapshot ?? "",
          invitation.code,
          guest.suffix,
          visitorId,
          invitation.host_party.display_name,
          invitation.destination_place.name,
        ]
          .join(" ")
          .toLowerCase(),
        guestName: guest.display_name_snapshot,
        visitorId,
        guestId: guest.id,
        invitationId: invitation.id,
        host: invitation.host_party.display_name,
        destination: invitation.destination_place.name,
        validTo: invitation.valid_to,
        guestState: guest.state,
        status,
      };
    }),
  );
}

export function visitorStatusLabel(row: Pick<VisitorRow, "status">): string {
  if (row.status === "checked_in") return "Checked in";
  if (row.status === "active") return "Active";
  if (row.status === "requested") return "Awaiting approval";
  if (row.status === "approved") return "Expected";
  return row.status.replaceAll("_", " ");
}

export function visitorStatusVariant(
  status: string,
): "info" | "success" | "warning" | "danger" | "neutral" {
  if (status === "checked_in" || status === "active") return "info";
  if (status === "approved") return "success";
  if (status === "requested") return "warning";
  if (status === "declined" || status === "revoked" || status === "expired") {
    return "danger";
  }
  return "neutral";
}

export const visitorFilters: FilterDefinition[] = [
  {
    field: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "checked_in", label: "Checked in" },
      { value: "active", label: "Active" },
      { value: "requested", label: "Awaiting approval" },
      { value: "approved", label: "Expected" },
      { value: "declined", label: "Declined" },
      { value: "expired", label: "Expired" },
      { value: "cancelled", label: "Cancelled" },
      { value: "revoked", label: "Revoked" },
    ],
    operator: "eq",
  },
];
