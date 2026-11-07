"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
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
  const mutation = useMutation({
    mutationFn: (body: PassageInput) => checkpointsApi.record(gateId, body),
    onSuccess: (event) => {
      setResult(event);
      setIntent(null);
      client.invalidateQueries({
        queryKey: ["checkpoint-history", context, gateId],
      });
    },
  });
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
          Record a guest arrival or departure using their authorization code.
        </p>
      </header>
      {allowed("checkpoint_events.record") ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (intent || mutation.isPending) return;
            const body: PassageInput = {
              authorization_code: code.trim(),
              direction,
              ...(suffix ? { guest_suffix: suffix } : {}),
              idempotency_key: createIdempotencyKey(),
            };
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
            <button disabled={!code.trim()}>
              {mutation.isPending ? "Recording…" : "Record passage"}
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
          <button
            onClick={() => {
              setResult(null);
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
