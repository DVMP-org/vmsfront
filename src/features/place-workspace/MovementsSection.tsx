"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Route,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { placeWorkspaceApi, type Movement } from "./api";
import { usePlaceWorkspace } from "./PlaceWorkspaceShell";
import { EmptyRow } from "./ui";

type Audience = "my_access" | "my_visitors";
type RangeFilter = "all" | "today" | "week" | "month";

interface VisitorJourney {
  key: string;
  personName: string;
  credential: string;
  credentialReference: string;
  gatePath: string[];
  movements: Movement[];
  latest: Movement;
  lastAt: string;
  minutes: number;
  scans: number;
}

const day = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const dayTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const clock = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

function movementStatus(movement: Movement) {
  if (movement.outcome !== "allowed")
    return { label: "Denied", tone: "danger" as StatusTone };
  return movement.direction === "entry"
    ? { label: "Checked in", tone: "success" as StatusTone }
    : { label: "Checked out", tone: "success" as StatusTone };
}

function credentialLabel(movement: Movement) {
  const type = (movement.credential_type ?? "").toLowerCase();
  if (type.includes("badge")) return "Permanent badge";
  if (type.includes("invitation") || movement.invitation_code) return "Invitation";
  if (type.includes("permanent")) return "Permanent code";
  return movement.invitation_code ? "Invitation" : "Credential";
}

function withinRange(movement: Movement, range: RangeFilter) {
  if (range === "all") return true;
  const occurred = new Date(movement.occurred_at).getTime();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "today") return occurred >= start.getTime();
  const days = range === "week" ? 7 : 30;
  return occurred >= Date.now() - days * 86_400_000;
}

/** Search the visitor as a whole: name, every checkpoint, credential and ID. */
function searchable(movement: Movement) {
  return [
    movement.person_name ?? "",
    movement.gate_name,
    movement.credential_reference ?? "",
    movement.credential_type ?? "",
    movement.invitation_code ?? "",
    movement.guest_suffix ?? "",
    movement.invitation_code && movement.guest_suffix
      ? `${movement.invitation_code}-${movement.guest_suffix}`
      : "",
    movement.reason_code,
  ]
    .join(" ")
    .toLowerCase();
}

export function buildVisitorJourneys(
  items: Movement[],
  {
    audience,
    range,
    needle,
  }: { audience: Audience; range: RangeFilter; needle: string },
): VisitorJourney[] {
  const groups = new Map<string, Movement[]>();
  for (const movement of items) {
    const isVisitor = movement.subject_type === "visitor";
    if (audience === "my_visitors" ? !isVisitor : isVisitor) continue;
    if (!withinRange(movement, range)) continue;
    if (needle && !searchable(movement).includes(needle)) continue;
    const key = movement.subject_key ?? movement.id;
    groups.set(key, [...(groups.get(key) ?? []), movement]);
  }

  return Array.from(groups.entries())
    .map(([key, movements]) => {
      const ordered = movements
        .slice()
        .sort(
          (left, right) =>
            new Date(left.occurred_at).getTime() -
            new Date(right.occurred_at).getTime(),
        );
      const latest = ordered[ordered.length - 1];
      const first = ordered[0];
      const reference =
        latest.invitation_code && latest.guest_suffix
          ? `${latest.invitation_code}-${latest.guest_suffix}`
          : latest.credential_reference ?? "";
      return {
        key,
        personName: latest.person_name || "Visitor",
        credential: credentialLabel(latest),
        credentialReference: reference,
        gatePath: Array.from(
          new Set(ordered.map((movement) => movement.gate_name)),
        ),
        movements: ordered,
        latest,
        lastAt: latest.occurred_at,
        minutes: Math.max(
          0,
          Math.round(
            (new Date(latest.occurred_at).getTime() -
              new Date(first.occurred_at).getTime()) /
              60_000,
          ),
        ),
        scans: ordered.length,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.lastAt).getTime() - new Date(left.lastAt).getTime(),
    );
}

export function MovementsSection() {
  const { place, party } = usePlaceWorkspace();
  const [audience, setAudience] = useState<Audience>("my_visitors");
  const [range, setRange] = useState<RangeFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // The details sidebar is only visible from xl up, so the drawer must not
  // mount on those screens or the same record appears twice.
  const hasSidebar = useMediaQuery("(min-width: 1280px)");

  const query = useQuery({
    queryKey: ["place-movements", place.id, party.id, page],
    queryFn: () => placeWorkspaceApi.movements(place.id, page),
    retry: false,
  });
  const needle = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      buildVisitorJourneys(query.data?.items ?? [], {
        audience,
        range,
        needle,
      }),
    [query.data?.items, audience, range, needle],
  );

  const selected = rows.find((row) => row.key === selectedKey) ?? rows[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
      <div className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--vms-line)] p-4">
          <div
            role="group"
            aria-label="Movement audience"
            className="inline-flex rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-0.5"
          >
            {(
              [
                ["my_access", "My access"],
                ["my_visitors", "My visitors"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={audience === value}
                onClick={() => {
                  setAudience(value);
                  setSelectedKey(null);
                  setExpanded(null);
                }}
                className={cn(
                  "min-h-9 rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                  audience === value
                    ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                    : "text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Date range</span>
            <CalendarClock aria-hidden className="h-4 w-4 text-[var(--vms-ink-muted)]" />
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RangeFilter)}
              className="min-h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </label>
          <label className="relative flex min-h-10 flex-1 items-center sm:max-w-xs">
            <span className="sr-only">Search visitors</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--vms-ink-muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, checkpoint or ID"
              className="min-h-10 w-full rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] pl-9 pr-3 text-sm text-[var(--vms-ink)] transition hover:border-[var(--vms-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            />
          </label>
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
            <span className="sr-only">Loading movements</span>
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-11 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyRow
              icon={Clock3}
              title="No movement recorded"
              description={
                audience === "my_visitors"
                  ? "Your visitors' checkpoint activity will appear here."
                  : "Your own entries and exits will appear here."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4 pb-2">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--vms-line)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                  <th scope="col" className="w-8 py-2.5" />
                  <th scope="col" className="py-2.5 pr-3 font-semibold">Visitor</th>
                  <th scope="col" className="py-2.5 pr-3 font-semibold">Journey</th>
                  <th scope="col" className="py-2.5 pr-3 font-semibold">Scans</th>
                  <th scope="col" className="py-2.5 pr-3 font-semibold">Latest</th>
                  <th scope="col" className="py-2.5 font-semibold">Last scan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = movementStatus(row.latest);
                  const open = expanded === row.key;
                  const active = selected?.key === row.key;
                  return [
                    <tr
                      key={row.key}
                      onClick={() => {
                        setSelectedKey(row.key);
                        if (!hasSidebar) setDetailsOpen(true);
                      }}
                      className={cn(
                        "cursor-pointer border-b border-[var(--vms-line)] align-middle transition",
                        active
                          ? "bg-[var(--coral-soft,rgba(255,107,74,0.08))]"
                          : "hover:bg-[var(--vms-surface-subtle)]",
                      )}
                    >
                      <td className="py-3 pl-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedKey(row.key);
                            setExpanded(open ? null : row.key);
                          }}
                          aria-expanded={open}
                          aria-label={`${open ? "Collapse" : "Expand"} visitor journey`}
                          className="grid h-6 w-6 place-items-center rounded text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)]"
                        >
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              open && "rotate-90",
                            )}
                          />
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={row.personName}
                            size="sm"
                            tone="ink"
                            decorative
                          />
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[var(--vms-ink)]">
                              {row.personName}
                            </span>
                            <span className="block truncate font-mono text-[10px] text-[var(--vms-ink-muted)]">
                              {row.credentialReference || row.credential}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--vms-ink)]">
                          <Route
                            aria-hidden
                            className="h-3.5 w-3.5 shrink-0 text-[var(--vms-ink-muted)]"
                          />
                          <span className="truncate">
                            {row.gatePath.join(" → ")}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-sm tabular-nums text-[var(--vms-ink)]">
                        {row.scans}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={status.tone}>
                            {status.label}
                          </StatusBadge>
                          <span className="text-xs text-[var(--vms-ink-muted)]">
                            {row.latest.gate_name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-3 text-xs text-[var(--vms-ink-muted)]">
                        {dayTime(row.lastAt)}
                      </td>
                    </tr>,
                    open ? (
                      <tr
                        key={`${row.key}-journey`}
                        className="border-b border-[var(--vms-line)]"
                      >
                        <td />
                        <td colSpan={5} className="py-3 pr-3">
                          <div className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3">
                            <p className="mb-2 text-xs font-semibold text-[var(--vms-ink)]">
                              Visitor journey · {row.scans} scan
                              {row.scans === 1 ? "" : "s"}
                            </p>
                            <ol className="space-y-2">
                              {row.movements.map((event) => {
                                const eventStatus = movementStatus(event);
                                return (
                                  <li
                                    key={event.id}
                                    className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3"
                                  >
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "h-2 w-2 rounded-full",
                                        eventStatus.tone === "success"
                                          ? "bg-[var(--vms-success)]"
                                          : "bg-[var(--vms-danger)]",
                                      )}
                                    />
                                    <span className="truncate text-xs text-[var(--vms-ink)]">
                                      {event.gate_name} —{" "}
                                      {event.direction === "entry"
                                        ? "Entry"
                                        : "Exit"}
                                    </span>
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                      {clock(event.occurred_at)}
                                    </span>
                                    <StatusBadge tone={eventStatus.tone}>
                                      {eventStatus.label}
                                    </StatusBadge>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--vms-line)] px-4 py-3">
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {rows.length
              ? `${rows.length} visitor${rows.length === 1 ? "" : "s"} on this page`
              : "No movements"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="min-h-8 rounded-md border border-[var(--vms-line)] px-2.5 text-xs font-semibold text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-1 text-xs text-[var(--vms-ink-muted)]">
              Page {page}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!(query.data?.has_more ?? false)}
              className="min-h-8 rounded-md border border-[var(--vms-line)] px-2.5 text-xs font-semibold text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] xl:sticky xl:top-20 xl:block">
        <JourneyDetails
          selected={selected}
          placeName={place.name}
          placeId={place.id}
        />
      </aside>
      {hasSidebar ? null : (
        <Drawer
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          side="right"
          className="sm:max-w-md"
          title="Visitor journey"
          description="Every checkpoint scan recorded for this visitor."
          contentClassName="p-0"
        >
          <JourneyDetails
            selected={selected}
            placeName={place.name}
            placeId={place.id}
          />
        </Drawer>
      )}
    </div>
  );
}

function JourneyDetails({
  selected,
  placeName,
  placeId,
}: {
  selected: VisitorJourney | undefined;
  placeName: string;
  placeId: string;
}) {
  if (!selected) {
    return (
      <div className="p-4">
        <EmptyRow
          icon={Clock3}
          title="No visitor selected"
          description="Choose a visitor to see their journey and every scan."
        />
      </div>
    );
  }
  const status = movementStatus(selected.latest);
  return (
    <div className="divide-y divide-[var(--vms-line)]">
      <div className="p-4">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--vms-ink)]">
          Visitor journey
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={selected.personName} size="lg" tone="ink" decorative />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
              {selected.personName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[var(--vms-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-ink-muted)]">
                {selected.credential}
              </span>
              {selected.credentialReference ? (
                <span className="font-mono text-[10px] text-[var(--vms-ink-muted)]">
                  {selected.credentialReference}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <dl className="space-y-2.5 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <ArrowLeftRight aria-hidden className="h-4 w-4" />
            Latest
          </dt>
          <dd className="text-right font-medium text-[var(--vms-ink)]">
            {selected.latest.direction === "entry" ? "Entry" : "Exit"} ·{" "}
            {selected.latest.gate_name}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <MapPin aria-hidden className="h-4 w-4" />
            Destination
          </dt>
          <dd className="max-w-[10rem] text-right text-[var(--vms-ink)]">
            {selected.latest.place_name || placeName}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <Route aria-hidden className="h-4 w-4" />
            Checkpoints
          </dt>
          <dd className="max-w-[10rem] text-right text-[var(--vms-ink)]">
            {selected.gatePath.join(", ")}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <ShieldCheck aria-hidden className="h-4 w-4" />
            Result
          </dt>
          <dd className="text-right">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <CalendarClock aria-hidden className="h-4 w-4" />
            Last scan
          </dt>
          <dd className="text-right text-[var(--vms-ink)]">
            {day(selected.lastAt)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <Clock3 aria-hidden className="h-4 w-4" />
            Journey duration
          </dt>
          <dd className="text-right text-[var(--vms-ink)]">
            {selected.minutes > 0
              ? `${Math.floor(selected.minutes / 60)} h ${selected.minutes % 60} min`
              : "—"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
            <Route aria-hidden className="h-4 w-4" />
            Scans
          </dt>
          <dd className="text-right text-[var(--vms-ink)]">{selected.scans}</dd>
        </div>
      </dl>

      <div className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--vms-ink)]">
          Scan timeline
        </h3>
        <ol className="space-y-3">
          {selected.movements.map((event) => {
            const eventStatus = movementStatus(event);
            return (
              <li key={event.id} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2",
                    eventStatus.tone === "success"
                      ? "bg-[var(--vms-success)] ring-[var(--vms-success-subtle)]"
                      : "bg-[var(--vms-danger)] ring-[var(--vms-danger-subtle)]",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--vms-ink)]">
                    {event.gate_name} —{" "}
                    {event.direction === "entry" ? "Entry" : "Exit"}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--vms-ink-muted)]">
                      {clock(event.occurred_at)}
                    </span>
                    <StatusBadge tone={eventStatus.tone}>
                      {eventStatus.label}
                    </StatusBadge>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {selected.latest.subject_type !== "visitor" ? (
        <div className="p-4 text-xs text-[var(--vms-ink-muted)]">
          Your own access record at {placeName}
        </div>
      ) : null}

      <div className="p-4">
        <Link
          href={`/workspace/${placeId}/movements/${encodeURIComponent(selected.key)}`}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 text-sm font-semibold text-[var(--vms-on-action)] transition hover:bg-[var(--vms-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          More details
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
