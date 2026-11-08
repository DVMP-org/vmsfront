"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import {
  AccessCommand,
  AccessLane,
  AccessSimulationResponse,
  accessControlService,
} from "@/services/access-control-service";
import { checkpointsApi, Passage, PassageInput } from "./api";
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
    <div role="alert">
      <p>{parseApiError(error).message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
function Outcome({ event }: { event: Passage }) {
  return (
    <section
      className={`checkpoint-outcome ${event.outcome}`}
      aria-label="Passage result"
    >
      <h2>
        {event.outcome === "allowed" ? "Allowed" : "Denied"} ·{" "}
        {event.direction === "entry" ? "Check-in" : "Checkout"}
      </h2>
      <p>{event.reason_code.replaceAll("_", " ")}</p>
      <p>{new Date(event.occurred_at).toLocaleString()}</p>
      {event.replayed && (
        <p>
          Previously recorded result recovered. No duplicate passage was
          created.
        </p>
      )}
      <p>
        This is the recorded passage decision. Hardware command, acknowledgement
        and physical state are separate.
      </p>
      <Link href={`/admin/checkpoints/${event.gate_id}/events/${event.id}`}>
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
  return (
    <section className="checkpoint-hardware" aria-label="Hardware status">
      <header>
        <div>
          <h2>Decision to physical state</h2>
          <p>
            These are separate states. Only a completed device report confirms
            the door or barrier moved.
          </p>
        </div>
        <button type="button" disabled={loading} onClick={onRefresh}>
          {loading ? "Refreshing…" : "Refresh hardware"}
        </button>
      </header>
      <div className="checkpoint-hardware-grid">
        <div>
          <span>1. Policy decision</span>
          <strong>{simulation?.decision.outcome || "Not created"}</strong>
          <small>{simulation?.decision.reason_code || "No access decision"}</small>
        </div>
        <div>
          <span>2. Device command</span>
          <strong>{command?.action || "None"}</strong>
          <small>{commandStatusLabel(command)}</small>
        </div>
        <div>
          <span>3. Acknowledgement</span>
          <strong>{command?.acknowledged_at ? "Received" : "Not received"}</strong>
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
        <p className="checkpoint-fail-safe" role="status">
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
  const [input, setInput] = useState("");
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
  return (
    <main className="checkpoint-page">
      <header>
        <p>ACCESS OPERATIONS</p>
        <h1>Check-in / checkout</h1>
        <p>
          Choose the checkpoint you are operating. Access decisions are shared
          across every use case.
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
          setPage(1);
        }}
      >
        <label>
          Search gates
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={100}
          />
        </label>
        <button>Search</button>
      </form>
      {list.isPending ? (
        <p role="status">Loading gates…</p>
      ) : list.isError ? (
        <Failure error={list.error} retry={() => list.refetch()} />
      ) : (
        <>
          <ul className="checkpoint-directory">
            {list.data?.items.map((g) => (
              <li key={g.id}>
                <Link href={`/admin/checkpoints/${g.id}`}>
                  <strong>{g.name}</strong>
                  <span>Open checkpoint →</span>
                </Link>
              </li>
            ))}
          </ul>
          {!list.data?.items.length && (
            <p>
              No gates match this search. Configure a gate in Gates before
              recording passages.
            </p>
          )}
          <nav aria-label="Gate pagination">
            <button
              disabled={page === 1 || list.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={
                page >= (list.data?.total_pages || 0) || list.isFetching
              }
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
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
  const [simulation, setSimulation] =
    useState<AccessSimulationResponse | null>(null);
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
        lanes.find((lane) => lane.availability === "online")?.id ||
          lanes[0].id,
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
      <Link href="/admin/checkpoints">← All checkpoints</Link>
      <header>
        <p>ACCESS OPERATIONS</p>
        <h1>{gate.data?.name}</h1>
        <p>
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
        <div role="alert" className="checkpoint-inline-alert">
          <p>Lane state could not be verified.</p>
          <p>{parseApiError(topology.error).message}</p>
          <button type="button" onClick={() => topology.refetch()}>
            Retry lane status
          </button>
        </div>
      ) : null}
      {queued.length ? (
        <section className="checkpoint-queue" aria-live="polite">
          <strong>
            {queued.length} provisional{" "}
            {queued.length === 1 ? "passage" : "passages"} queued
          </strong>
          <p>
            These are not checked in. Keep this device online until the server
            confirms each result.
          </p>
          {queueNotice ? <p>{queueNotice}</p> : null}
          <button
            type="button"
            disabled={!online || mutation.isPending || !!intent}
            onClick={() => {
              const next = queued[0];
              if (!next) return;
              setIntent(next.input);
              mutation.mutate(next.input);
            }}
          >
            {online ? "Verify next queued passage" : "Waiting for connection"}
          </button>
        </section>
      ) : null}
      {canRecord ? (
        <form
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
          <fieldset disabled={!!intent || mutation.isPending || !!result}>
            <legend>New passage</legend>
            <label>
              Authorization code
              <input
                required
                value={code}
                maxLength={100}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Guest suffix (for group invitations)
              <input
                value={suffix}
                pattern="[0-9]{2,10}"
                maxLength={10}
                onChange={(e) => setSuffix(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <label>
              Direction
              <select
                value={direction}
                onChange={(e) =>
                  setDirection(e.target.value as "entry" | "exit")
                }
              >
                <option value="entry">Check in</option>
                <option value="exit">Check out</option>
              </select>
            </label>
            <label>
              Door or barrier
              <select
                value={selectedLane?.id || ""}
                onChange={(e) => setSelectedLaneId(e.target.value)}
                disabled={topology.isPending || lanes.length === 0}
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
            </label>
            <button disabled={!code.trim()}>
              {mutation.isPending
                ? "Verifying…"
                : online
                  ? "Record and verify passage"
                  : "Queue offline check"}
            </button>
          </fieldset>
        </form>
      ) : (
        <p>You can view this checkpoint but cannot record passages.</p>
      )}
      {mutation.isError && (
        <div role="alert">
          <p>{parseApiError(mutation.error).message}</p>
          <p>
            The outcome may be unknown. Retry uses the same request to avoid a
            duplicate passage.
          </p>
          <button
            disabled={mutation.isPending}
            onClick={() => intent && mutation.mutate(intent)}
          >
            Retry same passage
          </button>
          <button
            onClick={() => {
              setIntent(null);
              mutation.reset();
              setCode("");
              setSuffix("");
            }}
          >
            Start a different passage
          </button>
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
          <button
            onClick={() => {
              setResult(null);
              setSimulation(null);
              setCode("");
              setSuffix("");
              mutation.reset();
            }}
          >
            Next person
          </button>
        </>
      )}
      <section>
        <h2>Passage history</h2>
        {!allowed("checkpoint_events.list") ? (
          <p>You do not have permission to view history.</p>
        ) : history.isPending ? (
          <p role="status">Loading history…</p>
        ) : history.isError ? (
          <Failure error={history.error} retry={() => history.refetch()} />
        ) : (
          <>
            <ul className="checkpoint-history">
              {history.data?.items.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/admin/checkpoints/${gateId}/events/${event.id}`}
                  >
                    <time>{new Date(event.occurred_at).toLocaleString()}</time>
                    <strong>
                      {event.direction === "entry" ? "Check-in" : "Checkout"} ·{" "}
                      {event.outcome}
                    </strong>
                    <span>{event.reason_code.replaceAll("_", " ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {!history.data?.items.length && (
              <p>No passages recorded at this checkpoint.</p>
            )}
            <nav aria-label="Passage pagination">
              <button
                disabled={page === 1 || history.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={
                  page >= (history.data?.total_pages || 0) || history.isFetching
                }
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
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
      <Link href={`/admin/checkpoints/${gateId}`}>← Checkpoint</Link>
      <h1>Passage record</h1>
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
