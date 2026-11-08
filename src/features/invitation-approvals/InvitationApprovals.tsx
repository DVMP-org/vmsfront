"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  VisitAuthorization,
  VisitAuthorizationStatus,
} from "@/features/access-journey/api";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { adminService } from "@/services/admin-service";
import { invitationApprovalsApi, type ApprovalFilter } from "./api";

const PAGE_SIZE = 25;
const statusFilters: Array<{ value: ApprovalFilter; label: string }> = [
  { value: "requested", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All invitations" },
];

function validStatus(value: string | null): ApprovalFilter {
  return statusFilters.some((item) => item.value === value)
    ? (value as ApprovalFilter)
    : "requested";
}

function validPage(value: string | null) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function InvitationApprovals() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const queryString = searchParams?.toString() || "";
  const initial = useMemo(
    () => new URLSearchParams(queryString),
    [queryString],
  );
  const status = validStatus(initial.get("status"));
  const page = validPage(initial.get("page"));
  const search = (initial.get("search") || "").slice(0, 100);

  const profile = useQuery({
    queryKey: ["invitation-approvals-profile"],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    retry: false,
    staleTime: 0,
  });
  const allowed = (permission: string) =>
    profile.isFetchedAfterMount &&
    !profile.isError &&
    hasAdminPermission(profile.data, `visit_authorizations.${permission}`);
  const canList = allowed("list");
  const canApprove = allowed("approve");

  const invitations = useQuery({
    queryKey: ["admin-invitation-approvals", status, page, search],
    queryFn: () =>
      invitationApprovalsApi.list({
        status,
        page,
        pageSize: PAGE_SIZE,
        search,
      }),
    enabled: canList,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const pending = useQuery({
    queryKey: ["admin-invitation-approvals", "pending-count"],
    queryFn: () =>
      invitationApprovalsApi.list({
        status: "requested",
        page: 1,
        pageSize: 1,
      }),
    enabled: canList,
    retry: false,
  });

  function updateQuery(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(queryString);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === 1)
        params.delete(key);
      else params.set(key, String(value));
    });
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  if (
    profile.isPending ||
    (profile.isFetched && !profile.isFetchedAfterMount)
  ) {
    return <InvitationQueueSkeleton title="Checking invitation permissions" />;
  }
  if (profile.isError) {
    return (
      <QueueError
        title="Invitation permissions are unavailable"
        error={profile.error}
        retry={() => profile.refetch()}
      />
    );
  }
  if (!canList) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Invitation access is restricted"
        description="You do not have permission to review visitor invitations for this property."
      />
    );
  }

  const items = invitations.data?.items || [];
  const activeLabel =
    statusFilters.find((item) => item.value === status)?.label || "Invitations";
  const columns: Column<VisitAuthorization>[] = [
    {
      key: "guest",
      header: "Guest",
      sortable: true,
      accessor: (invitation) => (
        <div className="min-w-0">
          <Link
            href={`/admin/invitations/${invitation.id}`}
            className="block truncate font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            {guestNames(invitation)}
          </Link>
          <span className="mt-0.5 block font-mono text-[11px] text-[var(--vms-ink-muted)]">
            {invitation.code}
          </span>
        </div>
      ),
    },
    {
      key: "host_party",
      header: "Host / place",
      sortable: true,
      accessor: (invitation) => (
        <div className="text-[var(--vms-ink-muted)]">
          <span className="block text-[var(--vms-ink)]">
            {invitation.host_party.display_name}
          </span>
          <span className="block text-xs">
            {invitation.destination_place.name}
          </span>
        </div>
      ),
    },
    {
      key: "valid_from",
      header: "Validity",
      sortable: true,
      accessor: (invitation) => <Validity invitation={invitation} />,
    },
    {
      key: "uses_count",
      header: "Uses",
      sortable: true,
      accessor: (invitation) => (
        <span className="whitespace-nowrap tabular-nums text-[var(--vms-ink-muted)]">
          {invitation.uses_count}
          {invitation.max_uses ? ` / ${invitation.max_uses}` : " / unlimited"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (invitation) => <StatusBadge status={invitation.status} />,
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (invitation) => (
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/admin/invitations/${invitation.id}`}
            aria-label={`Open invitation for ${guestNames(invitation)}`}
          >
            Open
          </Link>
        </Button>
      ),
    },
  ];

  const approveSelected = async (ids: string[]) => {
    const eligible = items.filter(
      (invitation) =>
        ids.includes(invitation.id) && invitation.status === "requested",
    );
    if (!eligible.length) {
      toast.info("Only invitations awaiting approval can be approved.");
      return;
    }
    const results = await Promise.allSettled(
      eligible.map((invitation) =>
        invitationApprovalsApi.approve(invitation.id),
      ),
    );
    const approved = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    await queryClient.invalidateQueries({
      queryKey: ["admin-invitation-approvals"],
    });
    if (approved === eligible.length) {
      toast.success(
        `${approved} invitation${approved === 1 ? "" : "s"} approved.`,
      );
    } else {
      toast.error(
        `${approved} of ${eligible.length} invitations were approved. Retry the remaining records.`,
      );
    }
  };

  const bulkActions: BulkAction[] = canApprove
    ? [
        {
          label: "Approve selected",
          onClick: approveSelected,
          requiresConfirmation: true,
          confirmationMessage:
            "Approve the selected invitations that are awaiting approval?",
        },
      ]
    : [];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Access / Invitations"
        title="Visitor invitations"
        description="Review invitations against host, destination, validity and prior checkpoint history before deciding access."
        metadata={
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--vms-ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              <strong className="font-semibold tabular-nums text-[var(--vms-ink)]">
                {pending.data?.total ?? "—"}
              </strong>
              awaiting approval
            </span>
            <span aria-hidden="true">·</span>
            <span>Canonical visit authorizations</span>
          </div>
        }
        secondaryActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => invitations.refetch()}
            isLoading={invitations.isFetching}
            loadingLabel="Refreshing"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <nav
        className="flex gap-1 overflow-x-auto border-b border-[var(--vms-line)]"
        aria-label="Invitation status"
      >
        {statusFilters.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value}
              type="button"
              className={[
                "relative min-h-11 whitespace-nowrap px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                active
                  ? "text-[var(--vms-ink)]"
                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
              onClick={() =>
                updateQuery({
                  status: filter.value,
                  page: 1,
                  search: undefined,
                })
              }
            >
              {filter.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[var(--vms-active-accent)]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <DataTable
        data={items}
        columns={columns}
        tableLabel="Visitor invitation register"
        searchPlaceholder="Search code, guest or purpose"
        initialSearch={search}
        onSearchChange={(value) =>
          updateQuery({
            search: value.trim().slice(0, 100) || undefined,
            page: 1,
          })
        }
        serverSide
        total={invitations.data?.total ?? 0}
        currentPage={invitations.data?.page ?? page}
        onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        pageSize={PAGE_SIZE}
        pageSizeOptions={[PAGE_SIZE]}
        isLoading={invitations.isPending}
        errorMessage={
          invitations.isError && !invitations.data
            ? parseApiError(invitations.error).message
            : undefined
        }
        isStale={invitations.isError && !!invitations.data}
        staleMessage="Showing the last successful invitation snapshot."
        onRetry={() => invitations.refetch()}
        emptyMessage={
          search
            ? "No invitations match this search"
            : `No ${activeLabel.toLowerCase()}`
        }
        selectable
        getRowId={(invitation) => invitation.id}
        bulkActions={bulkActions}
        mobileSummary={(invitation) => (
          <Link href={`/admin/invitations/${invitation.id}`} className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold">
                  {guestNames(invitation)}
                </strong>
                <span className="mt-0.5 block font-mono text-[11px] text-[var(--vms-ink-muted)]">
                  {invitation.code}
                </span>
              </div>
              <StatusBadge status={invitation.status} />
            </div>
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
              <dt className="text-[var(--vms-ink-muted)]">Host</dt>
              <dd className="truncate text-right">
                {invitation.host_party.display_name}
              </dd>
              <dt className="text-[var(--vms-ink-muted)]">Place</dt>
              <dd className="truncate text-right">
                {invitation.destination_place.name}
              </dd>
              <dt className="text-[var(--vms-ink-muted)]">Valid</dt>
              <dd className="text-right">
                <Validity invitation={invitation} compact />
              </dd>
            </dl>
          </Link>
        )}
      />
    </main>
  );
}

export function guestNames(invitation: VisitAuthorization) {
  const names = invitation.guests.map((guest) => guest.display_name_snapshot);
  if (names.length <= 2) return names.join(", ") || "Unnamed guest";
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function StatusBadge({ status }: { status: VisitAuthorizationStatus }) {
  const variant =
    status === "approved"
      ? "success"
      : status === "requested"
        ? "warning"
        : status === "declined" || status === "revoked"
          ? "danger"
          : "neutral";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: VisitAuthorizationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Validity({
  invitation,
  compact = false,
}: {
  invitation: VisitAuthorization;
  compact?: boolean;
}) {
  return (
    <span className={compact ? "inline" : "grid gap-0.5 text-xs"}>
      <time dateTime={invitation.valid_from} className="whitespace-nowrap">
        {formatDate(invitation.valid_from)}
      </time>
      <span className="text-[var(--vms-ink-muted)]">
        {compact ? " – " : ""}
        <time dateTime={invitation.valid_to}>
          {formatDate(invitation.valid_to)}
        </time>
      </span>
    </span>
  );
}

function InvitationQueueSkeleton({ title }: { title: string }) {
  return (
    <main className="space-y-4 pb-10" role="status" aria-live="polite">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-64 w-full" />
      <span className="sr-only">{title}</span>
    </main>
  );
}

function QueueError({
  title,
  error,
  retry,
  embedded = false,
}: {
  title: string;
  error: unknown;
  retry: () => void;
  embedded?: boolean;
}) {
  return (
    <div
      role="alert"
      className={
        embedded
          ? "flex flex-wrap items-center justify-between gap-3 border-l-2 border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
          : "rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
      }
    >
      <div>
        <strong className="block font-semibold">{title}</strong>
        <p className="mt-1">{parseApiError(error).message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}
