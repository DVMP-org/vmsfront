"use client";

import { useConfirmAction } from "@/components/ui/useConfirmAction";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BriefcaseBusiness,
  Building2,
  Pencil,
  Plus,
  RotateCcw,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import {
  placesApi,
  type Place,
  type PlaceTreeNode,
} from "@/features/places/api";
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import {
  commercialSpaceKind,
  commercialSpaceTypeLabel,
  commercialSpaceTypes,
  commercialUnitTypes,
  titleCase,
} from "./contracts";

type InventoryRow = Place & {
  location: string;
  commercial_type: string;
  occupancy: "occupied" | "vacant";
  occupants: string;
  state: "active" | "archived";
};

export default function CommercialInventory() {
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const { selectedSite, contextKey, canManageInventory } =
    useCommercialAccess();
  const client = useQueryClient();
  const placeId = selectedSite?.id || "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const tree = useQuery({
    queryKey: ["commercial", contextKey, "tree"],
    queryFn: commercialApi.tree,
    enabled: !!placeId,
  });
  const relationships = useQuery({
    queryKey: ["commercial", contextKey, "relationships", placeId, "all"],
    queryFn: () => commercialApi.relationships(),
    enabled: !!placeId,
  });
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
  const rows = useMemo<InventoryRow[]>(() => {
    const byId = new Map(allPlaces.map((place) => [place.id, place]));
    const byPlace = new Map<string, string[]>();
    for (const relationship of relationships.data?.items || []) {
      const names = byPlace.get(relationship.place.id) || [];
      names.push(relationship.party.display_name);
      byPlace.set(relationship.place.id, names);
    }
    return scopedPlaces.filter(isCommercialInventory).map((place) => {
      const parent = place.parent_id ? byId.get(place.parent_id) : null;
      const occupants = byPlace.get(place.id) || [];
      return {
        ...place,
        location: parent?.name || "Place",
        commercial_type: place.building_type || "office",
        occupancy: occupants.length ? "occupied" : "vacant",
        occupants: occupants.join(", "),
        state: place.is_active ? "active" : "archived",
      };
    });
  }, [allPlaces, relationships.data?.items, scopedPlaces]);
  const toggle = useMutation({
    mutationFn: async (ids: string[]) => {
      const targets = rows.filter((row) => ids.includes(row.id));
      const activate = targets.every((row) => !row.is_active);
      return Promise.all(
        targets.map((row) => placesApi.toggle(row.id, activate)),
      );
    },
    onSuccess: async (updated) => {
      setSelected(new Set());
      await client.invalidateQueries({
        queryKey: ["commercial", contextKey],
      });
      toast.success(
        `${updated.length} commercial space${updated.length === 1 ? "" : "s"} updated.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const filters: FilterDefinition[] = [
    {
      field: "location",
      label: "Building",
      type: "select",
      isSearchable: true,
      options: parents.map((place) => ({
        value: place.name,
        label: place.name,
      })),
    },
    {
      field: "commercial_type",
      label: "Space type",
      type: "select",
      options: commercialUnitTypes.map((type) => ({
        value: type.value,
        label: type.label,
      })),
    },
    {
      field: "occupancy",
      label: "Occupancy",
      type: "select",
      options: [
        { value: "occupied", label: "Occupied" },
        { value: "vacant", label: "Vacant" },
      ],
    },
    {
      field: "state",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
      ],
    },
  ];
  function requestArchive(row: InventoryRow) {
    if (!row.is_active) { toggle.mutate([row.id]); return; }
    confirmAction({
      title: `Archive ${row.name}?`,
      description: "This removes the space from active inventory. Existing occupancy or future use may prevent archiving.",
      confirmLabel: "Archive space",
      onConfirm: () => toggle.mutateAsync([row.id]),
    });
  }

  const columns: Column<InventoryRow>[] = [
    {
      key: "name",
      header: "Space",
      sortable: true,
      accessor: (row) => (
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
            {row.commercial_type === "shop" ||
            row.commercial_type === "retail_unit" ? (
              <Store className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Building2 className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/places/${row.id}`}
              className="block truncate font-semibold underline-offset-4 hover:underline"
            >
              {row.name}
            </Link>
            <span className="block text-xs text-[var(--vms-ink-muted)]">
              {row.location}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "commercial_type",
      header: "Type",
      sortable: true,
      accessor: (row) => commercialSpaceTypeLabel(row.commercial_type),
    },
    {
      key: "occupancy",
      header: "Occupancy",
      sortable: true,
      accessor: (row) => (
        <StatusBadge
          tone={row.occupancy === "occupied" ? "success" : "neutral"}
        >
          {titleCase(row.occupancy)}
        </StatusBadge>
      ),
    },
    {
      key: "occupants",
      header: "Business relationship",
      accessor: (row) => (
        <span className="block max-w-64 truncate">
          {row.occupants || "No active relationship"}
        </span>
      ),
    },
    {
      key: "state",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={row.is_active ? "success" : "warning"}>
          {titleCase(row.state)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      mobileHide: true,
      accessor: (row) =>
        canManageInventory ? (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${row.name}`}
              onClick={() => setEditing(row)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${row.is_active ? "Archive" : "Activate"} ${row.name}`}
              onClick={() => requestArchive(row)}
            >
              {row.is_active ? (
                <Archive className="h-4 w-4" aria-hidden="true" />
              ) : (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        ) : null,
    },
  ];
  const bulkActions: BulkAction[] = canManageInventory
    ? [
        {
          label: "Activate",
          icon: RotateCcw,
          onClick: (ids) => toggle.mutate(ids),
        },
        {
          label: "Archive",
          icon: Archive,
          variant: "destructive",
          requiresConfirmation: true,
          confirmationMessage:
            "Archive the selected commercial spaces? Active relationships or future use may prevent archiving.",
          onClick: (ids) => toggle.mutate(ids),
        },
      ]
    : [];

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
            value: parents.length,
            detail: "Containers for lettable spaces",
          },
          {
            icon: Building2,
            label: "Spaces",
            value: rows.length,
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
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search spaces, buildings or occupants"
          selectable={canManageInventory}
          selectedRows={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
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
          emptyMessage="No commercial spaces match this property."
          tableLabel="Commercial space inventory"
          mobileSummary={(row) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/places/${row.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {row.name}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {row.location} · {commercialSpaceTypeLabel(row.commercial_type)}
                  </p>
                </div>
                <StatusBadge
                  tone={row.occupancy === "occupied" ? "success" : "neutral"}
                >
                  {titleCase(row.occupancy)}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {row.occupants || "No active business relationship"}
              </p>
              {canManageInventory ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(row)}
                  >
                    Edit space
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => requestArchive(row)}
                  >
                    {row.is_active ? "Archive" : "Activate"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
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
      {confirmationDialog}
    </CommercialShell>
  );
}

function CommercialSpaceModal({
  open,
  space,
  parents,
  onClose,
  onSaved,
}: {
  open: boolean;
  space?: InventoryRow | null;
  parents: PlaceTreeNode[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const [name, setName] = useState(space?.name || "");
  const [parentId, setParentId] = useState(
    space?.parent_id || parents[0]?.id || "",
  );
  const [buildingType, setBuildingType] = useState(
    space?.building_type || "office",
  );
  const structuralKind = commercialSpaceKind(buildingType);
  const [address, setAddress] = useState(space?.address || "");
  const [description, setDescription] = useState(space?.description || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async () => {
      if (!space) {
        return placesApi.create({
          site_id:
            parents.find((parent) => parent.id === parentId)?.site_id ||
            parents[0]?.site_id ||
            selectedSite?.id ||
            "",
          name: name.trim(),
          kind: structuralKind,
          building_type: buildingType,
          address: address.trim(),
          description: description.trim(),
          parent_id: parentId || null,
        });
      }

      const updated = await placesApi.update(space.id, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
      });
      if ((space.parent_id ?? "") !== parentId) {
        await placesApi.move(space.id, parentId || null);
      }
      return updated;
    },
    onSuccess: async () => {
      toast.success(
        space ? "Commercial space updated." : "Commercial space added.",
      );
      await onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter a space name.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={space ? "Edit commercial space" : "Add commercial space"}
      description="Commercial inventory uses canonical Places; rent, tenants and access attach to the same space."
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field
          id="commercial-name"
          label="Space name"
          required
          error={errors.name}
        >
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Suite 4A · Harbour Offices"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="commercial-type"
            label="Space type"
            required
            description={
              structuralKind === "building"
                ? "Buildings can contain spaces and other buildings."
                : "Only a building can contain this space."
            }
          >
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={buildingType}
                disabled={!!space}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setBuildingType(nextType);
                  // A new building starts at the top level; a space defaults to
                  // the first building but can still be cleared to top level.
                  setParentId(
                    commercialSpaceKind(nextType) === "building"
                      ? ""
                      : (parents[0]?.id ?? ""),
                  );
                }}
              >
                {commercialSpaceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="commercial-parent"
            label="Building"
            description={
              space
                ? "Move this place to another building, or leave it at the top level of the Site."
                : structuralKind === "building"
                  ? "Optional — nest this building inside another one, or leave it at the top level."
                  : "Optional — leave empty to create it at the top level of this Site. Only buildings can contain other places."
            }
            error={errors.parent}
          >
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="">
                  {structuralKind === "building"
                    ? "Top level of this Site"
                    : "No building — top level of this Site"}
                </option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field id="commercial-address" label="Address">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
        </Field>
        <Field id="commercial-description" label="Description">
          {(control) => (
            <textarea
              {...control}
              className={`${fieldControlClassName} min-h-24 py-2`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            {space ? "Save space" : "Add space"}
          </Button>
        </div>
      </form>
    </Modal>
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
