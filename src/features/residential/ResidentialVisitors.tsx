"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import type { VisitAuthorization } from "@/features/access-journey/api";
import { invitationApprovalsApi } from "@/features/invitation-approvals/api";
import { VisitorDetailDrawer } from "@/features/invitation-approvals/VisitorDetailDrawer";
import { parseApiError } from "@/lib/error-utils";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { ResidentialShell } from "./ResidentialShell";

/** One row per visitor, not per invitation. */
interface VisitorRow {
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

export function ResidentialVisitors() {
  const site = useAppStore((state) => state.selectedSite);
  const siteId = site?.id;
  const [active, setActive] = useState<{
    invitationId: string;
    guestId: string;
  } | null>(null);
  const invitations = useQuery({
    queryKey: ["residential", siteId, "visitors", "all"],
    queryFn: () =>
      invitationApprovalsApi.list({
        status: "all",
        page: 1,
        pageSize: 100,
        site_id: siteId,
      }),
    enabled: !!siteId,
    retry: false,
  });

  const rows = useMemo(
    () => buildVisitorRows(invitations.data?.items ?? []),
    [invitations.data?.items],
  );

  const filters: FilterDefinition[] = [
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
  const columns: Column<VisitorRow>[] = [
    {
      key: "guestName",
      header: "Visitor",
      sortable: true,
      accessor: (row) => (
        <div>
          <span className="block font-semibold">{row.guestName}</span>
          <span className="block font-mono text-xs text-[var(--vms-ink-muted)]">
            {row.visitorId}
          </span>
        </div>
      ),
    },
    {
      key: "search_text",
      header: "Search",
      hiddenByDefault: true,
    },
    {
      key: "host",
      header: "Host",
      sortable: true,
    },
    {
      key: "destination",
      header: "Destination",
      sortable: true,
    },
    {
      key: "validTo",
      header: "Valid until",
      sortable: true,
      accessor: (row) => formatDateTime(row.validTo),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <Badge variant={statusVariant(row.status)}>{statusLabel(row)}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setActive({ invitationId: row.invitationId, guestId: row.guestId })
          }
        >
          Open
          <Eye className="h-3.5 w-3.5" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <ResidentialShell
      title="Visitors & access"
      description="Every visitor at this property, one row each. Search by their invitation ID or suffix, then open the visitor to follow their journey and scans."
    >
      <DataTable
        data={rows}
        columns={columns}
        tableLabel="Residential visitor register"
        searchPlaceholder="Search by name, invitation ID or suffix"
        availableFilters={filters}
        isLoading={invitations.isPending}
        isStale={invitations.isError && !!invitations.data}
        errorMessage={
          invitations.isError && !invitations.data
            ? parseApiError(invitations.error).message
            : null
        }
        onRetry={() => invitations.refetch()}
        emptyMessage="No visitors have been invited to this property."
        mobileSummary={(row) => (
          <button
            type="button"
            className="w-full space-y-2 text-left"
            onClick={() =>
              setActive({
                invitationId: row.invitationId,
                guestId: row.guestId,
              })
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.guestName}</p>
                <p className="font-mono text-xs text-[var(--vms-ink-muted)]">
                  {row.visitorId}
                </p>
              </div>
              <Badge variant={statusVariant(row.status)}>
                {statusLabel(row)}
              </Badge>
            </div>
            <p className="text-sm">Host: {row.host}</p>
            <p className="text-xs text-[var(--vms-ink-muted)]">
              Valid until {formatDateTime(row.validTo)}
            </p>
          </button>
        )}
      />

      <VisitorDetailDrawer
        invitationId={active?.invitationId ?? null}
        focusGuestId={active?.guestId ?? null}
        onClose={() => setActive(null)}
      />
    </ResidentialShell>
  );
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

function statusLabel(row: VisitorRow) {
  if (row.status === "checked_in") return "Checked in";
  if (row.status === "active") return "Active";
  if (row.status === "requested") return "Awaiting approval";
  if (row.status === "approved") return "Expected";
  return row.status.replaceAll("_", " ");
}

function statusVariant(status: string) {
  if (status === "checked_in" || status === "active") return "info" as const;
  if (status === "approved") return "success" as const;
  if (status === "requested") return "warning" as const;
  if (status === "declined" || status === "revoked" || status === "expired") {
    return "danger" as const;
  }
  return "neutral" as const;
}
