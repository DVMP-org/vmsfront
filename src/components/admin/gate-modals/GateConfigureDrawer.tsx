"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Pencil, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { checkpointsApi } from "@/features/checkpoints/api";
import { CheckpointAssignmentsModal } from "@/features/checkpoints/CheckpointAssignmentsModal";
import type { Gate } from "@/types";

const credentialLabels: Record<string, string> = {
  invitation_code: "Invitation code",
  invitation_qr: "Invitation QR",
  badge_qr: "Badge QR",
  permanent_code: "Permanent code",
};

/**
 * Gate details and configuration in a side drawer.
 *
 * Replaces the old read-only view modal and the separate operator settings so
 * one surface holds the checkpoint's details, policies, dependencies and
 * operators.
 */
export function GateConfigureDrawer({
  open,
  gate,
  onClose,
  onEdit,
  onEditDependency,
}: {
  open: boolean;
  gate: Gate | null;
  onClose: () => void;
  onEdit: (gate: Gate) => void;
  onEditDependency: (gate: Gate) => void;
}) {
  const [operatorsOpen, setOperatorsOpen] = useState(false);
  const siteId = gate?.site_id ?? null;
  const operators = useQuery({
    queryKey: ["checkpoint-operators", siteId],
    queryFn: () => checkpointsApi.operators(siteId),
    enabled: open && Boolean(siteId),
    retry: false,
  });
  const assigned = useMemo(
    () =>
      (operators.data?.assignments ?? []).filter(
        (assignment) => assignment.gate_id === gate?.id,
      ),
    [operators.data?.assignments, gate?.id],
  );

  if (!gate) return null;

  const schedule = gate.access_schedule;
  const scheduleLabel = schedule
    ? [
        schedule.start && schedule.end
          ? `${schedule.start}–${schedule.end}`
          : "All hours",
        schedule.days?.length
          ? schedule.days
              .map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day])
              .join(", ")
          : "Every day",
      ].join(" · ")
    : "Always open";

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={onClose}
        title={gate.name}
        description={`Checkpoint · ${gate.slug}`}
        className="max-w-xl"
      >
        <div className="flex min-h-full flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={gate.is_default ? "success" : "secondary"}>
              {gate.is_default ? "Default gate" : "Gate"}
            </Badge>
            <Badge variant={gate.dependency_id ? "info" : "neutral"}>
              {gate.dependency?.name
                ? `After ${gate.dependency.name}`
                : "No dependency"}
            </Badge>
          </div>

          <section aria-label="Gate policies">
            <h3 className="text-sm font-semibold">Checkpoint policies</h3>
            <dl className="mt-2 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
              <Fact
                label="Entry"
                value={gate.allowed_entry === false ? "Not allowed" : "Allowed"}
              />
              <Fact
                label="Exit"
                value={gate.allowed_exit === false ? "Not allowed" : "Allowed"}
              />
              <Fact
                label="Direction"
                value={
                  gate.automatic_direction === false
                    ? "Operator chooses"
                    : "Inferred by server"
                }
              />
              <Fact
                label="Re-entry"
                value={humanizePolicy(gate.reentry_policy)}
              />
              <Fact
                label="Offline"
                value={humanizePolicy(gate.offline_policy)}
              />
              <Fact label="Schedule" value={scheduleLabel} />
            </dl>
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--vms-ink-muted)]">
                Accepted credentials
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(gate.allowed_credential_types?.length
                  ? gate.allowed_credential_types
                  : []
                ).length ? (
                  gate.allowed_credential_types!.map((type) => (
                    <Badge key={type} variant="neutral">
                      {credentialLabels[type] ?? type}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">Every credential type</Badge>
                )}
              </div>
            </div>
          </section>

          <section aria-label="Checkpoint operators">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Operators</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOperatorsOpen(true)}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Manage managers
              </Button>
            </div>
            {operators.isPending ? (
              <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                Loading operators…
              </p>
            ) : assigned.length ? (
              <ul className="mt-2 divide-y divide-[var(--vms-line)]">
                {assigned.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">
                        {assignment.site_admin.user.name}
                      </strong>
                      <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
                        {assignment.site_admin.user.email || "Site manager"}
                      </span>
                    </span>
                    <Users
                      className="h-4 w-4 text-[var(--vms-ink-muted)]"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--vms-warning)]">
                No manager is assigned. Passages cannot be recorded here until
                one is.
              </p>
            )}
          </section>

          <section aria-label="Dependency">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Dependency</h3>
                <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                  {gate.dependency?.name
                    ? `Visitors must pass ${gate.dependency.name} first.`
                    : "This checkpoint has no parent checkpoint."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditDependency(gate)}
              >
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                Change
              </Button>
            </div>
          </section>

          <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={() => onEdit(gate)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit gate
            </Button>
          </div>
        </div>
      </Drawer>

      {operatorsOpen ? (
        <CheckpointAssignmentsModal
          gate={gate}
          siteId={gate.site_id}
          onClose={() => setOperatorsOpen(false)}
        />
      ) : null}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] px-3 py-2">
      <dt className="text-[var(--vms-ink-muted)]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function humanizePolicy(value?: string | null) {
  if (!value) return "Default";
  return value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}
