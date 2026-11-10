"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  KeyRound,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Share2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { FormDrawer, FormRecordSummary } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import type { WorkspaceRelationship } from "@/types";
import {
  type CreateVisitAuthorizationInput,
  type VisitAuthorization,
  type VisitAuthorizationStatus,
} from "./api";
import { MAX_INVITATION_GUESTS, clampMaxUses } from "./lib";
import {
  useCancelInvitation,
  useCreateInvitation,
  useInvitation,
  useInvitationCheckpoints,
  useInvitationCredentials,
  usePlaceInvitations,
} from "./queries";

const statusMeta: Record<
  VisitAuthorizationStatus,
  { label: string; className: string }
> = {
  requested: {
    label: "Awaiting approval",
    className:
      "border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]   ",
  },
  approved: {
    label: "Approved",
    className:
      "border-[var(--vms-success)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]   ",
  },
  declined: {
    label: "Declined",
    className:
      "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]   ",
  },
  expired: {
    label: "Expired",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600   ",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600   ",
  },
  revoked: {
    label: "Revoked",
    className:
      "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]   ",
  },
};

const PAGE_SIZE = 8;
type InvitationTab = "upcoming" | "on_site" | "past";
type VisitDateFilter = "all" | "today" | "week" | "month";
type StatusFilter = "all" | VisitAuthorizationStatus;

const dayLabel = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const timeLabel = (value: Date) =>
  value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

function invitationBucket(
  invitation: VisitAuthorization,
  now: number,
): InvitationTab {
  const start = new Date(invitation.valid_from).getTime();
  const end = new Date(invitation.valid_to).getTime();
  const open =
    invitation.status === "approved" || invitation.status === "requested";
  if (open && start <= now && end >= now) return "on_site";
  if (open && end >= now) return "upcoming";
  return "past";
}

function bucketInvitations(items: VisitAuthorization[]) {
  const now = Date.now();
  const buckets: Record<InvitationTab, VisitAuthorization[]> = {
    upcoming: [],
    on_site: [],
    past: [],
  };
  for (const invitation of items) {
    buckets[invitationBucket(invitation, now)].push(invitation);
  }
  const byStart = (left: VisitAuthorization, right: VisitAuthorization) =>
    new Date(left.valid_from).getTime() - new Date(right.valid_from).getTime();
  buckets.upcoming.sort(byStart);
  buckets.on_site.sort(byStart);
  buckets.past.sort(
    (left, right) => new Date(right.valid_from).getTime() - new Date(left.valid_from).getTime(),
  );
  return buckets;
}

function filterInvitations(
  items: VisitAuthorization[],
  {
    search,
    visitDate,
    status,
  }: { search: string; visitDate: VisitDateFilter; status: StatusFilter },
) {
  const needle = search.trim().toLowerCase();
  const now = new Date();
  const horizon = new Date(now);
  if (visitDate === "today") horizon.setHours(23, 59, 59, 999);
  if (visitDate === "week") horizon.setDate(horizon.getDate() + 7);
  if (visitDate === "month") horizon.setDate(horizon.getDate() + 30);
  return items.filter((invitation) => {
    if (status !== "all" && invitation.status !== status) return false;
    if (visitDate !== "all") {
      const start = new Date(invitation.valid_from);
      if (start > horizon) return false;
      if (visitDate === "today" && start < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return false;
      }
    }
    if (!needle) return true;
    return [
      invitation.code,
      invitation.purpose ?? "",
      invitation.host_party?.display_name ?? "",
      ...invitation.guests.map(
        (guest) =>
          `${guest.display_name_snapshot} ${guest.phone_snapshot ?? ""} ${guest.email_snapshot ?? ""}`,
      ),
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

function InvitationStatus({ status }: { status: VisitAuthorizationStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function VisitWindow({ from, to }: { from: string; to: string }) {
  const start = new Date(from);
  const end = new Date(to);
  const hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3_600_000));
  return (
    <div className="text-xs leading-5 text-[var(--vms-ink-muted)]">
      <p className="flex items-center gap-1.5 font-medium text-[var(--vms-ink)]">
        <CalendarClock aria-hidden className="h-3.5 w-3.5" />
        {dayLabel(start)}
      </p>
      <p className="mt-0.5">
        {timeLabel(start)} – {timeLabel(end)} ({hours}h)
      </p>
    </div>
  );
}

function VisitorCell({
  invitation,
  guestName,
  guestPhone,
}: {
  invitation?: VisitAuthorization;
  guestName?: string;
  guestPhone?: string | null;
}) {
  const guests = invitation?.guests ?? [];
  const grouped = guests.length > 1;
  const name = grouped
    ? `${guests.length} visitors`
    : guestName || guests[0]?.display_name_snapshot || "Visitor";
  const detail = grouped
    ? guests.map((guest) => guest.display_name_snapshot).join(", ")
    : guestPhone || guests[0]?.phone_snapshot || "";
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="flex shrink-0 -space-x-2">
        {(grouped ? guests.slice(0, 2) : [undefined]).map((guest, index) => (
          <Avatar
            key={guest?.id ?? index}
            name={guest?.display_name_snapshot ?? guestName ?? "Visitor"}
            size="sm"
            tone={index === 0 ? "coral" : "ink"}
            decorative
            className="ring-2 ring-[var(--vms-surface)]"
          />
        ))}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
          {name}
        </p>
        {detail ? (
          <p className="truncate text-xs text-[var(--vms-ink-muted)]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyInvitations({
  tab,
  onInvite,
}: {
  tab: InvitationTab;
  onInvite: () => void;
}) {
  const copy: Record<InvitationTab, { title: string; detail: string }> = {
    upcoming: {
      title: "No upcoming invitations",
      detail: "Invite a visitor and their invitation will appear here.",
    },
    on_site: {
      title: "Nobody is on site",
      detail: "Visitors appear here once they check in during their window.",
    },
    past: {
      title: "No past invitations",
      detail: "Invitations move here once their visit window closes.",
    },
  };
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <CalendarClock aria-hidden className="h-6 w-6 text-[var(--vms-ink-muted)]" />
      <p className="text-sm font-semibold text-[var(--vms-ink)]">
        {copy[tab].title}
      </p>
      <p className="max-w-sm text-xs leading-5 text-[var(--vms-ink-muted)]">
        {copy[tab].detail}
      </p>
      {tab === "upcoming" ? (
        <button
          type="button"
          onClick={onInvite}
          className="mt-1 text-xs font-semibold text-[var(--vms-ink)] underline underline-offset-4"
        >
          Invite your first visitor
        </button>
      ) : null}
    </div>
  );
}

export function AccessWorkspace({
  relationship,
  partyName,
  partyEmail,
  siteId,
}: {
  relationship: WorkspaceRelationship;
  partyName: string;
  partyEmail?: string | null;
    siteId?: string | null;
  }) {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState<
    string | null
  >(null);
  const [tab, setTab] = useState<InvitationTab>("upcoming");
  const [search, setSearch] = useState("");
  const [visitDate, setVisitDate] = useState<VisitDateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const invitations = usePlaceInvitations(
    relationship.place.id,
    relationship.party.id,
  );
  const cancelInvitation = useCancelInvitation();
  const items = useMemo(
    () => invitations.data?.items || [],
    [invitations.data?.items],
  );
  const closeInvitation = useCallback(() => setSelectedInvitationId(null), []);
  const buckets = useMemo(() => bucketInvitations(items), [items]);
  const filtered = useMemo(
    () =>
      filterInvitations(buckets[tab], {
        search,
        visitDate,
        status: statusFilter,
      }),
    [buckets, search, statusFilter, tab, visitDate],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered;
  const visibleRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).slice(0, 5);
  const expandedList = useMemo(() => new Set(expanded), [expanded]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invitation code copied");
    } catch {
      toast.error("Could not copy the invitation code");
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-action)] bg-[var(--vms-action)] px-4 py-2.5 text-sm font-semibold text-[var(--vms-on-action)] shadow-[var(--vms-shadow-raised)] transition hover:bg-[var(--vms-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Invite visitor
          </button>
        </div>

        <InvitationComposer
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          siteId={siteId ?? relationship.site_id ?? null}
          destinationPlaceId={relationship.place.id}
          destinationName={relationship.place.name}
          partyName={partyName}
          partyEmail={partyEmail}
          onCreated={() => setShowComposer(false)}
        />

        <div className="px-4 sm:px-5">
          <div
            role="tablist"
            aria-label="Invitation period"
            className="flex gap-1 overflow-x-auto border-b border-[var(--vms-line)]"
          >
            {(
              [
                ["upcoming", "Upcoming"],
                ["on_site", "On site"],
                ["past", "Past"],
              ] as const
            ).map(([value, label]) => {
              const active = tab === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(value);
                    setPage(1);
                  }}
                  className={cn(
                    "relative inline-flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                    active
                      ? "font-semibold text-[var(--vms-ink)]"
                      : "text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                  )}
                >
                  {label}
                  <span className="text-xs font-medium text-[var(--vms-ink-muted)]">
                    ({buckets[value].length})
                  </span>
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--vms-active-accent)]"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <label className="relative flex min-h-10 flex-1 items-center sm:max-w-sm">
            <span className="sr-only">Search invitations</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--vms-ink-muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by invitation ID or visitor name"
              className="min-h-10 w-full rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] pl-9 pr-3 text-sm text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Visit date</span>
            <CalendarDays
              aria-hidden
              className="h-4 w-4 text-[var(--vms-ink-muted)]"
            />
            <select
              value={visitDate}
              onChange={(event) => {
                setVisitDate(event.target.value as VisitDateFilter);
                setPage(1);
              }}
              className="min-h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              <option value="all">Visit date</option>
              <option value="today">Today</option>
              <option value="week">Next 7 days</option>
              <option value="month">Next 30 days</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="min-h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              <option value="all">All status</option>
              <option value="requested">Awaiting approval</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
        </div>

        <div className="px-4 pb-2 sm:px-5">
          {invitations.isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2.5 text-sm text-[var(--vms-danger)]"
            >
              <p>{parseApiError(invitations.error).message}</p>
              <button
                type="button"
                onClick={() => invitations.refetch()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : invitations.isPending ? (
            <LoadingRows />
          ) : visible.length === 0 ? (
            <EmptyInvitations tab={tab} onInvite={() => setShowComposer(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--vms-line)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      Invitation ID
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      Visitor(s)
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      Visit window
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      Host
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="py-2.5 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((invitation) => {
                    const grouped = invitation.guests.length > 1;
                    const isOpen = expandedList.has(invitation.id);
                    const primary = invitation.guests[0];
                    return (
                      <Fragment key={invitation.id}>
                        <tr className="border-b border-[var(--vms-line)] align-top transition hover:bg-[var(--vms-surface-subtle)]">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-1.5">
                              {grouped ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(invitation.id)}
                                  aria-expanded={isOpen}
                                  aria-label={`${isOpen ? "Collapse" : "Expand"} invitation ${invitation.code}`}
                                  className="grid h-6 w-6 shrink-0 place-items-center rounded text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                                >
                                  <ChevronDown
                                    aria-hidden
                                    className={cn(
                                      "h-3.5 w-3.5 transition-transform",
                                      isOpen && "rotate-180",
                                    )}
                                  />
                                </button>
                              ) : (
                                <span aria-hidden className="w-6 shrink-0" />
                              )}
                              <span className="font-mono text-[13px] font-semibold text-[var(--vms-ink)]">
                                {invitation.code}
                              </span>
                              {grouped ? (
                                <span className="rounded-full bg-[var(--vms-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-ink-muted)]">
                                  Group ({invitation.guests.length})
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <VisitorCell
                              invitation={invitation}
                              guestName={primary?.display_name_snapshot}
                              guestPhone={primary?.phone_snapshot}
                            />
                          </td>
                          <td className="py-3 pr-3">
                            <VisitWindow
                              from={invitation.valid_from}
                              to={invitation.valid_to}
                            />
                          </td>
                          <td className="py-3 pr-3 text-sm text-[var(--vms-ink)]">
                            {invitation.host_party?.display_name || partyName}
                          </td>
                          <td className="py-3 pr-3">
                            <InvitationStatus status={invitation.status} />
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => copyCode(invitation.code)}
                                aria-label={`Copy invitation ${invitation.code}`}
                                className="grid h-8 w-8 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                              >
                                <Copy aria-hidden className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedInvitationId(invitation.id)
                                }
                                aria-label={`Open invitation ${invitation.code}`}
                                className="grid h-8 w-8 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                              >
                                <ArrowUpRight
                                  aria-hidden
                                  className="h-3.5 w-3.5"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {grouped && isOpen
                          ? invitation.guests.map((guest) => (
                            <tr
                              key={`${invitation.id}:${guest.id}`}
                              className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]/40 align-top"
                            >
                              <td className="py-2.5 pr-3 pl-9">
                                <span className="font-mono text-[12px] text-[var(--vms-ink-muted)]">
                                  {invitation.code}-{guest.suffix}
                                </span>
                              </td>
                              <td className="py-2.5 pr-3">
                                <VisitorCell
                                  guestName={guest.display_name_snapshot}
                                  guestPhone={guest.phone_snapshot}
                                />
                              </td>
                              <td className="py-2.5 pr-3">
                                <VisitWindow
                                  from={invitation.valid_from}
                                  to={invitation.valid_to}
                                />
                              </td>
                              <td className="py-2.5 pr-3 text-sm text-[var(--vms-ink-muted)]">
                                {invitation.host_party?.display_name ||
                                  partyName}
                              </td>
                              <td className="py-2.5 pr-3">
                                <InvitationStatus
                                  status={invitation.status}
                                />
                              </td>
                              <td />
                            </tr>
                          ))
                          : null}
                      </Fragment>
                    );
                  })}
                      </tbody>
                    </table>
                  </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vms-line)] px-4 py-3 sm:px-5">
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {visible.length
              ? `Showing ${pageStart + 1}–${pageStart + visibleRows.length} of ${visible.length} invitations`
              : "No invitations to show"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="grid h-8 w-8 place-items-center rounded-md border border-[var(--vms-line)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                aria-current={number === page ? "page" : undefined}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-md border px-2 text-xs font-semibold transition",
                  number === page
                    ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                    : "border-[var(--vms-line)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
                )}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="grid h-8 w-8 place-items-center rounded-md border border-[var(--vms-line)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {selectedInvitationId ? (
        <InvitationDetail
          invitationId={selectedInvitationId}
          onClose={closeInvitation}
          onCancel={() => cancelInvitation.mutate(selectedInvitationId)}
          cancelling={
            cancelInvitation.isPending &&
            cancelInvitation.variables === selectedInvitationId
          }
        />
      ) : null}
    </div>
  );
}

function InvitationComposer({
  isOpen,
  onClose,
  siteId,
  destinationPlaceId,
  destinationName,
  partyName,
  partyEmail,
  onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    siteId: string | null;
  destinationPlaceId: string;
  destinationName: string;
  partyName: string;
  partyEmail?: string | null;
    onCreated: () => void | Promise<void>;
}) {
  const [guests, setGuests] = useState<GuestDraft[]>([createGuestDraft()]);
  const [purpose, setPurpose] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [validFrom, setValidFrom] = useState(() => toLocalInput(new Date()));
  const [validTo, setValidTo] = useState(() =>
    toLocalInput(new Date(Date.now() + 4 * 60 * 60 * 1000)),
  );
  const [error, setError] = useState<string | null>(null);
  const [invalidGuestIds, setInvalidGuestIds] = useState<string[]>([]);
  const createInvitation = useCreateInvitation({
    onSuccess: async () => {
      toast.success("Invitation submitted");
      setGuests([createGuestDraft()]);
      setPurpose("");
      setMaxUses("1");
      setInvalidGuestIds([]);
      setError(null);
      await onCreated();
    },
    onError: (mutationError) => setError(parseApiError(mutationError).message),
  });

  const windowStart = new Date(validFrom);
  const windowEnd = new Date(validTo);
  const windowHours =
    Number.isFinite(windowStart.getTime()) &&
      Number.isFinite(windowEnd.getTime()) &&
      windowEnd > windowStart
      ? Math.round(((windowEnd.getTime() - windowStart.getTime()) / 3_600_000) * 10) / 10
      : null;

  function applyWindow(hours: number, dayOffset = 0) {
    const base = new Date();
    base.setDate(base.getDate() + dayOffset);
    base.setSeconds(0, 0);
    if (dayOffset > 0) base.setHours(9, 0, 0, 0);
    else base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    setValidFrom(toLocalInput(base));
    setValidTo(toLocalInput(new Date(base.getTime() + hours * 3_600_000)));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!siteId) {
      setError(
        "This workspace is missing its Site reference. Reload the workspace and try again.",
      );
      return;
    }
    const missingGuest = guests.findIndex(
      (guest) => !guest.display_name.trim(),
    );
    if (missingGuest !== -1) {
      setInvalidGuestIds(
        guests
          .filter((guest) => !guest.display_name.trim())
          .map((guest) => guest.id),
      );
      setError(`Enter visitor ${missingGuest + 1}’s name.`);
      return;
    }
    setInvalidGuestIds([]);
    const start = new Date(validFrom);
    const end = new Date(validTo);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setError("Choose a valid access window.");
      return;
    }
    if (end <= start) {
      setError("The access window must end after it starts.");
      return;
    }
    const input: CreateVisitAuthorizationInput = {
      site_id: siteId,
      destination_place_id: destinationPlaceId,
      valid_from: start.toISOString(),
      valid_to: end.toISOString(),
      max_uses: clampMaxUses(maxUses),
      purpose: purpose.trim() || null,
      guests: guests.map((guest) => ({
        display_name: guest.display_name.trim(),
        email: guest.email.trim() || undefined,
        phone: guest.phone.trim() || undefined,
      })),
    };
    createInvitation.mutate(input);
  }

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create invitation"
      description={`Invite visitors to ${destinationName}.`}
      onSubmit={submit}
      submitLabel="Submit invitation"
      isSubmitting={createInvitation.isPending}
      canSubmit={Boolean(siteId)}
      size="lg"
      footerNote={
        siteId
          ? `${guests.length} ${guests.length === 1 ? "visitor" : "visitors"}${windowHours
            ? ` · ${windowHours} hour${windowHours === 1 ? "" : "s"} of access`
            : ""
          }`
          : "This workspace is missing its Site reference"
      }
      error={error}
    >
      {!siteId ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] px-3 py-2.5 text-sm text-[var(--vms-warning)]"
        >
          <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            This workspace is missing its Site reference, so the invitation
            cannot be submitted. Reload the workspace and try again.
          </p>
        </div>
      ) : null}
      <FormRecordSummary
        title={destinationName}
        meta={`Hosted by ${partyName}`}
        trailing={
          partyEmail ? (
            <span className="min-w-0 truncate text-xs text-[var(--vms-ink-muted)]">
              {partyEmail}
            </span>
          ) : undefined
        }
      />

      <FormSection
        title="Visit window"
        description="Everything the checkpoint operator needs to honour this invitation."
      >
        <Field label="Purpose" hint="Shown on the invitation and at the gate.">
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Visit, delivery, meeting…"
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Access starts" required>
            <input
              type="datetime-local"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Access ends" required>
            <input
              type="datetime-local"
              value={validTo}
              onChange={(event) => setValidTo(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--vms-ink-muted)]">
            Quick fill
          </span>
          {[
            { label: "Next 4 hours", hours: 4, offset: 0 },
            { label: "Next 8 hours", hours: 8, offset: 0 },
            { label: "Tomorrow, 9am–8pm", hours: 11, offset: 1 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyWindow(preset.hours, preset.offset)}
              className="inline-flex min-h-8 items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-2.5 text-xs font-semibold text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Field
          label="Maximum entries"
          hint="How many times the visitor may pass through a checkpoint."
        >
          <input
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            max={100}
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
            onBlur={() => setMaxUses(String(clampMaxUses(maxUses)))}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Visitors"
        description={`Everyone covered by this invitation. Up to ${MAX_INVITATION_GUESTS} visitors.`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--vms-ink-muted)]">
            {guests.length} of {MAX_INVITATION_GUESTS} added
          </p>
          <button
            type="button"
            disabled={guests.length >= MAX_INVITATION_GUESTS}
            onClick={() =>
              setGuests((current) => [...current, createGuestDraft()])
            }
            className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2.5 text-xs font-semibold text-[var(--vms-ink)] transition hover:bg-[var(--vms-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add another guest
          </button>
        </div>
        <div className="space-y-3">
          {guests.map((guest, index) => {
            const invalid = invalidGuestIds.includes(guest.id);
            return (
              <div
                key={guest.id}
                className={`rounded-[var(--vms-radius-control)] border bg-[var(--vms-surface)] p-3 ${invalid
                    ? "border-[var(--vms-danger)]"
                    : "border-[var(--vms-line)]"
                  }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="grid h-6 w-6 place-items-center rounded-full bg-[var(--vms-surface-subtle)] text-[11px] font-semibold text-[var(--vms-ink)]"
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                      Guest {index + 1}
                    </span>
                  </div>
                  {guests.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Remove guest ${index + 1}`}
                      onClick={() =>
                        setGuests((current) =>
                          current.filter((item) => item.id !== guest.id),
                        )
                      }
                      className="text-xs font-semibold text-[var(--vms-danger)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field
                    label={
                      index === 0
                        ? "Visitor name"
                        : `Additional visitor ${index} name`
                    }
                    required
                  >
                    <input
                      value={guest.display_name}
                      aria-invalid={invalid || undefined}
                      onChange={(event) =>
                        updateGuest(
                          setGuests,
                          guest.id,
                          "display_name",
                          event.target.value,
                        )
                      }
                      placeholder="Full name"
                      autoComplete="name"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label={
                      index === 0 ? "Email" : `Additional visitor ${index} email`
                    }
                  >
                    <input
                      type="email"
                      value={guest.email}
                      onChange={(event) =>
                        updateGuest(
                          setGuests,
                          guest.id,
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label={
                      index === 0 ? "Phone" : `Additional visitor ${index} phone`
                    }
                  >
                    <input
                      type="tel"
                      value={guest.phone}
                      onChange={(event) =>
                        updateGuest(
                          setGuests,
                          guest.id,
                          "phone",
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </FormDrawer>
  );
}

interface GuestDraft {
  id: string;
  display_name: string;
  email: string;
  phone: string;
}

function createGuestDraft(): GuestDraft {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random()}`,
    display_name: "",
    email: "",
    phone: "",
  };
}

function updateGuest(
  setGuests: React.Dispatch<React.SetStateAction<GuestDraft[]>>,
  guestId: string,
  field: "display_name" | "email" | "phone",
  value: string,
) {
  setGuests((current) =>
    current.map((guest) =>
      guest.id === guestId ? { ...guest, [field]: value } : guest,
    ),
  );
}

function InvitationRow({
  invitation,
  cancelling,
  onCopy,
  onOpen,
  onCancel,
}: {
  invitation: VisitAuthorization;
  cancelling: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onCancel: () => void;
}) {
  const status = statusMeta[invitation.status];
  const cancellable =
    invitation.status === "requested" || invitation.status === "approved";
  return (
    <article className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">
            {invitation.guests
              .map((guest) => guest.display_name_snapshot)
              .join(", ")}
          </h3>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 ">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatWindow(invitation.valid_from, invitation.valid_to)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {invitation.uses_count}
            {invitation.max_uses ? ` / ${invitation.max_uses}` : ""} entries
          </span>
          {invitation.purpose ? <span>{invitation.purpose}</span> : null}
        </div>
        <p className="mt-3 font-mono text-sm font-semibold tracking-[0.08em]">
          {invitation.code}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50   "
        >
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50   "
        >
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </button>
        {cancellable ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-lg border border-[var(--vms-danger)] px-3 py-2 text-xs font-semibold text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)] disabled:opacity-50   "
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function InvitationDetail({
  invitationId,
  onClose,
  onCancel,
  cancelling,
}: {
  invitationId: string;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const invitation = useInvitation(invitationId);
  const checkpointEvents = useInvitationCheckpoints(invitationId);
  const guestCredentials = useInvitationCredentials(invitationId);
  const data = invitation.data;
  const status = data ? statusMeta[data.status] : null;

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  async function shareInvitation() {
    if (!data) return;
    const text = [
      `Visitor invitation for ${data.destination_place.name}`,
      `Code: ${data.code}`,
      `Valid: ${formatWindow(data.valid_from, data.valid_to)}`,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Visitor invitation", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Invitation details copied");
      }
    } catch {
      toast.error("Could not share the invitation");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-detail-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-2xl   sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 ">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 ">
              Visitor invitation
            </p>
            <h2
              id="invitation-detail-title"
              className="mt-1 text-lg font-semibold"
            >
              {data
                ? data.guests
                    .map((guest) => guest.display_name_snapshot)
                    .join(", ")
                : "Loading invitation"}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close invitation details"
            className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50   "
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {invitation.isError ? (
          <div className="p-5">
            <ErrorState
              message={parseApiError(invitation.error).message}
              onRetry={() => invitation.refetch()}
            />
          </div>
        ) : invitation.isPending || !data ? (
          <LoadingRows />
        ) : (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {status ? (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              ) : null}
              <span className="text-xs text-zinc-500 ">
                Requested {formatDateTime(data.requested_at)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-4">
                <DetailLine
                  icon={MapPin}
                  label="Destination"
                  value={`${data.destination_place.name}${
                    data.destination_place.address
                      ? ` · ${data.destination_place.address}`
                      : ""
                  }`}
                />
                <DetailLine
                  icon={CalendarClock}
                  label="Access window"
                  value={formatWindow(data.valid_from, data.valid_to)}
                />
                <DetailLine
                  icon={CheckCircle2}
                  label="Entry allowance"
                  value={`${data.uses_count} used${
                    data.max_uses ? ` of ${data.max_uses}` : " · unlimited"
                  }`}
                />
                <DetailLine
                  icon={UserRound}
                  label="Host"
                  value={data.host_party.display_name}
                />
                {data.purpose ? (
                  <DetailLine
                    icon={KeyRound}
                    label="Purpose"
                    value={data.purpose}
                  />
                ) : null}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center  ">
                <div className="mx-auto grid h-36 w-36 place-items-center rounded-lg bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    value={data.qr_code_url || data.code}
                    size={120}
                    level="M"
                  />
                </div>
                <p className="mt-3 break-all font-mono text-sm font-semibold tracking-[0.08em]">
                  {data.code}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 ">
                  Human-readable invitation reference
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Guests</h3>
              <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200  ">
                {data.guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {guest.display_name_snapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 ">
                        {guest.email_snapshot ||
                          guest.phone_snapshot ||
                          "No contact provided"}
                      </p>
                    </div>
                    <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-[10px] text-zinc-600  ">
                      {guest.suffix}
                    </span>
                    {guestCredentials.data?.find(
                      (credential) => credential.guest_id === guest.id,
                    ) ? (
                      <QRCodeSVG
                        value={
                          guestCredentials.data.find(
                            (credential) => credential.guest_id === guest.id,
                          )?.credential || data.code
                        }
                        size={56}
                        level="M"
                        aria-label={`Secure access QR for ${guest.display_name_snapshot}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <ArrivalHistory
              events={checkpointEvents.data?.items || []}
              loading={checkpointEvents.isPending}
              error={
                checkpointEvents.isError
                  ? parseApiError(checkpointEvents.error).message
                  : null
              }
              onRetry={() => checkpointEvents.refetch()}
            />

            {data.decline_reason ? (
              <div className="rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]   ">
                <p className="font-semibold">Declined</p>
                <p className="mt-1">{data.decline_reason}</p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4  sm:flex-row sm:justify-end">
              {(data.status === "requested" || data.status === "approved") && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className="rounded-lg border border-[var(--vms-danger)] px-3 py-2 text-sm font-semibold text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)] disabled:opacity-50   "
                >
                  {cancelling ? "Cancelling…" : "Cancel invitation"}
                </button>
              )}
              <button
                type="button"
                onClick={shareInvitation}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 py-2 text-sm font-semibold text-white"
              >
                <Share2 className="h-4 w-4" />
                Share invitation
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ArrivalHistory({
  events,
  loading,
  error,
  onRetry,
}: {
  events: Array<{
    id: string;
    direction: "entry" | "exit";
    outcome: "allowed" | "denied";
    reason_code: string;
    occurred_at: string;
    gate_id: string;
  }>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="arrival-history-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="arrival-history-title" className="text-sm font-semibold">
            Arrival history
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 ">
            Checkpoint decisions recorded for this invitation.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600  ">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-500 ">Loading arrival history…</p>
      ) : error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]   ">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-semibold">
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-500  ">
          No checkpoint events yet.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200  ">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium capitalize">
                  {event.direction} · {event.outcome}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 ">
                  Gate {event.gate_id.slice(0, 8)} · {event.reason_code}
                </p>
              </div>
              <time
                dateTime={event.occurred_at}
                className="text-right text-xs text-zinc-500 "
              >
                {formatDateTime(event.occurred_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500  ">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 ">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm  ">
      <Icon className="h-5 w-5 text-[var(--vms-action)] " />
      <p className="mt-4 text-xs font-medium text-zinc-500 ">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 ">{detail}</p>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
    hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[13px] font-semibold text-[var(--vms-ink)]">
      <span>
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-[var(--vms-danger)]">
            *
          </span>
        ) : null}
      </span>
      <span className="mt-1.5 block font-normal">{children}</span>
      {hint ? (
        <span className="mt-1 block text-xs font-normal leading-5 text-[var(--vms-ink-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="p-6">
      <div className="flex items-start gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]   ">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Invitations unavailable</p>
          <p className="mt-1">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" role="status">
      <span className="sr-only">Loading invitations</span>
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-lg bg-zinc-100 "
        />
      ))}
    </div>
  );
}

function formatWindow(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(from))} – ${formatter.format(new Date(to))}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)]/20   ";
