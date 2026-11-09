"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useUpdateGate } from "@/hooks/use-admin";
import type { Gate } from "@/types";

export function GateDependencyEditorModal({
  open,
  gate,
  gates,
  onClose,
}: {
  open: boolean;
  gate: Gate | null;
  gates: Gate[];
  onClose: () => void;
}) {
  const [parentId, setParentId] = useState<string | undefined>();
  const update = useUpdateGate();
  const childGates = useMemo(
    () => gates.filter((candidate) => candidate.dependency_id === gate?.id),
    [gate?.id, gates],
  );

  useEffect(() => {
    setParentId(gate?.dependency_id || undefined);
  }, [gate]);

  if (!gate) return null;
  const options = gates
    .filter(
      (candidate) =>
        candidate.id !== gate.id && candidate.place_id === gate.place_id,
    )
    .map((candidate) => ({ value: candidate.id, label: candidate.name }));

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Configure dependencies for ${gate.name}`}
      description="A checkpoint may have one parent in the same property. Root checkpoints have no dependency."
    >
      <div className="space-y-5 p-5">
        <Field
          id="gate-parent-dependency"
          label="Parent checkpoint"
          description="The visitor must pass this checkpoint before the dependent checkpoint."
        >
          {() => (
            <SearchableSelect
              inputId="gate-parent-dependency"
              options={options}
              value={parentId}
              isClearable
              placeholder="No parent — root checkpoint"
              onChange={(value: string | undefined) => setParentId(value)}
            />
          )}
        </Field>

        {childGates.length ? (
          <section className="rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)]">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Dependent checkpoints are affected
            </p>
            <p className="mt-1">
              {childGates.map((child) => child.name).join(", ")} depend on this
              checkpoint. Removing or changing its parent changes their entry
              and exit sequence.
            </p>
          </section>
        ) : null}

        <section className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm text-[var(--vms-ink-muted)]">
          <p className="flex items-center gap-2 font-semibold text-[var(--vms-ink)]">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            Sequence example
          </p>
          <p className="mt-1">
            main-gate → {gate.name}
            {childGates.length
              ? ` → ${childGates.map((child) => child.name).join(" / ")}`
              : ""}
          </p>
        </section>

        {update.isError ? (
          <p role="alert" className="text-sm text-[var(--vms-danger)]">
            {update.error instanceof Error
              ? update.error.message
              : "Dependency could not be updated."}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            isLoading={update.isPending}
            disabled={parentId === (gate.dependency_id || undefined)}
            onClick={() =>
              update.mutate(
                {
                  gateId: gate.id,
                  data: { dependency_id: parentId || null },
                },
                { onSuccess: onClose },
              )
            }
          >
            Save dependency
          </Button>
        </div>
      </div>
    </Modal>
  );
}
