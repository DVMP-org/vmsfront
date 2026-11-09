"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Gate } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { checkpointsApi } from "@/features/checkpoints/api";

interface GateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gate?: Gate;
}

export function GateViewModal({ isOpen, onClose, gate }: GateViewModalProps) {
  const operators = useQuery({
    queryKey: ["checkpoint-operators", gate?.place_id],
    queryFn: () => checkpointsApi.operators(gate?.place_id),
    enabled: isOpen && !!gate?.place_id,
  });
  if (!gate) return null;
  const assignment = operators.data?.assignments.find(
    (item) => item.gate_id === gate.id,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gate details"
      size="md"
      description="Checkpoint identity, operator assignments and dependencies."
    >
      <div className="space-y-6 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
              Gate name
            </span>
            <p className="mt-1 text-sm font-medium">{gate.name}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
              Slug
            </span>
            <p className="mt-1 text-sm font-medium">{gate.slug}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
              Default gate
            </span>
            <div className="mt-1">
              <Badge variant={gate.is_default ? "success" : "secondary"}>
                {gate.is_default ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
              Created at
            </span>
            <p className="mt-1 text-sm font-medium">
              {format(new Date(gate.created_at), "PPP p")}
            </p>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
            Dependency
          </span>
          <p className="mt-1 text-sm font-medium">
            {gate.dependency?.name || gate.dependency_id || "None"}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">
            Checkpoint operator
          </span>
          {operators.isPending ? (
            <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
              Loading assignment…
            </p>
          ) : assignment ? (
            <div className="mt-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3">
              <p className="text-sm font-medium">
                {assignment.party.display_name}
              </p>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {assignment.party.email || "No email recorded"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
              Unassigned. Configure the checkpoint now and assign an operator
              before recording passages.
            </p>
          )}
        </div>

        {gate.dependencies && gate.dependencies.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase text-[var(--vms-ink-muted)]">
              Dependent gates ({gate.dependencies.length})
            </span>
            <div className="mt-2 space-y-1">
              {gate.dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-2 text-sm"
                >
                  {dep.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
