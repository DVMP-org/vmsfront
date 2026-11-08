"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
  AccessCommand,
  AccessLane,
  AccessSimulationResponse,
  accessControlService,
} from "@/services/access-control-service";
import { checkpointsApi, Gate, Passage, PassageInput } from "./api";
import "./styles.css";
function useAccess() {
  const org = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const context = `${org?.id}:${user?.id}`;
  const profile = useQuery({
    queryKey: ["checkpoint-profile", context],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: !!org?.id && !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });
  return {
    context,
    profile,
    allowed: (p: string) =>
      profile.isFetchedAfterMount &&
      !profile.isError &&
      hasAdminPermission(profile.data, p),
  };
}
function Failure({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
    >
      <p className="font-semibold">{parseApiError(error).message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}
function Outcome({ event }: { event: Passage }) {
  const allowed = event.outcome === "allowed";
  return (
    <section
      className={`checkpoint-outcome ${event.outcome} rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5`}
      aria-label="Passage result"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Recorded decision
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {allowed ? "Allowed" : "Denied"} ·{" "}
            {event.direction === "entry" ? "Check-in" : "Checkout"}
          </h2>
        </div>
        <Badge variant={allowed ? "success" : "danger"}>
          {allowed ? "Allowed" : "Denied"}
        </Badge>
      </div>
      <p className="mt-3 text-sm capitalize text-[var(--vms-ink-muted)]">
        {event.reason_code.replaceAll("_", " ")}
      </p>
      <time
        className="mt-1 block text-xs text-[var(--vms-ink-muted)]"
        dateTime={event.occurred_at}
      >
        {new Date(event.occurred_at).toLocaleString()}
      </time>
      {event.replayed && (
        <p className="mt-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-info)]/30 bg-[var(--vms-surface-subtle)] p-3 text-sm">
          Previously recorded result recovered. No duplicate passage was
          created.
        </p>
      )}
      <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
        This is the recorded passage decision. Hardware command, acknowledgement
        and physical state are separate.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
        href={`/admin/checkpoints/${event.gate_id}/events/${event.id}`}
      >
        Open passage record
      </Link>
    </section>
  );
}

function commandStatusLabel(command?: AccessCommand | null) {
  if (!command) return "No command";
  const labels: Record<AccessCommand["status"], string> = {
    pending: "Waiting for device acknowledgement",
    acknowledged: "Acknowledged; physical result unconfirmed",
    completed: "Requested physical state observed",
    timed_out: "Command timed out",
    rejected: "Command rejected",
    offline: "Lane offline; command not delivered",
  };
  return labels[command.status];
}

function HardwareState({
  lane,
  simulation,
  loading,
  onRefresh,
}: {
  lane?: AccessLane;
  simulation: AccessSimulationResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const command = simulation?.command;
  const commandTone =
    command?.status === "completed"
      ? "success"
      : command?.status === "acknowledged" || command?.status === "pending"
        ? "warning"
        : command?.status === "rejected" ||
            command?.status === "offline" ||
            command?.status === "timed_out"
          ? "danger"
          : "neutral";
  return (
    <section
      className="checkpoint-hardware rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
      aria-label="Hardware status"
    >
      <header>
        <div>
          <h2 className="text-lg font-semibold">Decision to physical state</h2>
          <p className="text-sm text-[var(--vms-ink-muted)]">
            These are separate states. Only a completed device report confirms
            the door or barrier moved.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={onRefresh}
        >
          {loading ? "Refreshing…" : "Refresh hardware"}
        </Button>
      </header>
      <div className="checkpoint-hardware-grid">
        <div>
          <span>1. Policy decision</span>
          <strong>{simulation?.decision.outcome || "Not created"}</strong>
          <small>
            {simulation?.decision.reason_code || "No access decision"}
          </small>
        </div>
        <div>
          <span>2. Device command</span>
          <strong>{command?.action || "None"}</strong>
          <small>{commandStatusLabel(command)}</small>
          <Badge variant={commandTone} className="mt-2">
            {command?.status?.replaceAll("_", " ") || "Not dispatched"}
          </Badge>
        </div>
        <div>
          <span>3. Acknowledgement</span>
          <strong>
            {command?.acknowledged_at ? "Received" : "Not received"}
          </strong>
          <small>
            {command?.acknowledged_at
              ? new Date(command.acknowledged_at).toLocaleTimeString()
              : "Awaiting device confirmation"}
          </small>
        </div>
        <div>
          <span>4. Observed physical state</span>
          <strong>{lane?.observed_state || "Unknown"}</strong>
          <small>
            Device report
            {lane?.last_seen_at
              ? ` · ${new Date(lane.last_seen_at).toLocaleTimeString()}`
              : ""}
          </small>
        </div>
      </div>
      {command?.status === "offline" || lane?.availability === "offline" ? (
        <p
          className="checkpoint-fail-safe mt-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)]/40 bg-[var(--vms-warning-subtle)] p-3 text-sm font-semibold text-[var(--vms-warning)]"
          role="status"
        >
          Fail-safe active: the decision may be recorded, but no physical action
          was confirmed. Follow the site&apos;s manual access procedure.
        </p>
      ) : null}
    </section>
  );
}
export function CheckpointDirectory() {
  const { context, profile, allowed } = useAccess();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const list = useQuery({
    queryKey: ["checkpoint-gates", context, page, search],
    queryFn: () => checkpointsApi.gates(page, search),
    enabled: allowed("gates.list"),
  });
  if (profile.isError)
    return <Failure error={profile.error} retry={() => profile.refetch()} />;
  if (!profile.isFetchedAfterMount)
    return <p role="status">Loading permissions…</p>;
  if (!allowed("gates.list"))
    return <p role="alert">You do not have permission to select a gate.</p>;
  const columns: Column<Gate>[] = [
    {
      key: "name",
      header: "Checkpoint",
      sortable: true,
      accessor: (gate) => (
        <div className="min-w-0">
          <Link
            href={`/admin/checkpoints/${gate.id}`}
            className="block truncate font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            {gate.name}
          </Link>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            Physical access checkpoint
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (gate) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/checkpoints/${gate.id}`}>Open checkpoint</Link>
        </Button>
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Copy checkpoint IDs",
      icon: Copy,
      onClick: async (ids) => {
        try {
          await navigator.clipboard.writeText(ids.join("\n"));
          toast.success(
            `${ids.length} checkpoint ID${ids.length === 1 ? "" : "s"} copied.`,
          );
        } catch {
          toast.error("Checkpoint IDs could not be copied.");
        }
      },
    },
  ];
  return (
    <main className="checkpoint-page">
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Access operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Check-in / checkout
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
          Choose the checkpoint you are operating. Access decisions are shared
          across every use case.
        </p>
      </header>
      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        tableLabel="Checkpoint directory"
        searchPlaceholder="Search gate or checkpoint name"
        initialSearch={search}
        onSearchChange={(value) => {
          setSearch(value.trim().slice(0, 100));
          setPage(1);
        }}
        serverSide
        total={list.data?.total ?? 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={20}
        pageSizeOptions={[20]}
        isLoading={list.isPending}
        errorMessage={
          list.isError && !list.data
            ? parseApiError(list.error).message
            : undefined
        }
        isStale={list.isError && !!list.data}
        onRetry={() => list.refetch()}
        emptyMessage={
          search
            ? "No gates match this search"
            : "No checkpoint gates configured"
        }
        selectable
        getRowId={(gate) => gate.id}
        bulkActions={bulkActions}
        mobileSummary={(gate) => (
          <Link
            href={`/admin/checkpoints/${gate.id}`}
            className="flex min-h-11 items-center justify-between gap-4"
          >
            <span>
              <strong className="block text-sm">{gate.name}</strong>
              <span className="text-xs text-[var(--vms-ink-muted)]">
                Physical access checkpoint
              </span>
            </span>
            <span className="text-sm font-semibold text-[var(--vms-action)]">
              Open
            </span>
          </Link>
        )}
      />
    </main>
  );
}
export function CheckpointConsole({ gateId }: { gateId: string }) {
  const access = useAccess();
  return (
    <Console
      key={`${access.context}:${gateId}`}
      gateId={gateId}
      access={access}
    />
  );
}

export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const value = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    return [
      value.slice(0, 8),
      value.slice(8, 12),
      value.slice(12, 16),
      value.slice(16, 20),
      value.slice(20),
    ].join("-");
  }
  throw new Error("Secure random values are unavailable");
}

interface QueuedPassage {
  input: PassageInput;
  queued_at: string;
}

function queueStorageKey(context: string, gateId: string) {
  return `vms:access-queue:${context}:${gateId}`;
}

function loadQueuedPassages(key: string): QueuedPassage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedPassage =>
        !!item?.input?.authorization_code && !!item?.input?.idempotency_key,
    );
  } catch {
    return [];
  }
}

function Console({
  gateId,
  access,
}: {
  gateId: string;
  access: ReturnType<typeof useAccess>;
}) {
  const { context, profile, allowed } = access;
  const client = useQueryClient();
  const [code, setCode] = useState("");
  const [suffix, setSuffix] = useState("");
  const [direction, setDirection] = useState<"entry" | "exit">("entry");
  const [page, setPage] = useState(1);
  const [intent, setIntent] = useState<PassageInput | null>(null);
  const [result, setResult] = useState<Passage | null>(null);
  const [simulation, setSimulation] = useState<AccessSimulationResponse | null>(
    null,
  );
  const [selectedLaneId, setSelectedLaneId] = useState("");
  const [online, setOnline] = useState(true);
  const storageKey = queueStorageKey(context, gateId);
  const [queued, setQueued] = useState<QueuedPassage[]>(() =>
    loadQueuedPassages(storageKey),
  );
  const [queueNotice, setQueueNotice] = useState("");
  const gate = useQuery({
    queryKey: ["checkpoint-gate", context, gateId],
    queryFn: () => checkpointsApi.gate(gateId),
    enabled: allowed("gates.show"),
  });
  const history = useQuery({
    queryKey: ["checkpoint-history", context, gateId, page],
    queryFn: () => checkpointsApi.history(gateId, page),
    enabled: allowed("checkpoint_events.list"),
  });
  const topology = useQuery({
    queryKey: ["checkpoint-access-topology", context, gateId],
    queryFn: accessControlService.getTopology,
    enabled: allowed("gates.show"),
  });
  const lanes = useMemo<AccessLane[]>(
    () =>
      (topology.data?.places || []).flatMap((site) =>
        site.gates
          .filter((candidate) => candidate.id === gateId)
          .flatMap((candidate) => candidate.lanes),
      ),
    [gateId, topology.data],
  );
  const selectedLane =
    lanes.find((lane) => lane.id === selectedLaneId) || lanes[0];
  const canRecord = allowed("checkpoint_events.record");
  const mutation = useMutation({
    mutationFn: async (body: PassageInput) => {
      const event = await checkpointsApi.record(gateId, body);
      const access = selectedLane
        ? await accessControlService.simulateDecision(selectedLane.id, {
            idempotency_key: `${body.idempotency_key}:access`,
            checkpoint_event_id: event.id,
            outcome: event.outcome === "allowed" ? "allowed" : "denied",
            reason_code: event.reason_code,
            command_action: "open",
            timeout_seconds: 15,
          })
        : null;
      return { event, access };
    },
    onSuccess: ({ event, access }, body) => {
      setResult(event);
      setSimulation(access);
      setQueued((current) =>
        current.filter(
          (item) => item.input.idempotency_key !== body.idempotency_key,
        ),
      );
      setQueueNotice("");
      setIntent(null);
      client.invalidateQueries({
        queryKey: ["checkpoint-history", context, gateId],
      });
      if (selectedLane) {
        client.invalidateQueries({
          queryKey: ["checkpoint-access-topology", context, gateId],
        });
      }
    },
  });
  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(queued));
  }, [queued, storageKey]);
  useEffect(() => {
    if (!selectedLaneId && lanes.length) {
      setSelectedLaneId(
        lanes.find((lane) => lane.availability === "online")?.id || lanes[0].id,
      );
    }
  }, [lanes, selectedLaneId]);
  useEffect(() => {
    if (
      !online ||
      mutation.isPending ||
      intent ||
      !queued.length ||
      !canRecord
    ) {
      return;
    }
    const next = queued[0];
    setIntent(next.input);
    mutation.mutate(next.input);
  }, [canRecord, intent, mutation, online, queued]);
  if (profile.isError)
    return <Failure error={profile.error} retry={() => profile.refetch()} />;
  if (!profile.isFetchedAfterMount)
    return <p role="status">Loading checkpoint permissions…</p>;
  if (!allowed("gates.show"))
    return <p role="alert">You do not have permission to open this gate.</p>;
  if (gate.isPending) return <p role="status">Loading checkpoint…</p>;
  if (gate.isError)
    return <Failure error={gate.error} retry={() => gate.refetch()} />;
  return (
    <main className="checkpoint-page">
      <Link
        href="/admin/checkpoints"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
      >
        Back to all checkpoints
      </Link>
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Access operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          {gate.data?.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
          Tablet check-in and checkout. A recorded decision does not imply the
          barrier opened.
        </p>
      </header>
      <section className="checkpoint-status-strip" aria-label="Access status">
        <div className={online ? "online" : "offline"}>
          <strong>{online ? "Network online" : "Network offline"}</strong>
          <span>
            {online
              ? "Passages are verified immediately."
              : "Passages are queued provisionally on this device."}
          </span>
        </div>
        <div>
          <strong>{selectedLane?.name || "No lane selected"}</strong>
          <span>
            {selectedLane
              ? `${selectedLane.availability} · observed ${selectedLane.observed_state}`
              : "Passage decisions can be recorded without hardware control."}
          </span>
        </div>
        <div>
          <strong>Fail-safe</strong>
          <span>
            Never infer an open door from an allowance or command response.
          </span>
        </div>
      </section>
      {topology.isError ? (
        <div
          role="alert"
          className="checkpoint-inline-alert rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)]"
        >
          <p className="font-semibold">Lane state could not be verified.</p>
          <p>{parseApiError(topology.error).message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => topology.refetch()}
          >
            Retry lane status
          </Button>
        </div>
      ) : null}
      {queued.length ? (
        <section
          className="checkpoint-queue rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)]"
          aria-live="polite"
        >
          <strong>
            {queued.length} provisional{" "}
            {queued.length === 1 ? "passage" : "passages"} queued
          </strong>
          <p>
            These are not checked in. Keep this device online until the server
            confirms each result.
          </p>
          {queueNotice ? <p>{queueNotice}</p> : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={!online || mutation.isPending || !!intent}
            onClick={() => {
              const next = queued[0];
              if (!next) return;
              setIntent(next.input);
              mutation.mutate(next.input);
            }}
          >
            {online ? "Verify next queued passage" : "Waiting for connection"}
          </Button>
        </section>
      ) : null}
      {canRecord ? (
        <form
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (intent || mutation.isPending) return;
            const body: PassageInput = {
              authorization_code: code.trim(),
              direction,
              ...(suffix ? { guest_suffix: suffix } : {}),
              ...(selectedLane ? { lane_id: selectedLane.id } : {}),
              idempotency_key: createIdempotencyKey(),
            };
            if (!online) {
              setQueued((current) => [
                ...current,
                { input: body, queued_at: new Date().toISOString() },
              ]);
              setQueueNotice(
                "Queued locally. It remains provisional until reconnect and server confirmation.",
              );
              setCode("");
              setSuffix("");
              return;
            }
            setIntent(body);
            mutation.mutate(body);
          }}
        >
          <fieldset
            disabled={!!intent || mutation.isPending || !!result}
            className="space-y-4"
          >
            <div>
              <legend className="text-lg font-semibold">New passage</legend>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                Record the person first. Hardware state stays separate from the
                access decision.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="checkpoint-authorization-code"
                label="Authorization code"
                required
              >
                {(control) => (
                  <input
                    {...control}
                    aria-label="Authorization code"
                    value={code}
                    maxLength={100}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <Field
                id="checkpoint-guest-suffix"
                label="Guest suffix (for group invitations)"
                description="Use the numbered suffix assigned to a group guest."
              >
                {(control) => (
                  <input
                    {...control}
                    aria-label="Guest suffix (for group invitations)"
                    value={suffix}
                    pattern="[0-9]{2,10}"
                    maxLength={10}
                    onChange={(e) => setSuffix(e.target.value)}
                    inputMode="numeric"
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <Field id="checkpoint-direction" label="Direction" required>
                {(control) => (
                  <select
                    {...control}
                    aria-label="Direction"
                    value={direction}
                    onChange={(e) =>
                      setDirection(e.target.value as "entry" | "exit")
                    }
                    className={fieldControlClassName}
                  >
                    <option value="entry">Check in</option>
                    <option value="exit">Check out</option>
                  </select>
                )}
              </Field>
              <Field id="checkpoint-lane" label="Door or barrier">
                {(control) => (
                  <select
                    {...control}
                    aria-label="Door or barrier"
                    value={selectedLane?.id || ""}
                    onChange={(e) => setSelectedLaneId(e.target.value)}
                    disabled={topology.isPending || lanes.length === 0}
                    className={fieldControlClassName}
                  >
                    {lanes.length ? (
                      lanes.map((lane) => (
                        <option key={lane.id} value={lane.id}>
                          {lane.name} · {lane.availability} ·{" "}
                          {lane.observed_state}
                        </option>
                      ))
                    ) : (
                      <option value="">No hardware lane configured</option>
                    )}
                  </select>
                )}
              </Field>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!code.trim()}
              isLoading={mutation.isPending}
            >
              {mutation.isPending
                ? "Verifying…"
                : online
                  ? "Record and verify passage"
                  : "Queue offline check"}
            </Button>
          </fieldset>
        </form>
      ) : (
        <p
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm text-[var(--vms-ink-muted)]"
          role="status"
        >
          You can view this checkpoint but cannot record passages.
        </p>
      )}
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
        >
          <p className="font-semibold">
            {parseApiError(mutation.error).message}
          </p>
          <p>
            The outcome may be unknown. Retry uses the same request to avoid a
            duplicate passage.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={mutation.isPending}
            onClick={() => intent && mutation.mutate(intent)}
          >
            Retry same passage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setIntent(null);
              mutation.reset();
              setCode("");
              setSuffix("");
            }}
          >
            Start a different passage
          </Button>
        </div>
      )}
      {result && (
        <>
          <Outcome event={result} />
          <HardwareState
            lane={selectedLane}
            simulation={simulation}
            loading={topology.isFetching}
            onRefresh={() => {
              topology.refetch();
              if (selectedLane) {
                accessControlService
                  .listCommands({ laneId: selectedLane.id })
                  .then((commands) => {
                    const command = commands.find(
                      (item) => item.decision_id === simulation?.decision.id,
                    );
                    if (command && simulation) {
                      setSimulation({ ...simulation, command });
                    }
                  })
                  .catch(() => undefined);
              }
            }}
          />
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setResult(null);
              setSimulation(null);
              setCode("");
              setSuffix("");
              mutation.reset();
            }}
          >
            Next person
          </Button>
        </>
      )}
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="border-b border-[var(--vms-line)] px-4 py-4">
          <h2 className="text-lg font-semibold">Passage history</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Exact checkpoint records, including denied outcomes and repeated
            scans.
          </p>
        </div>
        {!allowed("checkpoint_events.list") ? (
          <p className="p-4 text-sm text-[var(--vms-ink-muted)]">
            You do not have permission to view history.
          </p>
        ) : history.isPending ? (
          <p className="p-4 text-sm text-[var(--vms-ink-muted)]" role="status">
            Loading history…
          </p>
        ) : history.isError ? (
          <div className="p-4">
            <Failure error={history.error} retry={() => history.refetch()} />
          </div>
        ) : (
          <>
            <ul className="checkpoint-history divide-y divide-[var(--vms-line)]">
              {history.data?.items.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/admin/checkpoints/${gateId}/events/${event.id}`}
                    className="grid min-h-16 gap-2 px-4 py-3 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <time
                      dateTime={event.occurred_at}
                      className="text-sm text-[var(--vms-ink-muted)]"
                    >
                      {new Date(event.occurred_at).toLocaleString()}
                    </time>
                    <strong>
                      {event.direction === "entry" ? "Check-in" : "Checkout"} ·{" "}
                      {event.outcome}
                    </strong>
                    <Badge
                      variant={
                        event.outcome === "allowed" ? "success" : "danger"
                      }
                    >
                      {event.reason_code.replaceAll("_", " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
            {!history.data?.items.length && (
              <EmptyState
                title="No passages yet"
                description="No passages have been recorded at this checkpoint."
              />
            )}
            <PaginationBar
              page={page}
              totalPages={history.data?.total_pages || 0}
              hasPrevious={page > 1}
              hasNext={page < (history.data?.total_pages || 0)}
              isFetching={history.isFetching}
              resourceLabel="passages"
              onChange={setPage}
              className="rounded-none border-0 border-t"
            />
          </>
        )}
      </section>
    </main>
  );
}
export function CheckpointRecord({
  gateId,
  eventId,
}: {
  gateId: string;
  eventId: string;
}) {
  const { context, profile, allowed } = useAccess();
  const record = useQuery({
    queryKey: ["checkpoint-event", context, eventId],
    queryFn: () => checkpointsApi.event(eventId),
    enabled: allowed("checkpoint_events.show"),
  });
  if (profile.isError)
    return <Failure error={profile.error} retry={() => profile.refetch()} />;
  if (!profile.isFetchedAfterMount)
    return <p role="status">Loading permissions…</p>;
  if (!allowed("checkpoint_events.show"))
    return <p role="alert">You do not have permission to view this passage.</p>;
  return (
    <main className="checkpoint-page">
      <Link
        href={`/admin/checkpoints/${gateId}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
      >
        Back to checkpoint
      </Link>
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Access record
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Passage record
        </h1>
      </header>
      {record.isPending ? (
        <p role="status">Loading passage…</p>
      ) : record.isError ? (
        <Failure error={record.error} retry={() => record.refetch()} />
      ) : record.data && record.data.gate_id === gateId ? (
        <Outcome event={record.data} />
      ) : (
        <p role="alert">
          This passage does not belong to the selected checkpoint.
        </p>
      )}
    </main>
  );
}
