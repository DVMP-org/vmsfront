"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { checkpointsApi } from "@/features/checkpoints/api";
import { peopleApi } from "@/features/people/api";
import { parseApiError } from "@/lib/error-utils";
import type { Gate } from "@/types";

export function GateOperatorModal({
  open,
  onClose,
  gate,
}: {
  open: boolean;
  onClose: () => void;
  gate: Gate | null;
}) {
  const queryClient = useQueryClient();
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const placeId = gate?.place_id;

  const people = useQuery({
    queryKey: ["place-people", placeId],
    queryFn: () => peopleApi.get(placeId!),
    enabled: open && !!placeId,
    retry: false,
  });
  const assignments = useQuery({
    queryKey: ["checkpoint-operators", placeId],
    queryFn: () => checkpointsApi.operators(placeId),
    enabled: open && !!placeId,
    retry: false,
  });

  const currentAssignment = useMemo(
    () =>
      assignments.data?.assignments.find(
        (assignment) => assignment.gate_id === gate?.id,
      ) ?? null,
    [assignments.data?.assignments, gate?.id],
  );
  const administratorOptions = useMemo(
    () =>
      (people.data?.administrators ?? []).map((administrator) => ({
        value: administrator.party.id,
        label: administrator.party.display_name,
      })),
    [people.data?.administrators],
  );
  const effectivePartyId = selectedPartyId || currentAssignment?.party.id || "";
  const assign = useMutation({
    mutationFn: (partyId: string) =>
      checkpointsApi.assignOperator(gate!.id, partyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["checkpoint-operators", placeId],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "gates"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "gate"] }),
      ]);
      setSubmitError("");
      onClose();
    },
    onError: (error) => setSubmitError(parseApiError(error).message),
  });

  if (!gate) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Checkpoint operator for ${gate.name}`}
      description="One active site administrator is accountable for passages recorded here. Reassigning keeps the previous assignment in history."
    >
      <div className="space-y-5 p-5">
        <Field
          id="checkpoint-operator"
          label="Assigned administrator"
          description="Only active administrators of this site can be assigned."
          required
          error={
            people.isError ? parseApiError(people.error).message : undefined
          }
        >
          {() => (
            <SearchableSelect
              inputId="checkpoint-operator"
              isClearable={false}
              isDisabled={
                people.isPending ||
                assignments.isPending ||
                !administratorOptions.length
              }
              isLoading={people.isPending || assignments.isPending}
              options={administratorOptions}
              placeholder={
                administratorOptions.length
                  ? "Select a site administrator"
                  : "No active site administrators"
              }
              value={effectivePartyId || undefined}
              onChange={(partyId: string | undefined) => {
                setSelectedPartyId(partyId ?? "");
                setSubmitError("");
              }}
            />
          )}
        </Field>
        {currentAssignment ? (
          <p className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3 text-sm text-[var(--vms-ink-muted)]">
            Currently assigned to{" "}
            <strong className="text-[var(--vms-ink)]">
              {currentAssignment.party.display_name}
            </strong>
            . Selecting another administrator reassigns this checkpoint.
          </p>
        ) : (
          <p className="rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)]/40 bg-[var(--vms-warning-subtle)] p-3 text-sm text-[var(--vms-warning)]">
            This checkpoint is unassigned. It can remain unassigned while being
            configured, but passages cannot be recorded until an operator is
            assigned.
          </p>
        )}
        {submitError ? (
          <p
            role="alert"
            className="rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
          >
            {submitError}
          </p>
        ) : null}
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] bg-[var(--vms-surface)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={assign.isPending}
            disabled={
              !effectivePartyId ||
              effectivePartyId === currentAssignment?.party.id
            }
            onClick={() => assign.mutate(effectivePartyId)}
          >
            {currentAssignment ? "Reassign operator" : "Assign operator"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
