"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import type { VisitAuthorization } from "@/features/access-journey/api";
import { invitationApprovalsApi } from "@/features/invitation-approvals/api";
import { parseApiError } from "@/lib/error-utils";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";

export function ResidentialVisitors() {
  const property = useAppStore((state) => state.selectedProperty);
  const placeId = property?.id;
  const { canManagePeople } = useResidentialAccess();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const invitations = useQuery({
    queryKey: ["residential", placeId, "visitors", "all"],
    queryFn: () =>
      invitationApprovalsApi.list({
        status: "all",
        page: 1,
        pageSize: 100,
        destinationPlaceId: placeId,
      }),
    enabled: !!placeId,
    retry: false,
  });
  const pendingCount = useMemo(
    () =>
      (invitations.data?.items || []).filter(
        (invitation) => invitation.status === "requested",
      ).length,
    [invitations.data?.items],
  );

  const approve = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => invitationApprovalsApi.approve(id)));
    },
    onSuccess: async (_, ids) => {
      toast.success(
        `${ids.length} ${ids.length === 1 ? "invitation" : "invitations"} approved`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["residential", placeId, "visitors"],
      });
      setSelected(new Set());
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const filters: FilterDefinition[] = [
    {
      field: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "requested", label: "Awaiting approval" },
        { value: "approved", label: "Approved" },
        { value: "declined", label: "Declined" },
        { value: "expired", label: "Expired" },
        { value: "cancelled", label: "Cancelled" },
        { value: "revoked", label: "Revoked" },
      ],
      operator: "eq",
    },
  ];
  const columns: Column<VisitAuthorization>[] = [
    {
      key: "guest",
      header: "Visitor",
      sortable: true,
      accessor: (invitation) => (
        <div>
          <span className="block font-semibold">{guestNames(invitation)}</span>
          <span className="block font-mono text-xs text-[var(--vms-ink-muted)]">
            {invitation.code}
          </span>
        </div>
      ),
    },
    {
      key: "host_party.display_name",
      header: "Host",
      sortable: true,
      accessor: (invitation) => invitation.host_party.display_name,
    },
    {
      key: "destination_place.name",
      header: "Destination",
      sortable: true,
      accessor: (invitation) => invitation.destination_place.name,
    },
    {
      key: "valid_to",
      header: "Valid until",
      sortable: true,
      accessor: (invitation) => formatDateTime(invitation.valid_to),
    },
    {
      key: "uses",
      header: "Uses",
      sortable: true,
      accessor: (invitation) =>
        `${invitation.uses_count}${invitation.max_uses ? ` / ${invitation.max_uses}` : " / unlimited"}`,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (invitation) => (
        <Badge
          variant={
            invitation.status === "approved"
              ? "success"
              : invitation.status === "requested"
                ? "warning"
                : invitation.status === "declined" ||
                    invitation.status === "revoked"
                  ? "danger"
                  : "neutral"
          }
        >
          {invitation.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (invitation) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/invitations/${invitation.id}`}>
            Open
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Approve",
      icon: CheckCircle2,
      onClick: (ids) => approve.mutate(ids),
    },
  ];

  return (
    <ResidentialShell
      title="Visitors & access"
      description="Review visitor invitations addressed to this property and follow their access status without leaving the residential workspace."
      primaryAction={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={pendingCount ? "warning" : "success"}>
            {pendingCount} awaiting approval
          </Badge>
          <Button
            variant="secondary"
            onClick={() => invitations.refetch()}
            isLoading={invitations.isFetching}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Refresh
          </Button>
        </div>
      }
    >
      <DataTable
        data={invitations.data?.items || []}
        columns={columns}
        tableLabel="Residential visitor invitations"
        searchPlaceholder="Search visitors, hosts or codes"
        availableFilters={filters}
        selectable
        selectedRows={selected}
        onSelectionChange={setSelected}
        bulkActions={canManagePeople ? bulkActions : []}
        isLoading={invitations.isPending}
        isStale={invitations.isError && !!invitations.data}
        errorMessage={
          invitations.isError && !invitations.data
            ? parseApiError(invitations.error).message
            : null
        }
        onRetry={() => invitations.refetch()}
        emptyMessage="No visitor invitations have been created for this property."
        mobileSummary={(invitation) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{guestNames(invitation)}</p>
                <p className="font-mono text-xs text-[var(--vms-ink-muted)]">
                  {invitation.code}
                </p>
              </div>
              <Badge
                variant={
                  invitation.status === "approved"
                    ? "success"
                    : invitation.status === "requested"
                      ? "warning"
                      : "neutral"
                }
              >
                {invitation.status}
              </Badge>
            </div>
            <p className="text-sm">
              Host: {invitation.host_party.display_name}
            </p>
            <p className="text-xs text-[var(--vms-ink-muted)]">
              Valid until {formatDateTime(invitation.valid_to)}
            </p>
          </div>
        )}
      />
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
        <ShieldCheck
          className="h-5 w-5 text-[var(--vms-ink-muted)]"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-sm text-[var(--vms-ink-muted)]">
          Declines require a reason. Open an invitation for the complete guest,
          host and checkpoint history.
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/invitations">Open invitation queue</Link>
        </Button>
      </div>
    </ResidentialShell>
  );
}

function guestNames(invitation: VisitAuthorization) {
  return invitation.guests
    .map((guest) => guest.display_name_snapshot)
    .join(", ");
}
