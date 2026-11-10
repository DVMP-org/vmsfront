"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  QrCode,
  RefreshCcw,
  ScanLine,
  TriangleAlert,
  UserRound,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import {
  AccessCommand,
  AccessLane,
  AccessSimulationResponse,
  accessControlService,
} from "@/services/access-control-service";
import {
  checkpointsApi,
  Passage,
  PassageInput,
  type CheckpointConsoleContext,
  type CredentialPreview,
} from "./api";
import { passageMessage, reasonMessage } from "./reasons";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { workspacePermissions } from "@/features/context/api";
import { CheckpointAssignmentsModal } from "./CheckpointAssignmentsModal";
import "./styles.css";
function useCheckpointContext() {
  const org = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const site = useAppStore((s) => s.selectedProperty);
  return `${org?.id}:${user?.id}:${site?.id}`;
}
function useAccess() {
  const context = useCheckpointContext();
  const workspace = useWorkspaceContext();
  return {
    context,
    workspace,
    allowed: (permission: string) => {
      const permissions = workspacePermissions(workspace.data);
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
      <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
        {reasonMessage(event.reason_code)}
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

function movementLabel(event: Passage) {
  return event.direction === "entry" ? "Check in" : "Check out";
}

function outcomeVariant(event: Passage) {
  return event.outcome === "allowed" ? "success" : "danger";
}

function consoleInitials(value?: string | null) {
  return (
    (value || "Credential")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Compact visit-window date, e.g. "10 Nov, 09:00". */
function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Visitor state in gate language rather than server vocabulary. */
function guestStateLabel(state?: string | null) {
  switch (state) {
    case "checked_in":
      return "checked in";
    case "entry_in_progress":
      return "in progress";
    case "exit_in_progress":
      return "leaving";
    case "checked_out":
      return "checked out";
    default:
      return "expected";
  }
}

/** Semantic badge tone for a visitor's current state. */
function guestStateVariant(
  state?: string | null,
): "success" | "warning" | "neutral" | "info" {
  switch (state) {
    case "checked_in":
      return "success";
    case "entry_in_progress":
      return "info";
    case "exit_in_progress":
      return "warning";
    case "checked_out":
      return "neutral";
    default:
      return "neutral";
  }
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
  return <DefaultCheckpointDirectory />;
}

function DefaultCheckpointDirectory() {
  const access = useAccess();
  const siteId = useAppStore((state) => state.selectedProperty?.id);
  const [assigning, setAssigning] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const gates = useQuery({
    queryKey: ["checkpoint-directory", access.context],
    queryFn: () => checkpointsApi.gates(1, ""),
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
  if (gates.isPending) return <p role="status">Loading checkpoints…</p>;
  if (gates.isError)
    return <Failure error={gates.error} retry={() => gates.refetch()} />;
  const items = gates.data?.items ?? [];
  return (
    <main className="checkpoint-page">
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Access operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Checkpoints
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Every gate in this Site. Open the console to check visitors in or
            out, review dependencies, or inspect the movement log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/checkpoints/console">Open check-in console</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/passages">Movement log</Link>
          </Button>
        </div>
      </header>
      {items.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {items.map((gate) => (
            <article
              key={gate.id}
              className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                {gate.allowed_entry ? "Entry" : "No entry"}
                {gate.allowed_exit ? " · Exit" : ""}
              </span>
              <strong className="mt-2 block text-lg">{gate.name}</strong>
              <span className="mt-1 block text-sm text-[var(--vms-ink-muted)]">
                Policy version {gate.policy_version ?? 1}
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={"/admin/checkpoints/console"}>Open console</Link>
                </Button>
                {siteId &&
                  (access.allowed("gates.update") ||
                    access.allowed("places.update")) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigning(gate)}
                    >
                      Assign managers
                    </Button>
                  )}
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/checkpoints/${gate.id}`}>
                    Gate actions
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/passages?gate_id=${gate.id}`}>
                    Movement log
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-dashed)] bg-[var(--vms-surface-subtle)] p-5 text-sm">
          <p className="font-semibold">No checkpoints are configured.</p>
          <p className="mt-1">
            A permitted Site administrator can create the first gate in Site
            configuration.
          </p>
        </section>
      )}
      {assigning && siteId && (
        <CheckpointAssignmentsModal
          gate={assigning}
          siteId={siteId}
          onClose={() => setAssigning(null)}
        />
      )}
    </main>
  );
}
export function CheckpointConsole() {
  const context = useCheckpointContext();
  const checkpoint = useQuery({
    queryKey: ["checkpoint-console", context],
    queryFn: () => checkpointsApi.console(),
    retry: false,
  });
  return (
    <Console
      key={`${context}:${checkpoint.data?.id ?? "unassigned"}`}
      gate={checkpoint}
      context={context}
      showBack
    />
  );
}

export function CheckpointConsoleHub() {
  return <CheckpointConsole />;
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

function QrCameraScanner({ onCode }: { onCode: (value: string) => void }) {
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      void scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current?.clear();
      scannerRef.current = null;
    },
    [],
  );

  async function start() {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("checkpoint-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          onCode(decoded);
          setActive(false);
          void scanner.stop().catch(() => undefined);
        },
        () => undefined,
      );
      setActive(true);
    } catch {
      scannerRef.current?.clear();
      scannerRef.current = null;
      setActive(false);
      setError(
        "The camera could not start. Enter the invitation ID or badge code instead.",
      );
    }
  }

  async function stop() {
    await scannerRef.current?.stop().catch(() => undefined);
    scannerRef.current?.clear();
    scannerRef.current = null;
    setActive(false);
  }

  return (
    <div className="checkpoint-camera">
      <div id="checkpoint-qr-reader" className="checkpoint-camera-reader" />
      {!active ? (
        <div className="checkpoint-camera-placeholder">
          <span>
            <QrCode aria-hidden="true" />
          </span>
          <strong>Scan an invitation or badge</strong>
          <p>
            Use the device camera when the credential is available as a QR code.
          </p>
          <Button type="button" size="sm" onClick={() => void start()}>
            <Camera aria-hidden="true" />
            Start camera
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="light-outlined"
          className="checkpoint-camera-stop"
          onClick={() => void stop()}
        >
          Stop camera
        </Button>
      )}
      {error ? (
        <p className="checkpoint-camera-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Console({
  gate,
  context,
  showBack,
}: {
  gate: UseQueryResult<CheckpointConsoleContext, Error>;
  context: string;
  showBack: boolean;
}) {
  const gateId = gate.data?.id ?? "unassigned";
  const client = useQueryClient();
  const [code, setCode] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [pickedGuest, setPickedGuest] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
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
  const lanes = useMemo<AccessLane[]>(
    () => gate.data?.lanes ?? [],
    [gate.data?.lanes],
  );
  const selectedLane =
    lanes.find((lane) => lane.id === selectedLaneId) || lanes[0];
  const recentScans = useQuery({
    queryKey: ["checkpoint-recent-scans", context, gateId],
    queryFn: () =>
      checkpointsApi.accessEvents({
        page: 1,
        page_size: 5,
        sort: "occurred_at:desc",
      }),
  });
  const mutation = useMutation({
    mutationFn: async (body: PassageInput) => {
      const event = await checkpointsApi.record(body);
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
        queryKey: ["checkpoint-recent-scans", context, gateId],
      });
      client.invalidateQueries({
        queryKey: ["checkpoint-console", context],
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
    const timer = window.setTimeout(() => setLookupCode(code.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [code]);
  const preview = useQuery({
    queryKey: ["checkpoint-preview", context, gateId, lookupCode, pickedGuest],
    queryFn: () =>
      checkpointsApi.preview({
        credential: lookupCode,
        ...(pickedGuest ? { guest_suffix: pickedGuest } : {}),
      }),
    enabled:
      lookupCode.length >= 4 &&
      !intent &&
      !result &&
      !mutation.isPending &&
      online,
    retry: false,
    staleTime: 15_000,
    // Keep the last answer visible while the chosen visitor is re-checked so
    // the panel does not blank and flash a stale blocking reason.
    placeholderData: keepPreviousData,
  });
  const candidate: CredentialPreview | undefined = preview.data;
  const guests = candidate?.guests ?? [];
  const selectedGuest = pickedGuest ?? candidate?.selected_guest_suffix ?? null;
  const activeGuest =
    guests.find((guest) => guest.suffix === selectedGuest) ??
    (guests.length === 1 ? guests[0] : undefined);
  useEffect(() => {
    setPickedGuest(null);
  }, [lookupCode]);
  const needsGuest =
    Boolean(candidate?.requires_guest_selection) && !selectedGuest;
  // Without a preview (offline queueing or a pending lookup) the server stays
  // the authority, so the actions are only blocked by an explicit decision.
  const canCheckIn =
    !needsGuest && (candidate ? candidate.can_check_in || manualOverride : true);
  const canCheckOut =
    !needsGuest && (candidate ? candidate.can_check_out || manualOverride : true);
  const currentCheckpointName =
    result?.gate_name || gate.data?.name || undefined;
  useEffect(() => {
    if (
      !online ||
      mutation.isPending ||
      intent ||
      !queued.length ||
      !gate.data
    ) {
      return;
    }
    const next = queued[0];
    setIntent(next.input);
    mutation.mutate(next.input);
  }, [gate.data, intent, mutation, online, queued]);
  function recordPassage(nextDirection?: "entry" | "exit") {
    if (intent || mutation.isPending) return;
    if (needsGuest) {
      setQueueNotice(
        "Choose which visitor is passing before you check in or out.",
      );
      return;
    }
    const resolvedDirection = nextDirection || direction || undefined;
    const body: PassageInput = {
      credential: code.trim(),
      ...(selectedGuest ? { guest_suffix: selectedGuest } : {}),
      ...(resolvedDirection ? { direction: resolvedDirection } : {}),
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
      if (!gate.data || gate.data.offline_policy === "deny") {
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
      return;
    }
    setIntent(body);
    mutation.mutate(body);
  }

  return (
    <main className="checkpoint-page checkpoint-console-page">
      {showBack ? (
        <Link href="/admin/gates" className="checkpoint-console-back">
          Back to gates
        </Link>
      ) : null}
      <header className="checkpoint-console-heading">
        <p>Access operations</p>
        <h1>Check-in console</h1>
        <span>Validate access at the assigned checkpoint.</span>
      </header>

      {gate.isError ? (
        <Failure error={gate.error} retry={() => gate.refetch()} />
      ) : null}
      <section
        className="checkpoint-console-status"
        aria-label="Active checkpoint"
      >
        <div>
          <ScanLine aria-hidden="true" />
          <span>
            <small>Active checkpoint</small>
            <strong>
              {gate.data?.name ||
                (gate.isPending
                  ? "Loading checkpoint…"
                  : "No checkpoint assigned")}
            </strong>
          </span>
        </div>
        <div>
          <span>
            <small>Operator</small>
            <strong>{gate.data?.operator_name || "Current SiteAdmin"}</strong>
          </span>
          {gate.data?.operator_site_admin_id ? (
            <Badge variant="neutral">
              ID {gate.data.operator_site_admin_id.slice(0, 8)}
            </Badge>
          ) : null}
        </div>
        <div>
          {online ? (
            <Wifi aria-hidden="true" />
          ) : (
            <WifiOff aria-hidden="true" />
          )}
          <span>
            <small>Connection</small>
            <strong className={online ? "online" : "offline"}>
              {online ? "Online" : "Offline"}
            </strong>
          </span>
        </div>
        <div>
          <Clock3 aria-hidden="true" />
          <span>
            <small>Updated</small>
            <strong>
              {gate.dataUpdatedAt
                ? new Date(gate.dataUpdatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Just now"}
            </strong>
          </span>
        </div>
      </section>
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
      <form
        className="checkpoint-console-grid"
        onSubmit={(e) => {
          e.preventDefault();
          recordPassage();
        }}
      >
        <fieldset
          disabled={!!intent || mutation.isPending || !!result}
          className="checkpoint-console-fields"
        >
          <section className="checkpoint-scan-panel">
            <header>
              <span>
                <ScanLine aria-hidden="true" />
              </span>
              <div>
                <h2>Scan or enter credential</h2>
                <p>
                  Invitation ID, group invitation ID or badge code. The suffix
                  is derived automatically.
                </p>
              </div>
            </header>
            <div className="checkpoint-credential-entry">
              <Field
                id="checkpoint-credential"
                label="Credential"
                description="INV-123456 for one visitor, INV-123456-001 for a group member, BDG-… for a party badge."
                required
              >
                {(control) => (
                  <div className="flex items-center gap-2">
                    <input
                      {...control}
                      aria-label="Credential"
                      value={code}
                      maxLength={2048}
                      onChange={(e) => setCode(e.target.value)}
                      autoComplete="off"
                      autoCapitalize="none"
                      placeholder="INV-123456"
                      className={fieldControlClassName}
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      aria-label="Scan QR code"
                      title="Scan QR code"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] transition hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                      <QrCode aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Field>
            </div>
            <div className="checkpoint-scan-options">
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
            <details className="checkpoint-override">
              <summary>
                Authorized exception
                <span>Requires override permission and an audit reason.</span>
              </summary>
              <label>
                <input
                  type="checkbox"
                  checked={manualOverride}
                  onChange={(event) => setManualOverride(event.target.checked)}
                />
                Apply a manual checkpoint override
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
                      onChange={(event) =>
                        setOverrideReason(event.target.value)
                      }
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
              ) : null}
            </details>
            <p className="checkpoint-validation-note">
              The credential is validated by the server when you choose check in
              or check out.
            </p>
          </section>

          <section
            className={cn(
              "checkpoint-result-panel",
              result?.outcome === "allowed" && "allowed",
              result?.outcome === "denied" && "denied",
            )}
            aria-label="Checkpoint result"
          >
            <div
              className={cn(
                "checkpoint-result-banner",
                result ? result.outcome : "waiting",
              )}
            >
              {result ? (
                result.outcome === "allowed" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <XCircle aria-hidden="true" />
                )
              ) : (
                <ScanLine aria-hidden="true" />
              )}
              <div>
                <strong>
                  {result
                    ? result.outcome === "allowed"
                      ? result.direction === "entry"
                        ? "Entry permitted"
                        : "Exit permitted"
                      : "Access denied"
                    : candidate?.invitation
                      ? "Invitation recognised"
                      : candidate?.subject_type === "party"
                        ? "Badge recognised"
                        : candidate?.blocking_reason
                          ? "Credential not usable"
                          : "Awaiting credential"}
                </strong>
                <span>
                  {result
                    ? passageMessage(result)
                    : candidate
                      ? candidate.blocking_reason && !preview.isFetching
                        ? reasonMessage(candidate.blocking_reason)
                        : `${candidate.invitation?.code || candidate.credential_reference} is ready to scan.`
                      : preview.isFetching
                        ? "Checking the credential…"
                        : "Enter or scan a credential to continue."}
                </span>
              </div>
            </div>
            {result?.replayed ? (
              <p className="checkpoint-result-replayed">
                Previously recorded passage recovered. No duplicate event was
                created.
              </p>
            ) : null}
            <div className="checkpoint-result-person">
              <span className="checkpoint-result-avatar">
                {consoleInitials(
                  result?.person_name ||
                    activeGuest?.display_name ||
                    candidate?.person_name,
                )}
              </span>
              <div>
                <h2>
                  {result?.person_name ||
                    activeGuest?.display_name ||
                    candidate?.person_name ||
                    "No credential selected"}
                </h2>
                <p>
                  {result
                    ? `${result.subject_type || "credential"} · ${result.credential_reference || "reference redacted"
                    }`
                    : candidate?.invitation
                      ? `${candidate.invitation.host_name || "Host"} invited this visitor to ${candidate.invitation.place_name || "this site"}`
                      : candidate
                        ? `${candidate.subject_type} · ${candidate.credential_reference}`
                        : "Identity and invitation details appear once the credential is recognised."}
                </p>
              </div>
            </div>
            {!result && candidate?.invitation ? (
              <div className="checkpoint-invitation">
                <dl className="checkpoint-result-facts">
                  <div>
                    <dt>
                      <Clock3 aria-hidden="true" />
                      Visit window
                    </dt>
                    <dd>
                      {shortDate(candidate.invitation.valid_from)} –{" "}
                      {shortDate(candidate.invitation.valid_to)}
                    </dd>
                  </div>
                </dl>
                {guests.length > 1 ? (
                  <fieldset className="checkpoint-guest-picker">
                    <legend>
                      Visitors on this invitation ({guests.length}) — choose
                      the one who is passing
                    </legend>
                    <ul>
                      {guests.map((guest) => {
                        const active = guest.suffix === selectedGuest;
                        return (
                          <li key={guest.suffix}>
                            <button
                              type="button"
                              aria-pressed={active}
                              onClick={() => setPickedGuest(guest.suffix)}
                              className={cn(
                                "checkpoint-guest-option",
                                active && "is-active",
                              )}
                            >
                              <span className="checkpoint-result-avatar">
                                {consoleInitials(guest.display_name)}
                              </span>
                              <span>
                                <strong>{guest.display_name}</strong>
                                <small>
                                  {guest.suffix}
                                  {guest.checked_in_at
                                    ? ` · in at ${guest.checked_in_at}`
                                    : ""}
                                  {guest.next_checkpoint
                                    ? ` · next ${guest.next_checkpoint}`
                                    : ""}
                                </small>
                              </span>
                              <Badge variant={guestStateVariant(guest.state)}>
                                {guestStateLabel(guest.state)}
                              </Badge>
                              {active ? (
                                <CheckCircle2 aria-hidden="true" />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                ) : guests.length === 1 ? (
                  <p className="checkpoint-single-guest">
                    Single visitor invited — {guests[0].display_name} (
                    {guestStateLabel(guests[0].state)}
                    {guests[0].checked_in_at
                      ? ` at ${guests[0].checked_in_at}`
                      : ""}
                    ).{" "}
                    {guests[0].next_checkpoint
                      ? `They must still pass ${guests[0].next_checkpoint}.`
                      : "No guest suffix needed."}
                  </p>
                ) : null}
                {candidate.blocking_reason &&
                !needsGuest &&
                !preview.isFetching ? (
                  <p className="checkpoint-blocking" role="status">
                    {reasonMessage(candidate.blocking_reason)}
                  </p>
                ) : null}
              </div>
            ) : null}
            <dl className="checkpoint-result-facts">
              <div>
                <dt>
                  <UserRound aria-hidden="true" />
                  Checkpoint
                </dt>
                <dd>{result?.gate_name || gate.data?.name || "—"}</dd>
              </div>
              <div>
                <dt>
                  <ScanLine aria-hidden="true" />
                  Destination
                </dt>
                <dd>
                  {result?.place_name ||
                    candidate?.invitation?.place_name ||
                    gate.data?.place_name ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt>
                  <Clock3 aria-hidden="true" />
                  Direction
                </dt>
                <dd>
                  {result
                    ? result.direction === "entry"
                      ? "Check in"
                      : "Check out"
                    : candidate?.onward_required
                      ? `Proceed to ${candidate.next_checkpoint || "the next checkpoint"}`
                      : candidate?.suggested_direction
                        ? candidate.suggested_direction === "entry"
                          ? "Check in"
                          : "Check out"
                        : "Inferred by server"}
                </dd>
              </div>
              <div>
                <dt>
                  <CheckCircle2 aria-hidden="true" />
                  Access state
                </dt>
                <dd>
                  {result ? (
                    <Badge variant={guestStateVariant(result.state_after)}>
                      {guestStateLabel(result.state_after)}
                    </Badge>
                  ) : activeGuest ? (
                    <Badge variant={guestStateVariant(activeGuest.state)}>
                      {guestStateLabel(activeGuest.state)}
                    </Badge>
                  ) : (
                    "Not yet recorded"
                  )}
                </dd>
              </div>
            </dl>
            <div className="checkpoint-result-actions">
              <Button
                type="button"
                size="lg"
                disabled={
                  !code.trim() ||
                  !canCheckIn ||
                  (manualOverride && !overrideReason.trim()) ||
                  mutation.isPending
                }
                isLoading={mutation.isPending && direction === "entry"}
                onClick={() => {
                  setDirection("entry");
                  recordPassage("entry");
                }}
              >
                <LogIn aria-hidden="true" />
                Check in
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                disabled={
                  !code.trim() ||
                  !canCheckOut ||
                  (manualOverride && !overrideReason.trim()) ||
                  mutation.isPending
                }
                isLoading={mutation.isPending && direction === "exit"}
                onClick={() => {
                  setDirection("exit");
                  recordPassage("exit");
                }}
              >
                <LogOut aria-hidden="true" />
                Check out
              </Button>
            </div>
            {candidate?.onward_required && candidate.next_checkpoint ? (
              <div className="checkpoint-proceed" role="status">
                <ArrowRight aria-hidden="true" />
                <div>
                  <strong>Proceed to {candidate.next_checkpoint}</strong>
                  <span>
                    {activeGuest?.display_name || "This visitor"} has checked in
                    {activeGuest?.checked_in_at
                      ? ` at ${activeGuest.checked_in_at}`
                      : ""}{" "}
                    and must check in at {candidate.next_checkpoint}. Nothing is
                    recorded at this checkpoint.
                  </span>
                </div>
              </div>
            ) : needsGuest ? (
              <p className="checkpoint-direction-note">
                Choose a visitor from the list to continue.
              </p>
            ) : candidate && !manualOverride ? (
              canCheckIn && canCheckOut ? (
                <p className="checkpoint-direction-note">
                  Both directions are available for this credential.
                </p>
              ) : canCheckIn || canCheckOut ? (
                <div className="checkpoint-direction-warning" role="status">
                  <TriangleAlert aria-hidden="true" />
                  <div>
                    <strong>
                      {canCheckIn
                        ? "This visitor is not checked in at this checkpoint yet — check in is available."
                        : `This visitor is checked in${
                            activeGuest?.checked_in_at
                              ? ` at ${activeGuest.checked_in_at}`
                              : ""
                          } — check out is available.`}
                    </strong>
                    <span>
                      {activeGuest?.next_checkpoint &&
                      activeGuest.next_checkpoint !== currentCheckpointName
                        ? `Next required checkpoint: ${activeGuest.next_checkpoint}.`
                        : canCheckIn && activeGuest?.checked_in_at
                          ? `They have already passed ${activeGuest.checked_in_at}.`
                          : "This is the only checkpoint for their visit."}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="checkpoint-direction-note">
                  No transition is available for this credential.
                </p>
              )
            ) : (
              <p className="checkpoint-direction-note">
                Direction is inferred from the latest checkpoint event, but the
                selected action remains explicit.
              </p>
            )}
          </section>
        </fieldset>
      </form>
      {result ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIntent(null);
              setResult(null);
              setSimulation(null);
              mutation.reset();
              setCode("");
              setDirection("");
            }}
          >
            <UserRound aria-hidden="true" />
            Next person
          </Button>
        </div>
      ) : null}
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
        >
          <p className="font-semibold">
            The passage was not recorded. Nothing changed at the gate.
          </p>
          <p className="mt-1">{parseApiError(mutation.error).message}</p>
          <p className="mt-1">
            If the connection dropped mid-request, retrying reuses the same
            request so you cannot create a duplicate passage.
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
            }}
          >
            Start a different passage
          </Button>
        </div>
      )}
      {result && (
        <>
          <HardwareState
            lane={selectedLane}
            simulation={simulation}
            loading={gate.isFetching}
            onRefresh={() => {
              gate.refetch();
            }}
          />

        </>
      )}
      <section className="checkpoint-recent">
        <header>
          <div>
            <h2>Last 5 scans</h2>
            <p>Most recent checkpoint decisions at this gate.</p>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={recentScans.isFetching}
              onClick={() => recentScans.refetch()}
            >
              <RefreshCcw aria-hidden="true" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/passages">
                View movement logs
                <ScanLine aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>
        <div className="checkpoint-recent-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Person</th>
                <th>Credential</th>
                <th>Decision</th>
                <th>Movement</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.isPending ? (
                <tr>
                  <td colSpan={5}>Loading recent scans…</td>
                </tr>
              ) : recentScans.isError ? (
                <tr>
                  <td colSpan={5}>
                    Recent scans could not be loaded.{" "}
                    {parseApiError(recentScans.error).message}
                  </td>
                </tr>
              ) : recentScans.data?.items.length ? (
                recentScans.data.items.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <time dateTime={event.occurred_at}>
                        {new Date(event.occurred_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    </td>
                    <td>
                      <span className="checkpoint-recent-person">
                        <UserRound aria-hidden="true" />
                        {event.person_name || "Unknown credential"}
                      </span>
                    </td>
                    <td>{event.credential_reference || "Redacted"}</td>
                    <td>
                      <Badge variant={outcomeVariant(event)}>
                        {event.outcome === "allowed"
                          ? event.direction === "entry"
                            ? "Entry permitted"
                            : "Exit permitted"
                          : "Entry denied"}
                      </Badge>
                    </td>
                    <td>
                      {movementLabel(event)} ·{" "}
                      {event.gate_name || gate.data?.name || "Checkpoint"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No checkpoint scans recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {scannerOpen ? (
        <ScannerOverlay
          onClose={() => setScannerOpen(false)}
          onCode={(value) => {
            setCode(value);
            setScannerOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

/**
 * Full-screen scanner with a moving beam so the operator can tell at a glance
 * that the camera is live. Any decoded value lands in the credential field.
 */
function ScannerOverlay({
  onClose,
  onCode,
}: {
  onClose: () => void;
  onCode: (value: string) => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scan access credential"
        className="w-full max-w-sm rounded-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 shadow-[var(--vms-shadow-overlay)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--vms-ink)]">
              Scan QR code
            </h2>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              Point the camera at the invitation or badge code.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="checkpoint-scan-frame mt-3">
          <QrCameraScanner onCode={onCode} />
          <span aria-hidden="true" className="checkpoint-scan-corner tl" />
          <span aria-hidden="true" className="checkpoint-scan-corner tr" />
          <span aria-hidden="true" className="checkpoint-scan-corner bl" />
          <span aria-hidden="true" className="checkpoint-scan-corner br" />
          <span aria-hidden="true" className="checkpoint-scan-beam" />
        </div>
        <p className="mt-3 text-center text-[11px] text-[var(--vms-ink-muted)]">
          Codes are read automatically — no need to press anything.
        </p>
      </div>
    </div>
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
