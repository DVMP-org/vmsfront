"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { parseApiError } from "@/lib/error-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import {
  AccessCommand,
  AccessLane,
  AccessSimulationResponse,
  accessControlService,
} from "@/services/access-control-service";
import { checkpointsApi, Passage, PassageInput } from "./api";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import "./styles.css";
function useAccess() {
  const org = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const context = `${org?.id}:${user?.id}`;
  const workspace = useWorkspaceContext();
  return {
    context,
    workspace,
    allowed: (permission: string) => {
      const permissions = workspace.data?.effective_permissions ?? [];
      return permissions.some((grant) => {
        if (grant === "*") return true;
        if (grant.endsWith(".*")) {
          return permission.startsWith(grant.slice(0, -1));
        }
        return grant === permission;
      });
    },
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
            {event.person_name || "Credential holder"} ·{" "}
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
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--vms-ink-muted)]">Destination</dt>
          <dd className="mt-1 font-semibold">
            {event.place_name || "Current property"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--vms-ink-muted)]">Access state</dt>
          <dd className="mt-1 font-semibold">
            {(event.state_before || "unknown").replaceAll("_", " ")} to{" "}
            {(event.state_after || "unknown").replaceAll("_", " ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--vms-ink-muted)]">Checkpoint</dt>
          <dd className="mt-1 font-semibold">
            {event.gate_name || "Current checkpoint"}
          </dd>
        </div>
      </dl>
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
        href={`/admin/passages/${event.id}`}
      >
        Open access event
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
  const access = useAccess();
  const assignments = useQuery({
    queryKey: ["my-checkpoint-assignments", access.context],
    queryFn: checkpointsApi.myAssignments,
    enabled:
      !access.workspace.isPending &&
      !access.workspace.isError &&
      access.workspace.data?.management?.is_administrator === true,
    retry: false,
  });
  if (access.workspace.isError)
    return (
      <Failure
        error={access.workspace.error}
        retry={() => access.workspace.refetch()}
      />
    );
  if (access.workspace.isPending)
    return <p role="status">Loading checkpoint authority…</p>;
  if (!access.workspace.data?.management?.is_administrator)
    return <p role="alert">An active site administrator is required.</p>;
  if (assignments.isPending)
    return <p role="status">Loading assigned checkpoint…</p>;
  if (assignments.isError)
    return (
      <Failure error={assignments.error} retry={() => assignments.refetch()} />
    );
  const assigned = assignments.data?.assignments ?? [];
  if (assigned.length === 1) {
    return (
      <Console
        key={`${access.context}:${assigned[0].gate_id}`}
        gateId={assigned[0].gate_id}
        access={access}
        showBack={false}
      />
    );
  }
  return (
    <main className="checkpoint-page">
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Access operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Access Console
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
          Your operator account has multiple active checkpoint assignments.
          Choose the physical checkpoint you are stationed at.
        </p>
      </header>
      {assigned.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {assigned.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/admin/checkpoints/${assignment.gate_id}`}
              className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 transition-colors hover:bg-[var(--vms-surface-subtle)]"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                {assignment.place.name}
              </span>
              <strong className="mt-2 block text-lg">
                {assignment.gate_name}
              </strong>
              <span className="mt-1 block text-sm text-[var(--vms-ink-muted)]">
                Assigned to {assignment.party.display_name}
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-5 text-sm text-[var(--vms-warning)]">
          <p className="font-semibold">No checkpoint is assigned to you.</p>
          <p className="mt-1">
            A site administrator must assign an active checkpoint operator
            before check-in or checkout can begin.
          </p>
        </section>
      )}
      <Link
        href="/admin/passages"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
      >
        Open passage history
      </Link>
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
      showBack
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
        !!(item?.input?.credential || item?.input?.authorization_code) &&
        !!item?.input?.idempotency_key,
    );
  } catch {
    return [];
  }
}

function Console({
  gateId,
  access,
  showBack,
}: {
  gateId: string;
  access: ReturnType<typeof useAccess>;
  showBack: boolean;
}) {
  const { context, workspace, allowed } = access;
  const client = useQueryClient();
  const [code, setCode] = useState("");
  const [suffix, setSuffix] = useState("");
  const [direction, setDirection] = useState<"" | "entry" | "exit">("");
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
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const gate = useQuery({
    queryKey: ["checkpoint-console", context, gateId],
    queryFn: () => checkpointsApi.console(gateId),
    enabled:
      allowed("checkpoint_events.record") &&
      workspace.data?.management?.is_administrator === true,
  });
  const lanes = useMemo<AccessLane[]>(
    () => gate.data?.lanes ?? [],
    [gate.data?.lanes],
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
      client.invalidateQueries({ queryKey: ["access-events"] });
      client.invalidateQueries({
        queryKey: ["checkpoint-console", context, gateId],
      });
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
  if (workspace.isError)
    return (
      <Failure error={workspace.error} retry={() => workspace.refetch()} />
    );
  if (workspace.isPending)
    return <p role="status">Loading checkpoint permissions…</p>;
  if (!allowed("checkpoint_events.record"))
    return <p role="alert">You do not have checkpoint recording permission.</p>;
  if (gate.isPending) return <p role="status">Loading checkpoint…</p>;
  if (gate.isError)
    return <Failure error={gate.error} retry={() => gate.refetch()} />;
  return (
    <main className="checkpoint-page">
      {showBack ? (
        <Link
          href="/admin/checkpoints"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
        >
          Back to access console
        </Link>
      ) : null}
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Access operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          {gate.data?.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
          Scan an invitation, badge, permanent code or signed QR credential. The
          server resolves identity, policy and movement direction.
        </p>
        <Link
          href="/admin/passages"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
        >
          Open passage history
        </Link>
      </header>
      <section className="checkpoint-status-strip" aria-label="Access status">
        <div className={online ? "online" : "offline"}>
          <strong>{online ? "Network online" : "Network offline"}</strong>
          <span>
            {online
              ? "Passages are verified immediately."
              : gate.data?.offline_policy === "deny"
                ? "This checkpoint denies access while offline."
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
              credential: code.trim(),
              ...(direction ? { direction } : {}),
              ...(suffix ? { guest_suffix: suffix } : {}),
              ...(selectedLane ? { lane_id: selectedLane.id } : {}),
              ...(manualOverride
                ? {
                    manual_override: true,
                    override_reason: overrideReason.trim(),
                  }
                : {}),
              idempotency_key: createIdempotencyKey(),
            };
            if (!online) {
              if (gate.data?.offline_policy === "deny") {
                setQueueNotice(
                  "This checkpoint requires a server connection before any access transition can be recorded.",
                );
                return;
              }
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
                id="checkpoint-credential"
                label="Credential"
                description="Invitation ID, invitation QR, badge QR, or permanent access code."
                required
              >
                {(control) => (
                  <input
                    {...control}
                    aria-label="Credential"
                    value={code}
                    maxLength={2048}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <Field
                id="checkpoint-guest-suffix"
                label="Guest suffix (optional)"
                description="Required only for a parent group invitation without its appended visitor suffix."
              >
                {(control) => (
                  <input
                    {...control}
                    aria-label="Guest suffix"
                    value={suffix}
                    pattern="[0-9]{2,10}"
                    maxLength={10}
                    onChange={(e) => setSuffix(e.target.value)}
                    inputMode="numeric"
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <Field id="checkpoint-direction" label="Movement">
                {(control) => (
                  <select
                    {...control}
                    aria-label="Movement"
                    value={direction}
                    onChange={(e) =>
                      setDirection(e.target.value as "" | "entry" | "exit")
                    }
                    className={fieldControlClassName}
                  >
                    <option value="">Automatic (server resolves)</option>
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
                    disabled={gate.isPending || lanes.length === 0}
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
            <label className="flex items-start gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3 text-sm">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(event) => setManualOverride(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong className="block">Authorized exception</strong>
                <span className="text-[var(--vms-ink-muted)]">
                  Requires checkpoint override permission and a permanent audit
                  reason.
                </span>
              </span>
            </label>
            {manualOverride ? (
              <Field
                id="checkpoint-override-reason"
                label="Override reason"
                required
              >
                {(control) => (
                  <textarea
                    {...control}
                    aria-label="Override reason"
                    value={overrideReason}
                    maxLength={255}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    className={fieldControlClassName}
                  />
                )}
              </Field>
            ) : null}
            <Button
              type="submit"
              size="lg"
              disabled={
                !code.trim() || (manualOverride && !overrideReason.trim())
              }
              isLoading={mutation.isPending}
            >
              {mutation.isPending
                ? "Verifying…"
                : online
                  ? "Record and verify passage"
                  : gate.data?.offline_policy === "deny"
                    ? "Connection required by checkpoint policy"
                    : "Queue provisional offline check"}
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
            loading={gate.isFetching}
            onRefresh={() => {
              gate.refetch();
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
  const { context, workspace, allowed } = useAccess();
  const record = useQuery({
    queryKey: ["checkpoint-event", context, eventId],
    queryFn: () => checkpointsApi.event(eventId),
    enabled: allowed("checkpoint_events.show"),
  });
  if (workspace.isError)
    return (
      <Failure error={workspace.error} retry={() => workspace.refetch()} />
    );
  if (workspace.isPending) return <p role="status">Loading permissions…</p>;
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
