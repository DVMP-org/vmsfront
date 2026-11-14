"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { invitationApprovalsApi } from "@/features/invitation-approvals/api";
import { VisitorDetailDrawer } from "@/features/invitation-approvals/VisitorDetailDrawer";
import { parseApiError } from "@/lib/error-utils";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

import {
  buildVisitorRows,
  visitorFilters,
  visitorStatusLabel,
  visitorStatusVariant,
  type VisitorRow,
} from "./lib";

/**
 * Every visitor at the selected property, one row each.
 *
 * Visitors are a Site concern, not a residential one: a commercial tenant
 * receives guests at its suite and a hotel receives them at a room, so all four
 * domains mount this same register inside their own shell. Opening a row shows
 * that visitor's journey and scans.
 */
export function VisitorsRegister({
  siteId: siteIdOverride,
  tableLabel = "Visitor register",
}: {
  /** Defaults to the Site chosen in the header picker. */
  siteId?: string | null;
  tableLabel?: string;
}) {
  const storedSite = useAppStore((state) => state.selectedSite);
  const siteId = siteIdOverride ?? storedSite?.id;
  const [active, setActive] = useState<{
    invitationId: string;
    guestId: string;
  } | null>(null);

  const invitations = useQuery({
    queryKey: ["visitors", siteId ?? "no-site", "all"],
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
    { key: "host", header: "Host", sortable: true },
    { key: "destination", header: "Destination", sortable: true },
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
        <Badge variant={visitorStatusVariant(row.status)}>
          {visitorStatusLabel(row)}
        </Badge>
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
    <>
      <DataTable
        data={rows}
        columns={columns}
        tableLabel={tableLabel}
        searchPlaceholder="Search by name, invitation ID or suffix"
        availableFilters={visitorFilters}
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
              setActive({ invitationId: row.invitationId, guestId: row.guestId })
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.guestName}</p>
                <p className="font-mono text-xs text-[var(--vms-ink-muted)]">
                  {row.visitorId}
                </p>
              </div>
              <Badge variant={visitorStatusVariant(row.status)}>
                {visitorStatusLabel(row)}
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
    </>
  );
}
