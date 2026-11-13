"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, Plus, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { parseApiError } from "@/lib/error-utils";
import { placesApi } from "@/features/places/api";
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import { descendantIds, flattenPlaces, isCommercialPlace } from "./api";
import { buildInventoryRows, type InventoryRow } from "./lib";
import {
  useCommercialInventoryRelationships,
  useCommercialTree,
} from "./queries";
import { CommercialInventoryTable } from "./components/CommercialInventoryTable";
import { CommercialSpaceModal } from "./components/CommercialSpaceModal";

export default function CommercialInventory() {
  const { selectedSite, contextKey, canManageInventory } =
    useCommercialAccess();
  const client = useQueryClient();
  const placeId = selectedSite?.id || "";
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const tree = useCommercialTree(contextKey, Boolean(placeId));
  const relationships = useCommercialInventoryRelationships(
    contextKey,
    Boolean(placeId),
  );
  const allPlaces = useMemo(
    () => (tree.data ? flattenPlaces(tree.data) : []),
    [tree.data],
  );
  const scopeIds = useMemo(
    () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
    [placeId, tree.data],
  );
  const scopedPlaces = useMemo(
    () => allPlaces.filter((place) => scopeIds.has(place.id)),
    [allPlaces, scopeIds],
  );
  const parents = scopedPlaces.filter((place) => place.kind === "building");
  const rows = useMemo(
    () =>
      buildInventoryRows(
        scopedPlaces.filter(isCommercialPlace),
        allPlaces,
        relationships.data?.items ?? [],
      ),
    [allPlaces, relationships.data?.items, scopedPlaces],
  );
  const toggle = useMutation({
    mutationFn: async (targets: InventoryRow[]) => {
      const activate = targets.every((row) => !row.is_active);
      return Promise.all(
        targets.map((row) => placesApi.toggle(row.id, activate)),
      );
    },
    onSuccess: async (updated) => {
      await client.invalidateQueries({
        queryKey: ["commercial", contextKey],
      });
      toast.success(
        `${updated.length} commercial space${updated.length === 1 ? "" : "s"} updated.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  return (
    <CommercialShell
      title="Commercial inventory"
      description="Office, shop, retail, warehouse and conference inventory with occupancy and operating state."
      primaryAction={
        canManageInventory ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add commercial space
          </Button>
        ) : undefined
      }
    >
      <SummaryStrip
        items={[
          {
            icon: Building2,
            label: "Buildings",
            value: rows.filter((row) => row.is_container).length,
            detail: "Containers for lettable spaces",
          },
          {
            icon: Building2,
            label: "Spaces",
            value: rows.filter((row) => !row.is_container).length,
            detail: "Across this property hierarchy",
          },
          {
            icon: BriefcaseBusiness,
            label: "Occupied",
            value: rows.filter((row) => row.occupancy === "occupied").length,
            detail: "At least one active relationship",
          },
          {
            icon: Store,
            label: "Vacant",
            value: rows.filter((row) => row.occupancy === "vacant").length,
            detail: "Available for a business tenant",
          },
        ]}
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <CommercialInventoryTable
          rows={rows}
          canManage={canManageInventory}
          onEdit={setEditing}
          onToggleState={(targets) => toggle.mutateAsync(targets)}
          isLoading={tree.isPending || relationships.isPending}
          errorMessage={
            tree.isError || relationships.isError
              ? parseApiError(tree.error || relationships.error).message
              : null
          }
          isStale={(tree.isError || relationships.isError) && rows.length > 0}
          onRetry={() => {
            void tree.refetch();
            void relationships.refetch();
          }}
        />
      </section>
      <CommercialSpaceModal
        key={`create:${createOpen}:${parents[0]?.id || "none"}`}
        open={createOpen}
        parents={parents}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false);
          await client.invalidateQueries({
            queryKey: ["commercial", contextKey],
          });
        }}
      />
      <CommercialSpaceModal
        key={`edit:${editing?.id || "none"}`}
        open={!!editing}
        space={editing}
        parents={parents}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await client.invalidateQueries({
            queryKey: ["commercial", contextKey],
          });
        }}
      />
    </CommercialShell>
  );
}

function SummaryStrip({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: number;
    detail: string;
  }>;
}) {
  return (
    <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value, detail }) => (
        <div
          key={label}
          className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
        </div>
      ))}
    </section>
  );
}
