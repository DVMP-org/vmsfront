"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { contextApi } from "@/features/context/api";
import { hospitalityApi } from "@/features/hospitality/api";
import { HospitalityModuleNav } from "@/features/hospitality/HospitalityModuleNav";
import { HotelAdministrationSummary } from "@/features/hospitality/HotelAdministrationSummary";
import { hospitalityPeopleApi } from "@/features/hospitality/people-api";
import {
  guestName,
  interval,
  localInput,
  Stay,
  statusLabel,
} from "@/features/hospitality/contracts";
import "@/app/admin/hospitality/styles.css";

export default function HospitalityOverview() {
  const organization = useAppStore((s) => s.organization);
  const selectedSite = useAppStore((s) => s.selectedSite);
  const user = useAuthStore((s) => s.user);
  const context = `${organization?.id}:${user?.id}`;
  return (
    <HospitalityWorkspace
      key={context}
      context={context}
      enabled={!!organization?.id && !!user?.id}
      propertyId={selectedSite?.id}
      propertyName={selectedSite?.name}
    />
  );
}
function HospitalityWorkspace({
  context,
  enabled,
  propertyId,
  propertyName,
}: {
  context: string;
  enabled: boolean;
  propertyId?: string;
  propertyName?: string;
}) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const profile = useQuery({
    queryKey: ["hospitality-profile", context],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const allowed = (action: string) =>
    profile.isFetchedAfterMount &&
    !profile.isError &&
    hasAdminPermission(profile.data, `hospitality_stays.${action}`);
  const list = useQuery({
    queryKey: ["hospitality", context, "list", page, status],
    queryFn: () => hospitalityApi.list(page, status),
    enabled: allowed("list"),
  });
  const detail = useQuery({
    queryKey: ["hospitality", context, "detail", selected],
    queryFn: () => hospitalityApi.get(selected!),
    enabled: !!selected && allowed("show"),
  });
  const people = useQuery({
    queryKey: ["hospitality", context, "people"],
    queryFn: hospitalityPeopleApi.list,
    enabled: allowed("list"),
  });
  const workspaceContext = useQuery({
    queryKey: ["hospitality", context, "workspace-context", propertyId],
    queryFn: () => contextApi.workspace(propertyId!),
    enabled: enabled && !!propertyId && allowed("list"),
    retry: false,
  });
  const changed = async (stay: Stay, message: string) => {
    setSelected(stay.id);
    setCreating(false);
    setNotice(message);
    client.setQueryData(["hospitality", context, "detail", stay.id], stay);
    await client.invalidateQueries({ queryKey: ["hospitality", context] });
  };
  if (!enabled || profile.isPending || !profile.isFetchedAfterMount)
    return <p role="status">Loading hospitality permissions…</p>;
  if (profile.isError)
    return (
      <div
        role="alert"
        className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-ink)]"
      >
        <p>Could not verify your hospitality permissions.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => profile.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  if (!allowed("list"))
    return (
      <p role="alert">You do not have permission to view hospitality stays.</p>
    );
  const stayColumns: Column<Stay>[] = [
    {
      key: "guest",
      header: "Guest",
      sortable: true,
      accessor: (stay) => (
        <div className="min-w-0">
          <strong className="block truncate text-sm">{guestName(stay)}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {stay.guests.length} guest{stay.guests.length === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "planned_check_in",
      header: "Stay",
      sortable: true,
      accessor: (stay) => (
        <span className="text-sm">
          {new Date(stay.planned_check_in).toLocaleDateString()} →{" "}
          {new Date(stay.planned_check_out).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      accessor: (stay) => (
        <span className="text-sm text-[var(--vms-ink-muted)]">
          {stay.room_assignments.at(-1)?.room.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (stay) => (
        <span className={`stay-status ${stay.status}`}>
          {statusLabel(stay.status)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (stay) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={!allowed("show")}
          aria-label={`Review stay for ${guestName(stay)}`}
          onClick={() => {
            setSelected(stay.id);
            setCreating(false);
            setNotice("");
          }}
        >
          Review stay
        </Button>
      ),
    },
  ];
  const stayBulkActions: BulkAction[] = [
    {
      label: "Export selected",
      icon: Download,
      onClick: (ids) => {
        const selectedStays =
          list.data?.items.filter((stay) => ids.includes(stay.id)) ?? [];
        const rows = [
          ["Guest", "Check in", "Check out", "Room", "Status"],
          ...selectedStays.map((stay) => [
            guestName(stay),
            new Date(stay.planned_check_in).toISOString(),
            new Date(stay.planned_check_out).toISOString(),
            stay.room_assignments.at(-1)?.room.name || "",
            statusLabel(stay.status),
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
        anchor.download = "hospitality-stays.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    },
  ];
  return (
    <main className="stay-workspace">
      <PageHeader
        eyebrow="Operations Hub / Hospitality"
        title="Hotel operations"
        description={
          propertyName
            ? `Manage ${propertyName}, its people, room assignments, stays and guest arrivals.`
            : "Manage the selected site, its people, room assignments, stays and guest arrivals."
        }
        primaryAction={
          allowed("create") ? (
            <Button
              onClick={() => {
                setCreating(true);
                setSelected(null);
                setNotice("");
              }}
            >
              New reservation
            </Button>
          ) : null
        }
      />
      <div className="mt-4">
        <HospitalityModuleNav />
      </div>
      {notice && (
        <p role="status" className="stay-notice">
          {notice}
        </p>
      )}
      {!list.isPending ? (
        <HotelAdministrationSummary
          administrators={
            workspaceContext.data?.management?.administrators || []
          }
          authorityMode={workspaceContext.data?.management?.mode}
          authoritativePlaceName={
            workspaceContext.data?.management?.authoritative_site?.name
          }
          relationships={people.data?.items || []}
          stays={list.data?.items || []}
          loading={
            people.isPending || (!!propertyId && workspaceContext.isPending)
          }
          error={
            people.isError
              ? parseApiError(people.error).message
              : workspaceContext.isError
                ? parseApiError(workspaceContext.error).message
                : null
          }
          onRetry={() => people.refetch()}
          onOpenStay={(id) => {
            setSelected(id);
            setCreating(false);
            setNotice("");
          }}
        />
      ) : null}
      <div className="stay-layout">
        <section className="stay-panel" aria-label="Stay list">
          <div className="stay-list-heading">
            <h2>Reservations</h2>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {[
                  "reserved",
                  "checked_in",
                  "checked_out",
                  "cancelled",
                  "no_show",
                ].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataTable
            data={list.data?.items ?? []}
            columns={stayColumns}
            tableLabel="Hospitality stays"
            searchable={false}
            serverSide
            total={list.data?.total ?? 0}
            currentPage={page}
            onPageChange={setPage}
            pageSize={10}
            pageSizeOptions={[10]}
            isLoading={list.isPending}
            errorMessage={
              list.isError && !list.data
                ? parseApiError(list.error).message
                : undefined
            }
            isStale={list.isError && !!list.data}
            onRetry={() => list.refetch()}
            emptyMessage={
              status ? "No stays match this status" : "No reservations yet"
            }
            selectable
            getRowId={(stay) => stay.id}
            bulkActions={stayBulkActions}
            mobileSummary={(stay) => (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-sm">{guestName(stay)}</strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      {new Date(stay.planned_check_in).toLocaleDateString()} →{" "}
                      {new Date(stay.planned_check_out).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`stay-status ${stay.status}`}>
                    {statusLabel(stay.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                  {stay.room_assignments.at(-1)?.room.name
                    ? `Room ${stay.room_assignments.at(-1)?.room.name}`
                    : "Room unassigned"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={!allowed("show")}
                  aria-label={`Review stay for ${guestName(stay)}`}
                  onClick={() => {
                    setSelected(stay.id);
                    setCreating(false);
                    setNotice("");
                  }}
                >
                  Review stay
                </Button>
              </div>
            )}
          />
        </section>
        <section
          className="stay-panel stay-detail"
          aria-label="Reservation details"
        >
          {creating && allowed("create") ? (
            <ReservationForm
              context={context}
              siteId={propertyId}
              onCancel={() => setCreating(false)}
              onSaved={(s) => changed(s, "Reservation created.")}
            />
          ) : selected && allowed("show") ? (
            detail.isPending ? (
              <p role="status">Loading reservation…</p>
            ) : detail.isError ? (
              <div role="alert">
                {parseApiError(detail.error).message}
                <button onClick={() => detail.refetch()}>Retry details</button>
              </div>
            ) : detail.data ? (
              <StayDetail
                key={`${detail.data.id}:${detail.data.planned_check_in}:${detail.data.planned_check_out}:${detail.data.status}`}
                stay={detail.data}
                context={context}
                allowed={allowed}
                onSaved={changed}
              />
            ) : null
          ) : (
            <div className="stay-empty">
              <h2>Every arrival, in context</h2>
              <p>
                Select a reservation to review its guests, room history and next
                action.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function ReservationForm({
  context,
  siteId,
  onSaved,
  onCancel,
}: {
  context: string;
  siteId?: string;
  onSaved: (stay: Stay) => void;
  onCancel: () => void;
}) {
  const [guest, setGuest] = useState<FacetItem | null>(null);
  const [room, setRoom] = useState<FacetItem | null>(null);
  const [additional, setAdditional] = useState<FacetItem[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [validation, setValidation] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error("Select a Site first.");
      if (!guest) throw new Error("Choose a primary guest.");
      return hospitalityApi.create({
        site_id: siteId,
        ...interval(start, end),
        primary_guest_party_id: guest.value,
        additional_guest_party_ids: additional
          .filter((p) => p.value !== guest.value)
          .map((p) => p.value),
        room_place_id: room?.value || null,
        notes,
      });
    },
    onSuccess: onSaved,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      interval(start, end);
      if (!guest) throw new Error("Choose a primary guest.");
      setValidation("");
      mutation.mutate();
    } catch (error) {
      setValidation((error as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <h2>New reservation</h2>
      <p className="stay-muted">
        Dates use this device’s timezone:{" "}
        {Intl.DateTimeFormat().resolvedOptions().timeZone}.
      </p>
      <fieldset disabled={mutation.isPending}>
        <FacetPicker
          contextKey={context}
          facet="parties"
          kind="person"
          label="Primary guest"
          value={guest}
          onChange={setGuest}
        />
        <FacetPicker
          contextKey={context}
          facet="parties"
          kind="person"
          label="Additional guest"
          value={null}
          onChange={(item) => {
            if (
              item &&
              item.value !== guest?.value &&
              !additional.some((p) => p.value === item.value)
            )
              setAdditional([...additional, item]);
          }}
        />
        {additional.map((item) => (
          <p key={item.value}>
            {item.label}
            <button
              type="button"
              onClick={() =>
                setAdditional(additional.filter((p) => p.value !== item.value))
              }
            >
              Remove
            </button>
          </p>
        ))}
        <DateFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <FacetPicker
          contextKey={context}
          facet="places"
          kind="room"
          label="Room (optional)"
          value={room}
          onChange={setRoom}
        />
        <label>
          Reservation notes
          <textarea
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </fieldset>
      {(validation || mutation.isError) && (
        <p role="alert" className="stay-error">
          {validation || parseApiError(mutation.error).message}
        </p>
      )}
      <div className="stay-actions">
        <button type="button" disabled={mutation.isPending} onClick={onCancel}>
          Close
        </button>
        <button className="stay-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create reservation"}
        </button>
      </div>
    </form>
  );
}
function DateFields({
  start,
  end,
  onStart,
  onEnd,
  lockStart = false,
}: {
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  lockStart?: boolean;
}) {
  return (
    <div className="stay-dates">
      <label>
        Planned arrival
        <input
          type="datetime-local"
          required
          disabled={lockStart}
          value={start}
          onChange={(e) => onStart(e.target.value)}
        />
      </label>
      <label>
        Planned departure
        <input
          type="datetime-local"
          required
          value={end}
          onChange={(e) => onEnd(e.target.value)}
        />
      </label>
    </div>
  );
}
function StayDetail({
  stay,
  context,
  allowed,
  onSaved,
}: {
  stay: Stay;
  context: string;
  allowed: (action: string) => boolean;
  onSaved: (stay: Stay, message: string) => void;
}) {
  const [mode, setMode] = useState<"dates" | "room" | null>(null);
  const [start, setStart] = useState(localInput(stay.planned_check_in));
  const [end, setEnd] = useState(localInput(stay.planned_check_out));
  const [notes, setNotes] = useState(stay.notes || "");
  const [room, setRoom] = useState<FacetItem | null>(null);
  const [effective, setEffective] = useState("");
  const [validation, setValidation] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const active = stay.status === "reserved" || stay.status === "checked_in";
  const mutation = useMutation({
    mutationFn: async ({ action, body }: { action: string; body?: unknown }) =>
      action === "update"
        ? hospitalityApi.update(stay.id, body)
        : hospitalityApi.action(stay.id, action, body),
    onSuccess: (s) => {
      setMode(null);
      setConfirm(null);
      onSaved(s, "Reservation updated.");
    },
  });
  function dates(e: FormEvent) {
    e.preventDefault();
    try {
      const dates = interval(start, end);
      setValidation("");
      mutation.mutate({
        action: "update",
        body: {
          ...(stay.status === "reserved"
            ? dates
            : { planned_check_out: dates.planned_check_out }),
          notes,
        },
      });
    } catch (error) {
      setValidation((error as Error).message);
    }
  }
  return (
    <>
      <div className="stay-detail-heading">
        <div>
          <span className={`stay-status ${stay.status}`}>
            {statusLabel(stay.status)}
          </span>
          <h2>{guestName(stay)}</h2>
        </div>
      </div>
      <dl className="stay-facts">
        <div>
          <dt>Planned arrival</dt>
          <dd>{new Date(stay.planned_check_in).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Planned departure</dt>
          <dd>{new Date(stay.planned_check_out).toLocaleString()}</dd>
        </div>
        {stay.actual_check_in && (
          <div>
            <dt>Checked in</dt>
            <dd>{new Date(stay.actual_check_in).toLocaleString()}</dd>
          </div>
        )}
        {stay.actual_check_out && (
          <div>
            <dt>Checked out</dt>
            <dd>{new Date(stay.actual_check_out).toLocaleString()}</dd>
          </div>
        )}
      </dl>
      <h3>Guests</h3>
      <ul>
        {stay.guests.map((g) => (
          <li key={g.id}>
            {g.party.display_name} <small>({g.role})</small>
          </li>
        ))}
      </ul>
      {stay.notes && <p className="stay-notes">{stay.notes}</p>}
      <h3>Room history</h3>
      {stay.room_assignments.length ? (
        <ol className="stay-history">
          {stay.room_assignments.map((a) => (
            <li key={a.id}>
              <strong>{a.room.name}</strong>
              <small>
                {new Date(a.assigned_from).toLocaleString()} →{" "}
                {a.assigned_to
                  ? new Date(a.assigned_to).toLocaleString()
                  : "Open"}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="stay-muted">
          No room assigned. Assign one before check-in.
        </p>
      )}
      <div className="stay-actions">
        {allowed("show") ? (
          <Button asChild variant="secondary">
            <Link href={`/admin/hospitality/billing?stay=${stay.id}`}>
              Guest billing
            </Link>
          </Button>
        ) : null}
        {active && allowed("update") && (
          <button
            disabled={mutation.isPending}
            onClick={() => {
              setMode("dates");
              setValidation("");
            }}
          >
            {stay.status === "reserved" ? "Reschedule / edit" : "Extend / edit"}
          </button>
        )}
        {active && allowed("assign_room") && (
          <button
            disabled={mutation.isPending}
            onClick={() => {
              setMode("room");
              setValidation("");
            }}
          >
            {stay.room_assignments.length ? "Move room" : "Assign room"}
          </button>
        )}
        {stay.status === "reserved" && allowed("checkin") && (
          <button
            className="stay-primary"
            disabled={mutation.isPending || !stay.room_assignments.length}
            onClick={() => setConfirm("check-in")}
          >
            Check in
          </button>
        )}
        {stay.status === "checked_in" && allowed("checkout") && (
          <button
            className="stay-primary"
            disabled={mutation.isPending}
            onClick={() => setConfirm("check-out")}
          >
            Check out
          </button>
        )}
        {stay.status === "reserved" && allowed("cancel") && (
          <button
            disabled={mutation.isPending}
            onClick={() => setConfirm("cancel")}
          >
            Cancel reservation
          </button>
        )}
      </div>
      {confirm && (
        <section className="stay-inline-confirm" aria-label="Confirm action">
          <h3>Confirm {confirm.replaceAll("-", " ")}</h3>
          <p>
            {confirm === "cancel"
              ? "This releases the reserved room interval."
              : confirm === "check-in"
                ? "Confirm the guests have arrived."
                : "Confirm the guests have departed."}
          </p>
          <div className="stay-actions">
            <button
              disabled={mutation.isPending}
              onClick={() => setConfirm(null)}
            >
              Keep reservation
            </button>
            <button
              className="stay-primary"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: confirm })}
            >
              {mutation.isPending ? "Saving…" : "Confirm action"}
            </button>
          </div>
        </section>
      )}
      {mode === "dates" && (
        <form className="stay-edit" onSubmit={dates}>
          <h3>
            {stay.status === "reserved"
              ? "Reschedule reservation"
              : "Update departure"}
          </h3>
          <p className="stay-muted">
            Times are displayed in{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}. Existing room
            moves retain their scheduled times.
          </p>
          <fieldset disabled={mutation.isPending}>
            <DateFields
              start={start}
              end={end}
              onStart={setStart}
              onEnd={setEnd}
              lockStart={stay.status === "checked_in"}
            />
            <label>
              Notes
              <textarea
                value={notes}
                maxLength={2000}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </fieldset>
          <div className="stay-actions">
            <button type="button" onClick={() => setMode(null)}>
              Close editor
            </button>
            <button className="stay-primary" disabled={mutation.isPending}>
              Save dates and notes
            </button>
          </div>
        </form>
      )}
      {mode === "room" && (
        <form
          className="stay-edit"
          onSubmit={(e) => {
            e.preventDefault();
            if (!room) {
              setValidation("Choose a room.");
              return;
            }
            setValidation("");
            mutation.mutate({
              action: "room-assignments",
              body: {
                room_place_id: room.value,
                ...(effective
                  ? { effective_from: new Date(effective).toISOString() }
                  : {}),
              },
            });
          }}
        >
          <h3>Assign or move room</h3>
          <fieldset disabled={mutation.isPending}>
            <FacetPicker
              contextKey={context}
              facet="places"
              kind="room"
              label="Room"
              value={room}
              onChange={setRoom}
            />
            <label>
              Effective from (optional)
              <input
                type="datetime-local"
                value={effective}
                onChange={(e) => setEffective(e.target.value)}
              />
            </label>
            <p className="stay-muted">
              Leave blank for planned arrival on a future reservation, or now
              for a current stay.
            </p>
          </fieldset>
          <div className="stay-actions">
            <button type="button" onClick={() => setMode(null)}>
              Close editor
            </button>
            <button className="stay-primary" disabled={mutation.isPending}>
              Save room assignment
            </button>
          </div>
        </form>
      )}
      {(validation || mutation.isError) && (
        <p role="alert" className="stay-error">
          {validation || parseApiError(mutation.error).message}
        </p>
      )}
    </>
  );
}
