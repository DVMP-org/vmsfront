"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  VisitAuthorization,
  VisitAuthorizationStatus,
} from "@/features/access-journey/api";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { adminService } from "@/services/admin-service";
import {
  invitationApprovalsApi,
  type ApprovalFilter,
} from "./api";

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
  const queryString = searchParams?.toString() || "";
  const initial = useMemo(
    () => new URLSearchParams(queryString),
    [queryString],
  );
  const status = validStatus(initial.get("status"));
  const page = validPage(initial.get("page"));
  const search = (initial.get("search") || "").slice(0, 100);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => setSearchInput(search), [search]);

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

  const invitations = useQuery({
    queryKey: ["admin-invitation-approvals", status, page, search],
    queryFn: () =>
      invitationApprovalsApi.list({ status, page, pageSize: PAGE_SIZE, search }),
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
      if (value === undefined || value === "" || value === 1) params.delete(key);
      else params.set(key, String(value));
    });
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || undefined, page: 1 });
  }

  if (profile.isPending || (profile.isFetched && !profile.isFetchedAfterMount)) {
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
                updateQuery({ status: filter.value, page: 1, search: undefined })
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

      <section
        className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
        aria-labelledby="invitation-register-heading"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              id="invitation-register-heading"
              className="text-sm font-semibold"
            >
              {activeLabel}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              {invitations.data?.total ?? 0} invitation
              {(invitations.data?.total ?? 0) === 1 ? "" : "s"} in this view
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            role="search"
            onSubmit={submitSearch}
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search invitations</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={100}
                placeholder="Code, guest or purpose"
                className="h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] pl-9 pr-3 text-base text-[var(--vms-ink)] outline-none placeholder:text-[var(--vms-ink-muted)] focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)] sm:h-10 sm:text-sm"
              />
            </label>
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>

        {invitations.isPending ? (
          <InvitationRowsSkeleton />
        ) : invitations.isError && !invitations.data ? (
          <QueueError
            title="Invitation queue unavailable"
            error={invitations.error}
            retry={() => invitations.refetch()}
            embedded
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={search ? "No invitations match this search" : `No ${activeLabel.toLowerCase()}`}
            description={
              search
                ? "Clear the search or choose another status."
                : "Invitation activity for this property will appear here."
            }
            action={
              search ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    updateQuery({ search: undefined, page: 1 })
                  }
                >
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {invitations.isError ? (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[color-mix(in_srgb,var(--vms-warning)_30%,transparent)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-xs text-[var(--vms-warning)]"
                role="status"
              >
                Showing the last successful invitation snapshot.
                <button
                  type="button"
                  className="min-h-11 font-semibold underline"
                  onClick={() => invitations.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : null}
            <InvitationTable invitations={items} />
            <div className="border-t border-[var(--vms-line)] p-3">
              <PaginationBar
                page={invitations.data?.page || page}
                pageSize={PAGE_SIZE}
                total={invitations.data?.total || 0}
                totalPages={invitations.data?.total_pages || 0}
                resourceLabel="invitations"
                onChange={(nextPage) => updateQuery({ page: nextPage })}
                isFetching={invitations.isFetching}
                className="border-0 bg-transparent p-0 shadow-none"
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function InvitationTable({ invitations }: { invitations: VisitAuthorization[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Visitor invitation register</caption>
          <thead className="bg-[var(--vms-surface-subtle)] text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Host / place</th>
              <th className="px-4 py-3 font-semibold">Validity</th>
              <th className="px-4 py-3 font-semibold">Uses</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--vms-line)]">
            {invitations.map((invitation) => (
              <tr
                key={invitation.id}
                className="group transition-colors hover:bg-[var(--vms-surface-subtle)]"
              >
                <td className="px-4 py-3.5">
                  <Link
                    href={`/admin/invitations/${invitation.id}`}
                    className="font-semibold text-[var(--vms-ink)] outline-none group-hover:underline focus-visible:underline"
                  >
                    {guestNames(invitation)}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[11px] text-[var(--vms-ink-muted)]">
                    {invitation.code}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[var(--vms-ink-muted)]">
                  <span className="block text-[var(--vms-ink)]">
                    {invitation.host_party.display_name}
                  </span>
                  <span className="block text-xs">
                    {invitation.destination_place.name}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Validity invitation={invitation} />
                </td>
                <td className="px-4 py-3.5 tabular-nums text-[var(--vms-ink-muted)]">
                  {invitation.uses_count}
                  {invitation.max_uses
                    ? ` / ${invitation.max_uses}`
                    : " / unlimited"}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={invitation.status} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/admin/invitations/${invitation.id}`}
                    aria-label={`Open invitation for ${guestNames(invitation)}`}
                    className="inline-grid min-h-10 min-w-10 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[var(--vms-line)] md:hidden">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <Link
              href={`/admin/invitations/${invitation.id}`}
              className="block min-h-11 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]"
            >
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
                <dd className="truncate text-right">{invitation.host_party.display_name}</dd>
                <dt className="text-[var(--vms-ink-muted)]">Place</dt>
                <dd className="truncate text-right">{invitation.destination_place.name}</dd>
                <dt className="text-[var(--vms-ink-muted)]">Valid</dt>
                <dd className="text-right">
                  <Validity invitation={invitation} compact />
                </dd>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
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
        <time dateTime={invitation.valid_to}>{formatDate(invitation.valid_to)}</time>
      </span>
    </span>
  );
}

function InvitationRowsSkeleton() {
  return (
    <div className="divide-y divide-[var(--vms-line)]" role="status" aria-label="Loading invitations">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-3 p-4 md:grid-cols-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
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
