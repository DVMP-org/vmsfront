"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { managersApi } from "@/features/managers/api";
import { parseApiError } from "@/lib/error-utils";
import { checkpointsApi } from "./api";

export function CheckpointAssignmentsModal({
  gate,
  siteId,
  onClose,
}: {
  gate: { id: string; name: string };
  siteId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string[] | null>(null);
  const managers = useQuery({
    queryKey: ["site-managers", siteId],
    queryFn: () => managersApi.list(siteId),
    retry: false,
  });
  const assignments = useQuery({
    queryKey: ["checkpoint-operators", siteId],
    queryFn: () => checkpointsApi.operators(siteId),
    retry: false,
  });
  const active = (managers.data?.managers ?? []).filter(
    (item) => item.status === "active" && item.user.is_active,
  );
  useEffect(() => {
    if (selected === null && assignments.data && managers.data) {
      const eligible = new Set(
        managers.data.managers
          .filter((item) => item.status === "active" && item.user.is_active)
          .map((item) => item.assignment_id),
      );
      setSelected(
        assignments.data.assignments
          .filter(
            (item) =>
              item.gate_id === gate.id && eligible.has(item.site_admin.id),
          )
          .map((item) => item.site_admin.id),
      );
    }
  }, [selected, assignments.data, managers.data, gate.id]);
  const save = useMutation({
    mutationFn: () => checkpointsApi.setOperators(gate.id, selected ?? []),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["checkpoint-operators", siteId],
        }),
        client.invalidateQueries({ queryKey: ["checkpoint-console"] }),
        client.invalidateQueries({ queryKey: ["checkpoint-my-assignments"] }),
      ]);
      onClose();
    },
  });
  const failed = managers.isError || assignments.isError;
  const loading = managers.isPending || assignments.isPending;
  return (
    <Modal
      isOpen
      onClose={save.isPending ? () => {} : onClose}
      title={`Assign managers — ${gate.name}`}
      description="Choose the Site managers who can operate this checkpoint. Select at least one manager."
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!loading && !failed) save.mutate();
        }}
      >
        {loading && <p role="status">Loading Site managers…</p>}
        {failed && (
          <div role="alert">
            <p>{parseApiError(managers.error || assignments.error).message}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void managers.refetch();
                void assignments.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !failed && (
          <fieldset disabled={save.isPending} className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">
              Site managers (required)
            </legend>
            {!active.length && (
              <p>No active managers are available for this Site.</p>
            )}
            {active.map((manager) => (
              <label
                key={manager.assignment_id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-[var(--vms-line)] p-3"
              >
                <input
                  type="checkbox"
                  checked={selected?.includes(manager.assignment_id) ?? false}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...(current ?? []), manager.assignment_id]
                        : (current ?? []).filter(
                            (id) => id !== manager.assignment_id,
                          ),
                    )
                  }
                />
                <span>
                  <strong className="block text-sm">{manager.user.name}</strong>
                  <span className="text-xs text-[var(--vms-ink-muted)]">
                    {manager.user.email}
                  </span>
                </span>
              </label>
            ))}
            {selected?.length === 0 && (
              <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
                No manager selected. Saving leaves this checkpoint unassigned;
                passages cannot be recorded until a manager is assigned.
              </p>
            )}
          </fieldset>
        )}
        {save.isError && (
          <p role="alert" className="text-sm text-[var(--vms-danger)]">
            {parseApiError(save.error).message}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || failed} isLoading={save.isPending}>
            Save assignments
          </Button>
        </div>
      </form>
    </Modal>
  );
}
