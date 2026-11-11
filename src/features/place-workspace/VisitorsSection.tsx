"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    UserRound,
    Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { accessJourneyApi, type VisitAuthorization } from "@/features/access-journey/api";
import { accessJourneyKeys } from "@/features/access-journey/queries";
import { isGuestOnSite } from "@/features/access-journey/lib";
import { useMediaQuery } from "@/hooks/use-media-query";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { usePlaceWorkspace } from "./PlaceWorkspaceShell";import { EmptyRow, Tabs } from "./ui";

type VisitorBucket = "expected" | "visiting" | "history";

interface VisitorVisit {
    id: string;
    inviteId: string;
    status: string;
    from: string;
    to: string;
    purpose: string | null;
    /** Whether this visitor is currently checked in on this invitation. */
    onSite: boolean;
}

interface VisitorRecord {
    key: string;
    name: string;
    email: string | null;
    phone: string | null;
    inviteId: string;
    invitationCount: number;
    lastVisitAt: string;
    host: string;
    bucket: VisitorBucket;
    history: VisitorVisit[];
}

const PAGE_SIZE = 8;

const bucketRank: Record<VisitorBucket, number> = {
    visiting: 0,
    expected: 1,
    history: 2,
};

const day = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
const time = (value: string) =>
    new Date(value).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

function bucketFrom(
    status: string,
    validTo: string,
    onSite: boolean,
): VisitorBucket {
    if (["declined", "cancelled", "revoked", "expired"].includes(status)) {
        return "history";
    }
    if (onSite) return "visiting";
    if (new Date(validTo).getTime() < Date.now()) return "history";
    return "expected";
}

function bucketFor(invitation: VisitAuthorization): VisitorBucket {
    return bucketFrom(
        invitation.status,
        invitation.valid_to,
        invitation.guests.some(isGuestOnSite),
    );
}

function accessStatus(bucket: VisitorBucket, status: string) {
    if (bucket === "visiting") return { label: "Checked in", tone: "success" as StatusTone };
    if (bucket === "expected")
        return status === "requested"
            ? { label: "Awaiting approval", tone: "warning" as StatusTone }
            : { label: "Expected", tone: "info" as StatusTone };
    if (status === "declined" || status === "revoked")
        return { label: "Denied", tone: "danger" as StatusTone };
    if (status === "cancelled")
        return { label: "Cancelled", tone: "neutral" as StatusTone };
    return { label: "Completed", tone: "neutral" as StatusTone };
}

export function buildVisitorRecords(
    invitations: VisitAuthorization[],
): VisitorRecord[] {
    const records = new Map<string, VisitorRecord>();
    for (const invitation of invitations) {
        const bucket = bucketFor(invitation);
        for (const guest of invitation.guests) {
            const key = (
                guest.email_snapshot ||
                guest.phone_snapshot ||
                guest.display_name_snapshot
            )
                .trim()
                .toLowerCase();
            const visit: VisitorVisit = {
                id: invitation.id,
                inviteId: `${invitation.code}-${guest.suffix}`,
                status: invitation.status,
                from: invitation.valid_from,
                to: invitation.valid_to,
                purpose: invitation.purpose,
                onSite: isGuestOnSite(guest),
            };
            const existing = records.get(key);
            if (!existing) {
                records.set(key, {
                    key,
                    name: guest.display_name_snapshot,
                    email: guest.email_snapshot,
                    phone: guest.phone_snapshot,
                    inviteId: visit.inviteId,
                    invitationCount: 1,
                    lastVisitAt: invitation.valid_from,
                    host: invitation.host_party?.display_name ?? "",
                    bucket,
                    history: [visit],
                });
                continue;
            }
            existing.invitationCount += 1;
            existing.history.push(visit);
            if (bucketRank[bucket] < bucketRank[existing.bucket]) {
                existing.bucket = bucket;
            }
            if (
                new Date(invitation.valid_from).getTime() >=
                new Date(existing.lastVisitAt).getTime()
            ) {
                existing.lastVisitAt = invitation.valid_from;
                existing.inviteId = visit.inviteId;
                existing.host = invitation.host_party?.display_name ?? existing.host;
            }
        }
    }
    return Array.from(records.values()).map((record) => ({
        ...record,
        history: record.history.sort(
            (left, right) => new Date(right.from).getTime() - new Date(left.from).getTime(),
        ),
    }));
}

export function VisitorsSection() {
    const { place, party } = usePlaceWorkspace();
    const client = useQueryClient();
    const [tab, setTab] = useState<VisitorBucket>("expected");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    // The details sidebar is only visible from xl up, so the drawer must not
    // mount on those screens or the same record appears twice.
    const hasSidebar = useMediaQuery("(min-width: 1280px)");

    const query = useQuery({
        queryKey: accessJourneyKeys.list(place.id, party.id),
        queryFn: () => accessJourneyApi.list(place.id),
        retry: false,
    });
    const cancel = useMutation({
        mutationFn: accessJourneyApi.cancel,
        onSuccess: () => {
            void client.invalidateQueries({
                queryKey: ["workspace", "visit-authorizations", place.id],
            });
        },
    });

    const records = useMemo(
        () => buildVisitorRecords(query.data?.items ?? []),
        [query.data?.items],
    );
    const counts = {
        expected: records.filter((record) => record.bucket === "expected").length,
        visiting: records.filter((record) => record.bucket === "visiting").length,
        history: records.filter((record) => record.bucket === "history").length,
    };
    const needle = search.trim().toLowerCase();
    const filtered = records
        .filter((record) => record.bucket === tab)
        .filter((record) =>
            needle
                ? [
                      record.name,
                      record.phone ?? "",
                      record.email ?? "",
                      record.inviteId,
                      ...record.history.map((visit) => visit.inviteId),
                  ]
                      .join(" ")
                      .toLowerCase()
                      .includes(needle)
                : true,
        )
        .sort(
            (left, right) =>
                new Date(right.lastVisitAt).getTime() - new Date(left.lastVisitAt).getTime(),
        );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
    const selected =
        filtered.find((record) => record.key === selectedKey) ?? pageRows[0];

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
            <div className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--vms-line)] p-4">
                    <label className="relative flex min-h-10 flex-1 items-center">
                        <span className="sr-only">Search visitors</span>
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
                            placeholder="Search by name, phone, email, invitation ID or suffix…"
                            className="min-h-10 w-full rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] pl-9 pr-3 text-sm text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                        />
                    </label>
                    <Button asChild>
                        <Link href={`/workspace/${place.id}/invitations`}>
                            <Plus aria-hidden className="h-4 w-4" />
                            Invite visitor
                        </Link>
                    </Button>
                </div>

                <div className="px-4">
                    <Tabs<VisitorBucket>
                        label="Visitor status"
                        value={tab}
                        onChange={(value) => {
                            setTab(value);
                            setPage(1);
                        }}
                        tabs={[
                            { value: "expected", label: "Expected", count: counts.expected },
                            {
                                value: "visiting",
                                label: "Currently visiting",
                                count: counts.visiting,
                            },
                            { value: "history", label: "History", count: counts.history },
                        ]}
                    />
                </div>

                {query.isError ? (
                    <div
                        role="alert"
                        className="m-4 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2.5 text-sm text-[var(--vms-danger)]"
                    >
                        {parseApiError(query.error).message}
                    </div>
                ) : query.isPending ? (
                    <div className="space-y-3 p-4" role="status" aria-busy="true">
                        <span className="sr-only">Loading visitors</span>
                        {[0, 1, 2, 3].map((row) => (
                            <div
                                key={row}
                                className="h-12 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
                            />
                        ))}
                    </div>
                ) : pageRows.length === 0 ? (
                    <div className="p-4">
                        <EmptyRow
                            icon={Users}
                            title={search ? "No visitors match your search" : "No visitors yet"}
                            description={
                                search
                                    ? "Try a different name, phone number, invitation ID or suffix."
                                    : "Invite a visitor and they will appear here."
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto px-4 pb-2">
                        <table className="w-full min-w-[40rem] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-[var(--vms-line)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                    <th scope="col" className="py-2.5 pr-3 font-semibold">Visitor</th>
                                    <th scope="col" className="py-2.5 pr-3 font-semibold">Most recent visit</th>
                                    <th scope="col" className="py-2.5 pr-3 font-semibold">Invitations</th>
                                    <th scope="col" className="py-2.5 pr-3 font-semibold">Access status</th>
                                    <th scope="col" className="py-2.5 font-semibold">Host</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((record) => {
                                    const status = accessStatus(record.bucket, record.history[0]?.status ?? "approved");
                                    const active = selected?.key === record.key;
                                    return (
                                        <tr
                                            key={record.key}
                                            className={cn(
                                                "cursor-pointer border-b border-[var(--vms-line)] align-top transition last:border-b-0",
                                                active ? "bg-[var(--coral-soft,rgba(255,107,74,0.08))]" : "hover:bg-[var(--vms-surface-subtle)]",
                                            )}
                                            onClick={() => {
                                                setSelectedKey(record.key);
                                                if (!hasSidebar) setDetailsOpen(true);
                                            }}
                                        >
                                            <td className="py-3 pr-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar name={record.name} size="md" tone="ink" decorative />
                                                    <div className="min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSelectedKey(record.key);
                                                                setDetailsOpen(true);
                                                            }}
                                                            className="block truncate text-left text-sm font-semibold text-[var(--vms-ink)] hover:underline"
                                                        >
                                                            {record.name}
                                                        </button>
                                                        <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                                                            {record.phone || record.email || "No contact details"}
                                                        </p>
                                                        <p className="mt-0.5 font-mono text-[10px] text-[var(--vms-ink-muted)]">
                                                            {record.inviteId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-3 text-sm text-[var(--vms-ink)]">
                                                {day(record.lastVisitAt)}
                                                <span className="block text-xs text-[var(--vms-ink-muted)]">
                                                    {time(record.lastVisitAt)}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-3 text-sm tabular-nums text-[var(--vms-ink)]">
                                                {record.invitationCount}
                                            </td>
                                            <td className="py-3 pr-3">
                                                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                                            </td>
                                            <td className="py-3 text-sm text-[var(--vms-ink)]">
                                                {record.host || party.display_name}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vms-line)] px-4 py-3">
                    <p className="text-xs text-[var(--vms-ink-muted)]">
                        {filtered.length
                            ? `Showing ${pageStart + 1}–${pageStart + pageRows.length} of ${filtered.length} visitors`
                            : "No visitors to show"}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--vms-line)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
                        >
                            <ChevronLeft aria-hidden className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1)
                            .slice(0, 4)
                            .map((number) => (
                                <button
                                    key={number}
                                    type="button"
                                    onClick={() => setPage(number)}
                                    aria-current={number === currentPage ? "page" : undefined}
                                    className={cn(
                                        "grid h-8 min-w-8 place-items-center rounded-md border px-2 text-xs font-semibold transition",
                                        number === currentPage
                                            ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                            : "border-[var(--vms-line)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
                                    )}
                                >
                                    {number}
                                </button>
                            ))}
                        <button
                            type="button"
                            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Next page"
                            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--vms-line)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
                        >
                            <ChevronRight aria-hidden className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <aside className="hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] xl:sticky xl:top-20 xl:block">
                {selected ? (
                    <div className="divide-y divide-[var(--vms-line)]">
                        <div className="flex items-start gap-3 p-4">
                            <Avatar name={selected.name} size="lg" tone="ink" decorative />
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold tracking-[-0.01em] text-[var(--vms-ink)]">
                                    {selected.name}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <StatusBadge
                                        tone={accessStatus(selected.bucket, selected.history[0]?.status ?? "approved").tone}
                                    >
                                        {accessStatus(selected.bucket, selected.history[0]?.status ?? "approved").label}
                                    </StatusBadge>
                                    <span className="rounded-full border border-[var(--vms-line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-ink-muted)]">
                                        {selected.invitationCount} invitation
                                        {selected.invitationCount === 1 ? "" : "s"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <dl className="space-y-2.5 p-4 text-sm">
                            <div className="flex items-start gap-2">
                                <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                <dd className="min-w-0 break-words text-[var(--vms-ink)]">
                                    {selected.phone || "No phone number"}
                                </dd>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                <dd className="min-w-0 break-words text-[var(--vms-ink)]">
                                    {selected.email || "No email address"}
                                </dd>
                            </div>
                            <div className="flex items-start gap-2">
                                <UserRound aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                <dd className="min-w-0 text-[var(--vms-ink)]">
                                    Visitor · hosted by {selected.host || party.display_name}
                                </dd>
                            </div>
                            <div className="flex items-start gap-2">
                                <CalendarClock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                <dd className="min-w-0 text-[var(--vms-ink)]">
                                    Last visit {day(selected.lastVisitAt)} · {time(selected.lastVisitAt)}
                                </dd>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                <dd className="min-w-0 text-[var(--vms-ink)]">{place.name}</dd>
                            </div>
                        </dl>

                        <div className="p-4">
                            <h3 className="mb-3 text-sm font-semibold text-[var(--vms-ink)]">
                                Visit history
                            </h3>
                            <ol className="space-y-3">
                                {selected.history.slice(0, 6).map((visit) => {
                                    const status = accessStatus(
                                        bucketFrom(visit.status, visit.to, visit.onSite),
                                        visit.status,
                                    );
                                    const open = ["approved", "requested"].includes(visit.status);
                                    return (
                                        <li key={visit.id} className="flex items-start gap-2.5">
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                                                    status.tone === "success"
                                                        ? "border-[var(--vms-success)] text-[var(--vms-success)]"
                                                        : status.tone === "danger"
                                                            ? "border-[var(--vms-danger)] text-[var(--vms-danger)]"
                                                            : "border-[var(--vms-line-strong)] text-[var(--vms-ink-muted)]",
                                                )}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[var(--vms-ink)]">
                                                    {status.label}
                                                </p>
                                                <p className="text-[11px] text-[var(--vms-ink-muted)]">
                                                    {day(visit.from)} · {time(visit.from)}
                                                </p>
                                                <p className="font-mono text-[10px] text-[var(--vms-ink-muted)]">
                                                    {visit.inviteId}
                                                </p>
                                                {open ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCancelling(visit.id)}
                                                        className="mt-1 text-[11px] font-semibold text-[var(--vms-danger)] hover:underline"
                                                    >
                                                        Cancel invitation
                                                    </button>
                                                ) : null}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <div className="p-4">
                            <Button asChild className="w-full">
                                <Link href={`/workspace/${place.id}/invitations`}>
                                    <Plus aria-hidden className="h-4 w-4" />
                                    Invite again
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <EmptyRow
                            icon={UserRound}
                            title="No visitor selected"
                            description="Pick a visitor to see contact details and visit history."
                        />
                    </div>
                )}
            </aside>

            {hasSidebar ? null : (
              <Drawer
                    isOpen={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    title="Visitor details"
                    description="Contact details and visit history"
                    side="right"
                >
                    {selected ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar name={selected.name} size="lg" tone="ink" decorative />
                                <div className="min-w-0">
                                    <p className="truncate text-base font-semibold text-[var(--vms-ink)]">
                                        {selected.name}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <StatusBadge
                                            tone={
                                                accessStatus(
                                                    selected.bucket,
                                                    selected.history[0]?.status ?? "approved",
                                                ).tone
                                            }
                                        >
                                            {
                                                accessStatus(
                                                    selected.bucket,
                                                    selected.history[0]?.status ?? "approved",
                                                ).label
                                            }
                                        </StatusBadge>
                                        <span className="rounded-full border border-[var(--vms-line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-ink-muted)]">
                                            {selected.invitationCount} invitation
                                            {selected.invitationCount === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <dl className="space-y-2.5 text-sm">
                                <div className="flex items-start gap-2">
                                    <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                    <dd className="min-w-0 break-words">
                                        {selected.phone || "No phone number"}
                                    </dd>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                    <dd className="min-w-0 break-words">
                                        {selected.email || "No email address"}
                                    </dd>
                                </div>
                                <div className="flex items-start gap-2">
                                    <UserRound aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                    <dd className="min-w-0">
                                        Visitor · hosted by {selected.host || party.display_name}
                                    </dd>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CalendarClock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                    <dd className="min-w-0">
                                        Last visit {day(selected.lastVisitAt)} ·{" "}
                                        {time(selected.lastVisitAt)}
                                    </dd>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]" />
                                    <dd className="min-w-0">{place.name}</dd>
                                </div>
                            </dl>

                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-[var(--vms-ink)]">
                                    Visit history
                                </h3>
                                <ol className="space-y-3">
                                    {selected.history.slice(0, 6).map((visit) => {
                                        const status = accessStatus(
                                            bucketFrom(visit.status, visit.to, visit.onSite),
                                            visit.status,
                                        );
                                        const open = ["approved", "requested"].includes(
                                            visit.status,
                                        );
                                        return (
                                            <li key={visit.id} className="flex items-start gap-2.5">
                                                <span
                                                    aria-hidden
                                                    className={cn(
                                                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                                                        status.tone === "success"
                                                            ? "bg-[var(--vms-success)]"
                                                            : status.tone === "danger"
                                                                ? "bg-[var(--vms-danger)]"
                                                                : "bg-[var(--vms-line-strong)]",
                                                    )}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-[var(--vms-ink)]">
                                                        {status.label}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--vms-ink-muted)]">
                                                        {day(visit.from)} · {time(visit.from)}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-[var(--vms-ink-muted)]">
                                                        {visit.inviteId}
                                                    </p>
                                                    {open ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDetailsOpen(false);
                                                                setCancelling(visit.id);
                                                            }}
                                                            className="mt-1 text-[11px] font-semibold text-[var(--vms-danger)] hover:underline"
                                                        >
                                                            Cancel invitation
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>

                            <Button asChild className="w-full">
                                <Link
                                    href={`/workspace/${place.id}/invitations`}
                                    onClick={() => setDetailsOpen(false)}
                                >
                                    <Plus aria-hidden className="h-4 w-4" />
                                    Invite again
                                </Link>
                            </Button>
                        </div>
                    ) : null}
                </Drawer>
            )}

            <Modal
                isOpen={!!cancelling}
                onClose={() => {
                    if (!cancel.isPending) setCancelling(null);
                }}
                title="Cancel visitor invitation?"
                description="Every guest on this invitation will lose its access."
            >
                <div className="space-y-4 p-5">
                    {cancel.isError ? (
                        <p role="alert">{parseApiError(cancel.error).message}</p>
                    ) : null}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={cancel.isPending}
                            onClick={() => setCancelling(null)}
                        >
                            Keep invitation
                        </Button>
                        <Button
                            isLoading={cancel.isPending}
                            onClick={() =>
                                cancelling &&
                                cancel.mutate(cancelling, {
                                    onSuccess: () => setCancelling(null),
                                })
                            }
                        >
                            Cancel invitation
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
