"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { useAdminGates } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { checkpointsApi } from "./api";

export function CheckpointPolicyPanel({
  placeId,
  canEdit,
}: {
  placeId: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [direction, setDirection] = useState<"entry" | "exit">("entry");
  const [routeGroup, setRouteGroup] = useState("default");
  const gates = useAdminGates({ page: 1, pageSize: 100 });
  const placeGates = (gates.data?.items ?? []).filter(
    (gate) => gate.place_id === placeId,
  );
  const movements = useQuery({
    queryKey: ["checkpoint-movements", placeId],
    queryFn: () => checkpointsApi.movements(placeId),
  });
  const create = useMutation({
    mutationFn: () =>
      checkpointsApi.createMovement({
        place_id: placeId,
        source_gate_id: sourceId,
        target_gate_id: targetId,
        direction,
        route_group: routeGroup.trim() || "default",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["checkpoint-movements", placeId],
      });
      setSourceId("");
      setTargetId("");
      toast.success("Checkpoint movement added");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const remove = useMutation({
    mutationFn: checkpointsApi.deleteMovement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["checkpoint-movements", placeId],
      });
      toast.success("Checkpoint movement retired");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <header className="border-b border-[var(--vms-line)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          Checkpoint graph
        </p>
        <h2 className="mt-1 text-lg font-semibold">Permitted movements</h2>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
          Directed edges define checkpoint order and alternative routes. Entry
          prerequisites and reverse-exit requirements are evaluated by the
          server.
        </p>
      </header>
      <div className="space-y-5 p-5">
        {canEdit ? (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_1fr_auto] md:items-end">
            <Field id="movement-source" label="From checkpoint">
              {(control) => (
                <select
                  {...control}
                  value={sourceId}
                  onChange={(event) => setSourceId(event.target.value)}
                  className={fieldControlClassName}
                >
                  <option value="">Select checkpoint</option>
                  {placeGates.map((gate) => (
                    <option key={gate.id} value={gate.id}>
                      {gate.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id="movement-target" label="To checkpoint">
              {(control) => (
                <select
                  {...control}
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className={fieldControlClassName}
                >
                  <option value="">Select checkpoint</option>
                  {placeGates
                    .filter((gate) => gate.id !== sourceId)
                    .map((gate) => (
                      <option key={gate.id} value={gate.id}>
                        {gate.name}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            <Field id="movement-direction" label="Direction">
              {(control) => (
                <select
                  {...control}
                  value={direction}
                  onChange={(event) =>
                    setDirection(event.target.value as "entry" | "exit")
                  }
                  className={fieldControlClassName}
                >
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              )}
            </Field>
            <Field
              id="movement-route-group"
              label="Route group"
              description="Use the same group for alternative paths."
            >
              {(control) => (
                <input
                  {...control}
                  value={routeGroup}
                  maxLength={64}
                  onChange={(event) => setRouteGroup(event.target.value)}
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Button
              onClick={() => create.mutate()}
              disabled={!sourceId || !targetId}
              isLoading={create.isPending}
            >
              <Plus className="h-4 w-4" />
              Add route
            </Button>
          </div>
        ) : null}

        {movements.isPending ? (
          <p className="text-sm">Loading checkpoint graph…</p>
        ) : movements.isError ? (
          <p className="text-sm text-[var(--vms-danger)]" role="alert">
            {parseApiError(movements.error).message}
          </p>
        ) : movements.data?.length ? (
          <ul className="divide-y divide-[var(--vms-line)] rounded-[var(--vms-radius-control)] border border-[var(--vms-line)]">
            {movements.data.map((movement) => (
              <li
                key={movement.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong>{movement.source_gate_name}</strong>
                  <ArrowRight
                    className="h-4 w-4 text-[var(--vms-ink-muted)]"
                    aria-hidden="true"
                  />
                  <strong>{movement.target_gate_name}</strong>
                  <span className="rounded-full border border-[var(--vms-line)] px-2 py-0.5 text-xs capitalize">
                    {movement.direction}
                  </span>
                  <span className="text-xs text-[var(--vms-ink-muted)]">
                    Route: {movement.route_group}
                  </span>
                </div>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(movement.id)}
                    aria-label={`Retire ${movement.source_gate_name} to ${movement.target_gate_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Retire
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--vms-ink-muted)]">
            No directed movements are configured. Independent checkpoints remain
            valid.
          </p>
        )}
      </div>
    </section>
  );
}
