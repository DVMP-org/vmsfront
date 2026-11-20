"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { checkpointsApi } from "@/features/checkpoints/api";
import { parseApiError } from "@/lib/error-utils";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";

function readable(value?: string | null) {
  return humanize(value || "unknown");
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
      <PageHeader
        eyebrow="Access event"
        title={event.person_name || "Unknown credential"}
        description={`${event.direction === "entry" ? "Check in" : "Check out"} at ${event.gate_name || "checkpoint"}`}
        metadata={<Badge variant={event.outcome === "allowed" ? "success" : "danger"}>{humanize(event.outcome)}</Badge>}
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Occurred", formatDateTime(event.occurred_at)],
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
