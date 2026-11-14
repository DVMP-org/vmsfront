"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { format } from "date-fns/format";
import { formatDistanceStrict } from "date-fns/formatDistanceStrict";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import {
  checkpointsApi,
  type AccessEventFilters,
  type Passage,
} from "@/features/checkpoints/api";
import "./passages.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function readable(value?: string | null) {
  return (value || "unknown").replaceAll("_", " ");
}

function initials(value?: string | null) {
  return (
    (value || "Unknown credential")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function journeyKey(event: Passage) {
  return (
    event.visit_authorization_id ||
    event.party_id ||
    `${event.person_name || "unknown"}:${event.occurred_at}`
  );
}

function movementLabel(event: Passage) {
  return event.direction === "entry" ? "Check in" : "Check out";
}

function outcomeVariant(event: Passage) {
  return event.outcome === "allowed" ? "success" : "danger";
}

function stateLabel(event: Passage) {
  return event.state_after || event.state_before || "unknown";
}

function movementTone(event: Passage) {
  if (event.outcome !== "allowed") return "danger";
  const state = stateLabel(event);
  if (state.includes("checked_in")) return "success";
  if (state.includes("out")) return "neutral";
  return "warning";
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="movement-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </label>
  );
}

function JourneyProgress({ events }: { events: Passage[] }) {
  return (
    <div className="movement-progress">
      <p>Movement progress ({events.length} checkpoints)</p>
      <ol>
        {events.map((event, index) => (
          <li key={event.id}>
            <span
              className={cn(
                "movement-progress-node",
                event.outcome !== "allowed" && "is-denied",
              )}
              aria-hidden="true"
            >
              {event.outcome === "allowed" ? <Check /> : <X />}
            </span>
            <strong>{event.gate_name || "Checkpoint"}</strong>
            <time dateTime={event.occurred_at}>
              {format(new Date(event.occurred_at), "HH:mm")}
            </time>
            <Badge variant={movementTone(event)}>
              {readable(stateLabel(event))}
            </Badge>
            {index < events.length - 1 ? (
              <span className="movement-progress-line" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function MovementDetails({
  event,
  journey,
  onClose,
}: {
  event: Passage;
  journey: Passage[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"event" | "audit" | "related">("event");
  const first = journey[0] || event;
  const last = journey.at(-1) || event;
  const duration =
    journey.length > 1
      ? formatDistanceStrict(
          new Date(first.occurred_at),
          new Date(last.occurred_at),
        )
      : "Single checkpoint";

  useEffect(() => {
    setTab("event");
  }, [event.id]);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`${label} could not be copied.`);
    }
  }

  return (
    <>
      <button
        type="button"
        className="movement-detail-scrim"
        aria-label="Close movement details"
        onClick={onClose}
      />
      <aside className="movement-detail" aria-label="Movement details">
        <header className="movement-detail-header">
          <div>
            <p>Movement details</p>
            <h2>{event.person_name || "Unknown credential"}</h2>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Close movement details"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="movement-person">
          <span className="movement-avatar">{initials(event.person_name)}</span>
          <div>
            <strong>{event.person_name || "Unknown credential"}</strong>
            <Badge variant="neutral">{readable(event.subject_type)}</Badge>
            <small>{event.credential_reference || "Credential redacted"}</small>
          </div>
        </div>

        <div className="movement-detail-tabs" role="tablist">
          {(
            [
              ["event", "Event details"],
              ["audit", "Audit trail"],
              ["related", "Related"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="movement-detail-body">
          {tab === "event" ? (
            <>
              <section className="movement-detail-card">
                <dl>
                  <DetailRow
                    label="Movement ID"
                    value={event.id}
                    onCopy={() => copy(event.id, "Movement ID")}
                  />
                  <DetailRow
                    label="Credential"
                    value={event.credential_reference || "Redacted"}
                    hint={readable(event.credential_type)}
                    onCopy={
                      event.credential_reference
                        ? () =>
                            copy(event.credential_reference || "", "Credential")
                        : undefined
                    }
                  />
                  <DetailRow
                    label="Type"
                    value={readable(event.subject_type)}
                  />
                  <DetailRow
                    label="Checkpoint"
                    value={event.gate_name || "Unknown checkpoint"}
                  />
                  <DetailRow
                    label="Destination"
                    value={event.place_name || "Unknown Place"}
                  />
                  <DetailRow label="Direction" value={movementLabel(event)} />
                  <DetailRow
                    label="Access state"
                    value={readable(stateLabel(event))}
                  />
                  <DetailRow label="Result" value={readable(event.outcome)} />
                  <DetailRow
                    label="First seen"
                    value={format(new Date(first.occurred_at), "PPpp")}
                  />
                  <DetailRow
                    label="Last seen"
                    value={format(new Date(last.occurred_at), "PPpp")}
                  />
                  <DetailRow label="Duration" value={duration} />
                  <DetailRow
                    label="Operator"
                    value={event.operator_name || "Device or system"}
                  />
                </dl>
              </section>

              <section className="movement-detail-card">
                <header>
                  <h3>Checkpoint progression</h3>
                  <span>{journey.length} events</span>
                </header>
                <ol className="movement-detail-progress">
                  {journey.map((item) => (
                    <li key={item.id}>
                      <span
                        className={cn(
                          item.outcome === "allowed" ? "allowed" : "denied",
                        )}
                      >
                        {item.outcome === "allowed" ? <Check /> : <X />}
                      </span>
                      <div>
                        <strong>{item.gate_name || "Checkpoint"}</strong>
                        <Badge variant={movementTone(item)}>
                          {readable(stateLabel(item))}
                        </Badge>
                      </div>
                      <time>{format(new Date(item.occurred_at), "HH:mm")}</time>
                    </li>
                  ))}
                </ol>
              </section>

              {event.outcome !== "allowed" ? (
                <section className="movement-denial">
                  <header>
                    <CircleAlert aria-hidden="true" />
                    <h3>Denial information</h3>
                  </header>
                  <dl>
                    <DetailRow
                      label="Reason"
                      value={readable(event.reason_code)}
                    />
                    <DetailRow
                      label="Occurred"
                      value={format(new Date(event.occurred_at), "PPpp")}
                    />
                    <DetailRow
                      label="Credential"
                      value={event.credential_reference || "Redacted"}
                    />
                  </dl>
                </section>
              ) : null}
            </>
          ) : tab === "audit" ? (
            <section className="movement-detail-card">
              <header>
                <h3>Recorded event data</h3>
                <span>Server-generated</span>
              </header>
              <dl>
                <DetailRow
                  label="Recorded"
                  value={format(new Date(event.occurred_at), "PPpp")}
                />
                <DetailRow label="Decision" value={readable(event.outcome)} />
                <DetailRow label="Reason" value={readable(event.reason_code)} />
                <DetailRow
                  label="Operator"
                  value={event.operator_name || "Device or system"}
                />
                <DetailRow
                  label="Idempotency key"
                  value={event.idempotency_key || "Not supplied"}
                />
                <DetailRow
                  label="Device"
                  value={event.device_id || "Not supplied"}
                />
                <DetailRow
                  label="Override"
                  value={event.manual_override ? "Yes" : "No"}
                />
                {event.override_reason ? (
                  <DetailRow
                    label="Override reason"
                    value={event.override_reason}
                  />
                ) : null}
              </dl>
            </section>
          ) : (
            <section className="movement-detail-card">
              <header>
                <h3>Related access records</h3>
                <span>{journey.length} movements</span>
              </header>
              <div className="movement-related-list">
                {journey.map((item) => (
                  <Link key={item.id} href={`/admin/passages/${item.id}`}>
                    <span
                      className={cn(
                        "movement-related-dot",
                        item.outcome !== "allowed" && "is-denied",
                      )}
                    />
                    <div>
                      <strong>{item.gate_name || "Checkpoint"}</strong>
                      <small>
                        {movementLabel(item)} · {readable(item.outcome)} ·{" "}
                        {format(new Date(item.occurred_at), "PP p")}
                      </small>
                    </div>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

function DetailRow({
  label,
  value,
  hint,
  onCopy,
}: {
  label: string;
  value: string;
  hint?: string;
  onCopy?: () => void;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span>
          {value}
          {hint ? <small>{hint}</small> : null}
        </span>
        {onCopy ? (
          <button type="button" aria-label={`Copy ${label}`} onClick={onCopy}>
            <Copy aria-hidden="true" />
          </button>
        ) : null}
      </dd>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof LogIn;
  label: string;
  value: number | string;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <article className="movement-metric">
      <span className={cn("movement-metric-icon", tone)}>
        <Icon aria-hidden="true" />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

export function PassagesDirectory() {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AccessEventFilters>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const dayStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }, []);

  const gates = useQuery({
    queryKey: ["movement-gate-options"],
    queryFn: () => checkpointsApi.gates(1, ""),
    staleTime: 60_000,
  });
  const query = useQuery({
    queryKey: ["access-events", page, pageSize, search, filters],
    queryFn: () =>
      checkpointsApi.accessEvents({
        ...filters,
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        sort: "occurred_at:desc",
      }),
  });
  const presence = useQuery({
    queryKey: ["access-presence", filters.place_id, filters.gate_id],
    queryFn: () =>
      checkpointsApi.presence({
        place_id: filters.place_id,
        gate_id: filters.gate_id,
      }),
  });
  const entriesToday = useQuery({
    queryKey: ["movement-kpi", "entry", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        direction: "entry",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
  });
  const exitsToday = useQuery({
    queryKey: ["movement-kpi", "exit", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        direction: "exit",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
  });
  const deniedToday = useQuery({
    queryKey: ["movement-kpi", "denied", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        outcome: "denied",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
  });

  const events = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const journeys = useMemo(() => {
    const grouped = new Map<string, Passage[]>();
    for (const event of events) {
      const key = journeyKey(event);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    return new Map(
      Array.from(grouped.entries()).map(([key, items]) => [
        key,
        [...items].sort(
          (left, right) =>
            new Date(left.occurred_at).getTime() -
            new Date(right.occurred_at).getTime(),
        ),
      ]),
    );
  }, [events]);
  const selected = events.find((event) => event.id === selectedEventId) ?? null;
  const selectedJourney = selected
    ? journeys.get(journeyKey(selected)) || [selected]
    : [];
  const totalPages = query.data?.total_pages ?? 0;

  function updateFilter(key: keyof AccessEventFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
    setPage(1);
  }

  function updateDate(value: string) {
    if (!value) {
      setFilters((current) => ({
        ...current,
        occurred_from: undefined,
        occurred_to: undefined,
      }));
      return;
    }
    const start = new Date(`${value}T00:00:00`);
    const end = new Date(`${value}T23:59:59.999`);
    setFilters((current) => ({
      ...current,
      occurred_from: start.toISOString(),
      occurred_to: end.toISOString(),
    }));
    setPage(1);
  }

  function exportCsv() {
    const rows = [
      [
        "Time",
        "Person",
        "Type",
        "Credential",
        "Checkpoint",
        "Direction",
        "Access state",
        "Result",
        "Reason",
        "Operator",
      ],
      ...events.map((event) => [
        event.occurred_at,
        event.person_name || "",
        event.subject_type || "",
        event.credential_reference || "",
        event.gate_name || "",
        movementLabel(event),
        readable(stateLabel(event)),
        event.outcome,
        readable(event.reason_code),
        event.operator_name || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "movement-logs.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={cn("movement-page", selected && "has-detail")}>
      <header className="movement-heading">
        <nav aria-label="Breadcrumb">
          <span>Access operations</span>
          <ChevronRight aria-hidden="true" />
          <strong>Movement logs</strong>
        </nav>
        <h1>Movement logs</h1>
        <p>
          Audit entries, exits and checkpoint progress across{" "}
          {selectedSite?.name || "this Site"}.
        </p>
      </header>

      <section className="movement-metrics" aria-label="Movement summary">
        <Metric
          icon={LogIn}
          label="Entries today"
          value={entriesToday.data?.total ?? "—"}
          tone="success"
        />
        <Metric
          icon={LogOut}
          label="Exits today"
          value={exitsToday.data?.total ?? "—"}
          tone="neutral"
        />
        <Metric
          icon={UsersRound}
          label="Currently on site"
          value={presence.data?.total ?? "—"}
          tone="warning"
        />
        <Metric
          icon={ShieldCheck}
          label="Denied attempts"
          value={deniedToday.data?.total ?? "—"}
          tone="danger"
        />
      </section>

      <section className="movement-register">
        <div className="movement-toolbar">
          <form
            className="movement-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, credential or checkpoint..."
              maxLength={100}
            />
            <button type="submit">Search</button>
          </form>
          <Button variant="outline" onClick={exportCsv}>
            <Download aria-hidden="true" />
            Export
          </Button>
        </div>

        <div className="movement-filters">
          <FilterSelect
            label="Person"
            value={filters.subject_type || ""}
            onChange={(value) => updateFilter("subject_type", value)}
            options={[
              { value: "", label: "All people" },
              { value: "visitor", label: "Visitors" },
              { value: "party", label: "Registered Parties" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
          <FilterSelect
            label="Credential"
            value={filters.credential_type || ""}
            onChange={(value) => updateFilter("credential_type", value)}
            options={[
              { value: "", label: "All credentials" },
              { value: "invitation_qr", label: "Invitation QR" },
              { value: "badge_qr", label: "Badge QR" },
              { value: "permanent_code", label: "Permanent code" },
            ]}
          />
          <FilterSelect
            label="Checkpoint"
            value={filters.gate_id || ""}
            onChange={(value) => updateFilter("gate_id", value)}
            options={[
              { value: "", label: "All checkpoints" },
              ...(gates.data?.items ?? []).map((gate) => ({
                value: gate.id,
                label: gate.name,
              })),
            ]}
          />
          <FilterSelect
            label="Direction"
            value={filters.direction || ""}
            onChange={(value) => updateFilter("direction", value)}
            options={[
              { value: "", label: "All directions" },
              { value: "entry", label: "Check in" },
              { value: "exit", label: "Check out" },
            ]}
          />
          <FilterSelect
            label="Result"
            value={filters.outcome || ""}
            onChange={(value) => updateFilter("outcome", value)}
            options={[
              { value: "", label: "All results" },
              { value: "allowed", label: "Granted" },
              { value: "denied", label: "Denied" },
            ]}
          />
          <label className="movement-date">
            <span>Date range</span>
            <input
              type="date"
              onChange={(event) => updateDate(event.target.value)}
              aria-label="Movement date"
            />
          </label>
        </div>

        {query.isError && !query.data ? (
          <div className="movement-error" role="alert">
            <p>{parseApiError(query.error).message}</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        <div className="movement-table-scroll">
          <table className="movement-table">
            <thead>
              <tr>
                <th aria-label="Expand movement" />
                <th>Person / Party</th>
                <th>Credential</th>
                <th>Type</th>
                <th>Checkpoint</th>
                <th>Direction</th>
                <th>Access state</th>
                <th>Result</th>
                <th>Timestamp</th>
                <th>Operator</th>
                <th aria-label="Movement details" />
              </tr>
            </thead>
            <tbody>
              {query.isPending ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="movement-skeleton-row">
                    <td colSpan={11}>
                      <span />
                    </td>
                  </tr>
                ))
              ) : events.length ? (
                events.flatMap((event) => {
                  const journey = journeys.get(journeyKey(event)) || [event];
                  // Expand the clicked row only; never every scan that shares
                  // the same invitation or visitor group.
                  const expanded = expandedEventId === event.id;
                  return [
                    <tr
                      key={event.id}
                      data-selected={selectedEventId === event.id}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <td>
                        <button
                          type="button"
                          className="movement-expand"
                          aria-label={`${expanded ? "Collapse" : "Expand"} movement progress for ${event.person_name || "credential"}`}
                          aria-expanded={expanded}
                          onClick={(click) => {
                            click.stopPropagation();
                            setExpandedEventId(expanded ? null : event.id);
                          }}
                        >
                          <ChevronDown
                            className={expanded ? "is-expanded" : undefined}
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td>
                        <span className="movement-person-cell">
                          <span className="movement-avatar">
                            {initials(event.person_name)}
                          </span>
                          <span>
                            <strong>
                              {event.person_name || "Unknown credential"}
                            </strong>
                            <small>{event.place_name || "Unknown Place"}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="movement-credential">
                          <strong>
                            {event.credential_reference || "Redacted"}
                          </strong>
                          <small>{readable(event.credential_type)}</small>
                        </span>
                      </td>
                      <td>
                        <Badge variant="neutral">
                          {readable(event.subject_type)}
                        </Badge>
                      </td>
                      <td>{event.gate_name || "Unknown checkpoint"}</td>
                      <td>
                        <span className="movement-direction">
                          {event.direction === "entry" ? (
                            <LogIn aria-hidden="true" />
                          ) : (
                            <LogOut aria-hidden="true" />
                          )}
                          {movementLabel(event)}
                        </span>
                      </td>
                      <td>
                        <Badge variant={movementTone(event)}>
                          {readable(stateLabel(event))}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={outcomeVariant(event)}>
                          {event.outcome === "allowed" ? "Granted" : "Denied"}
                        </Badge>
                      </td>
                      <td>
                        <time dateTime={event.occurred_at}>
                          {format(new Date(event.occurred_at), "HH:mm")}
                        </time>
                      </td>
                      <td>
                        <span className="movement-operator">
                          {initials(event.operator_name)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/passages/${event.id}`}
                          aria-label={`Open movement ${event.id}`}
                          onClick={(click) => click.stopPropagation()}
                        >
                          <ArrowLeftRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>,
                    expanded ? (
                      <tr
                        key={`${event.id}:progress`}
                        className="movement-progress-row"
                      >
                        <td colSpan={11}>
                          <JourneyProgress events={journey} />
                        </td>
                      </tr>
                    ) : null,
                  ].filter(Boolean);
                })
              ) : (
                <tr>
                  <td colSpan={11} className="movement-empty">
                    <ShieldCheck aria-hidden="true" />
                    <strong>No movements match these filters</strong>
                    <span>Adjust the search, checkpoint or date range.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="movement-pagination">
          <p>
            Showing {events.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, query.data?.total ?? 0)} of{" "}
            {query.data?.total ?? 0} movements
          </p>
          <div>
            <label>
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span>
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </footer>
      </section>

      {selected ? (
        <MovementDetails
          event={selected}
          journey={selectedJourney}
          onClose={() => setSelectedEventId(null)}
        />
      ) : null}
    </main>
  );
}
