"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { checkpointsApi } from "@/features/checkpoints/api";
import { parseApiError } from "@/lib/error-utils";

function readable(value?: string | null) {
  return (value || "unknown").replaceAll("_", " ");
}

export function AccessEventDetail({ eventId }: { eventId: string }) {
  const query = useQuery({
    queryKey: ["access-event", eventId],
    queryFn: () => checkpointsApi.accessEvent(eventId),
  });
  if (query.isPending) return <p role="status">Loading access event…</p>;
  if (query.isError) {
    return (
      <div role="alert">
        <p>{parseApiError(query.error).message}</p>
        <Button className="mt-3" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  const event = query.data;
  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <Link
        href="/admin/passages"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
      >
        Back to passage history
      </Link>
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Access event
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {event.person_name || "Unknown credential"}
          </h1>
          <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
            {event.direction === "entry" ? "Check in" : "Check out"} at{" "}
            {event.gate_name || "checkpoint"}
          </p>
        </div>
        <Badge variant={event.outcome === "allowed" ? "success" : "danger"}>
          {event.outcome}
        </Badge>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Occurred", new Date(event.occurred_at).toLocaleString()],
          ["Property", event.place_name || "Unknown"],
          ["Checkpoint", event.gate_name || "Unknown"],
          ["Person type", readable(event.subject_type)],
          ["Credential type", readable(event.credential_type)],
          ["Credential reference", event.credential_reference || "Redacted"],
          [
            "State transition",
            `${readable(event.state_before)} to ${readable(event.state_after)}`,
          ],
          ["Policy version", String(event.policy_version || "Unknown")],
          ["Operator", event.operator_name || "Device or system"],
          ["Device", event.device_id || "Not supplied"],
          ["Reason", readable(event.reason_code)],
          ["Override", event.manual_override ? "Yes" : "No"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold capitalize">{value}</p>
          </article>
        ))}
      </section>
      {event.override_reason ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-5 text-sm text-[var(--vms-warning)]">
          <strong>Override reason</strong>
          <p className="mt-1">{event.override_reason}</p>
        </section>
      ) : null}
    </main>
  );
}
