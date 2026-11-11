"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  Database,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Drawer } from "@/components/ui/Drawer";
import { PropertyImage } from "@/components/ui/PropertyImage";
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
import { useSiteAccess } from "@/features/context/use-site-access";
import { formatCurrency } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import {
  placesApi,
  type Place,
  type PlaceTreeNode,
} from "@/features/places/api";
import { PlaceAssignmentModal } from "@/features/places/PlaceAssignmentModal";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";

type UnitRow = Place & {
  building_id: string;
  building_name: string;
  status: string;
  occupancy_status: string;
  residents: string;
};
type ParentChoice = Pick<PlaceTreeNode, "id" | "name" | "site_id"> & {
  kind: string;
};

const unitTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "suite", label: "Suite" },
  { value: "townhouse", label: "Townhouse" },
  { value: "duplex", label: "Duplex" },
];

export default function ResidentialUnits() {
  const { contextKey, selectedSite, canManageUnits, canManagePeople } =
    useResidentialAccess();
  const { allowed } = useSiteAccess();
  const queryClient = useQueryClient();
  const placeId = selectedSite?.id || "";
  const [createOpen, setCreateOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<UnitRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPlaceId, setAssignPlaceId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1" && canManageUnits) setCreateOpen(true);
    if (params.get("unit")) setDetailId(params.get("unit"));
  }, [canManageUnits]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const charges = useQuery({
    queryKey: ["residential", contextKey, "charge-assignments", placeId],
    queryFn: residentialApi.chargeAssignments,
    enabled: !!detailId && !!placeId && allowed("charges.list"),
    retry: false,
  });
  const relationships = useQuery({
    queryKey: ["residential", contextKey, "relationships", placeId],
    queryFn: () => residentialApi.relationships({ status: "active" }),
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
  const parentPlaces = scopedPlaces.filter(
    (place) => place.kind === "building",
  );
  const parentChoices = useMemo<ParentChoice[]>(() => {
    if (!selectedSite) return parentPlaces;
    return [
      {
        id: `site:${selectedSite.id}`,
        name: selectedSite.name,
        site_id: selectedSite.id,
        kind: "site",
      },
      ...parentPlaces,
    ];
  }, [parentPlaces, selectedSite]);
  const unitRows = useMemo<UnitRow[]>(() => {
    const byId = new Map(allPlaces.map((place) => [place.id, place]));
    const relationshipsByPlace = new Map<
      string,
      Array<{ display_name: string; role: string }>
    >();
    (relationships.data?.items || []).forEach((relationship) => {
      const rows = relationshipsByPlace.get(relationship.place.id) || [];
      rows.push({
        display_name: relationship.party.display_name,
        role: relationship.role,
      });
      relationshipsByPlace.set(relationship.place.id, rows);
    });
    return scopedPlaces
      .filter((place) => place.kind === "unit")
      .map((place) => {
        const parent = place.parent_id ? byId.get(place.parent_id) : undefined;
        const residents = relationshipsByPlace.get(place.id) || [];
        const rootParentId = selectedSite
          ? `site:${selectedSite.id}`
          : "";
        return {
          ...place,
          building_id: parent?.id || (place.parent_id ? "" : rootParentId),
          building_name:
            parent?.name ||
            (place.parent_id
              ? "Unknown building"
              : selectedSite?.name || "Site root"),
          status: place.is_active ? "active" : "archived",
          occupancy_status: residents.length ? "occupied" : "vacant",
          residents: residents.map((row) => row.display_name).join(", "),
        };
      });
  }, [allPlaces, relationships.data?.items, scopedPlaces, selectedSite]);

  const toggle = useMutation({
    mutationFn: async (ids: string[]) => {
      const targets = unitRows.filter((row) => ids.includes(row.id));
      const shouldActivate = targets.every((row) => !row.is_active);
      return Promise.all(
        targets.map((row) => placesApi.toggle(row.id, shouldActivate)),
      );
    },
    onSuccess: async (updated) => {
      setSelected(new Set());
      await queryClient.invalidateQueries({
        queryKey: ["residential", contextKey],
      });
      toast.success(
        `${updated.length} unit${updated.length === 1 ? "" : "s"} updated.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const filters: FilterDefinition[] = [
    {
      field: "building_id",
      label: "Building",
      type: "select",
      isSearchable: true,
      options: parentPlaces.map((place) => ({
        value: place.id,
        label: place.name,
      })),
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      field: "occupancy_status",
      label: "Occupancy",
      type: "select",
      options: [
        { value: "occupied", label: "Occupied" },
        { value: "vacant", label: "Vacant" },
      ],
    },
    {
      field: "building_type",
      label: "Unit type",
      type: "select",
      options: unitTypes,
    },
  ];
  const columns: Column<UnitRow>[] = [
    {
      key: "name",
      header: "Unit",
      sortable: true,
      accessor: (unit) => (
        <span className="flex min-w-0 items-center gap-3">
          <PropertyImage name={unit.name} className="h-10 w-10" />
          <span className="min-w-0">
            <button
              type="button"
              onClick={() => setDetailId(unit.id)}
              className="block max-w-full truncate text-left font-semibold underline-offset-4 hover:underline disabled:no-underline"
            >
              {unit.name}
            </button>
            <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
              {unitTypes.find((type) => type.value === unit.building_type)
                ?.label || "Unit"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "building_name",
      header: "Building / floor",
      sortable: true,
      accessor: (unit) => unit.building_name,
    },
    {
      key: "residents",
      header: "Resident",
      accessor: (unit) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={unit.residents} size="md" tone="info" decorative />
          <span className="block max-w-48 truncate text-sm">
            {unit.residents || "No resident"}
          </span>
        </span>
      ),
    },
    {
      key: "occupancy_status",
      header: "Occupancy",
      sortable: true,
      accessor: (unit) => (
        <StatusBadge
          tone={unit.occupancy_status === "occupied" ? "success" : "neutral"}
        >
          {unit.occupancy_status === "occupied" ? "Occupied" : "Vacant"}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (unit) => (
        <StatusBadge tone={unit.is_active ? "success" : "warning"}>
          {unit.is_active ? "Active" : "Archived"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      mobileHide: true,
      accessor: (unit) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailId(unit.id)}
            aria-label={`Open ${unit.name}`}
          >
            Open
          </Button>
          {canManageUnits && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditUnit(unit)}
                aria-label={`Edit ${unit.name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggle.mutate([unit.id])}
                aria-label={`${unit.is_active ? "Archive" : "Activate"} ${unit.name}`}
              >
                {unit.is_active ? (
                  <Archive className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = canManageUnits
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
            "Archive the selected units? Active occupancy and future room use may prevent archiving.",
          onClick: (ids) => toggle.mutate(ids),
        },
      ]
    : [];

  const primaryAction = canManageUnits ? (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add unit
    </Button>
  ) : undefined;

  return (
    <ResidentialShell
      showWorkspace
      title="Units"
      description={`Unit directory for ${selectedSite?.name || "the selected"} residential property.`}
      primaryAction={primaryAction}
    >
      <div>
        <section className="min-w-0">
          <DataTable
            data={unitRows}
            columns={columns}
            availableFilters={filters}
            searchPlaceholder="Search units, buildings or residents"
            selectable={canManageUnits}
            selectedRows={selected}
            onSelectionChange={setSelected}
            bulkActions={bulkActions}
            isLoading={tree.isPending || relationships.isPending}
            errorMessage={
              tree.isError || relationships.isError
                ? parseApiError(tree.error || relationships.error).message
                : null
            }
            isStale={
              (tree.isError || relationships.isError) && unitRows.length > 0
            }
            onRetry={() => {
              void tree.refetch();
              void relationships.refetch();
            }}
            emptyMessage="No units match this view. Add a unit to begin the residential inventory."
            tableLabel="Residential unit inventory"
            rowClassName={(unit) =>
              detailId === unit.id ? "bg-[var(--vms-coral-soft)]" : ""
            }
            scrollHint="Scroll horizontally to compare unit type, occupancy and status."
            mobileSummary={(unit) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => setDetailId(unit.id)}
                      className="text-left font-semibold underline-offset-4 hover:underline"
                    >
                      {unit.name}
                    </button>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                      {unit.building_name}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      unit.occupancy_status === "occupied"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {unit.occupancy_status === "occupied"
                      ? "Occupied"
                      : "Vacant"}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[var(--vms-ink-muted)]">
                  {unit.residents || "No active household"}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailId(unit.id)}
                  >
                    Open
                  </Button>
                  {canManageUnits ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditUnit(unit)}
                      >
                        Edit unit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggle.mutate([unit.id])}
                      >
                        {unit.is_active ? "Archive" : "Activate"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          />
        </section>
        {unitRows.find((unit) => unit.id === detailId) &&
          (() => {
            const unit = unitRows.find((item) => item.id === detailId)!;
            return (
              <Drawer
                isOpen={true}
                className="max-w-[390px]"
                contentClassName="p-0 sm:p-0"
                title={unit.name}
                description={unit.building_name}
                onClose={() => setDetailId(null)}
              >
                <div className="space-y-4 border-b border-[var(--vms-line)] p-4">
                  <StatusBadge
                    tone={
                      unit.occupancy_status === "occupied"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {unit.occupancy_status === "occupied"
                      ? "Occupied"
                      : "Vacant"}
                  </StatusBadge>
                  <div className="flex gap-4">
                    <PropertyImage name={unit.name} className="h-20 w-20" />
                    <dl className="min-w-0 flex-1 text-sm">
                      <div className="flex justify-between gap-3 border-b border-[var(--vms-line)] py-2">
                        <dt className="text-[var(--vms-ink-muted)]">
                          Unit type
                        </dt>
                        <dd className="text-right font-medium">
                          {unitTypes.find(
                            (type) => type.value === unit.building_type,
                          )?.label || "Unit"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2">
                        <dt className="text-[var(--vms-ink-muted)]">
                          Building
                        </dt>
                        <dd className="text-right font-medium">
                          {unit.building_name}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="space-y-3 border-b border-[var(--vms-line)] p-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Users className="h-4 w-4" aria-hidden /> Occupant
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar name={unit.residents} decorative tone="info" />
                    <p className="text-sm">
                      {unit.residents || "No active household"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 border-b border-[var(--vms-line)] p-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Database className="h-4 w-4" aria-hidden /> Charges &amp;
                    balance
                  </h3>
                  {!allowed("charges.list") ? (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                      Charge information is not available with your access.
                    </p>
                  ) : charges.isPending ? (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                      Loading charges…
                    </p>
                  ) : charges.isError ? (
                    <div className="text-sm text-[var(--vms-danger)]">
                      Could not load charges.{" "}
                      <button
                        className="underline"
                        onClick={() => charges.refetch()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <UnitCharges
                      assignments={(charges.data || []).filter(
                        (item) => item.target_place.id === unit.id,
                      )}
                    />
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Zap className="h-4 w-4" aria-hidden /> Quick actions
                  </h3>
                  <Button asChild className="w-full">
                    <Link href={`/admin/places/${unit.id}`}>
                      <ExternalLink className="h-4 w-4" aria-hidden /> View unit
                    </Link>
                  </Button>
                  {canManagePeople && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setAssignPlaceId(unit.id);
                        setDetailId(null);
                        setAssignOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden /> Assign
                      resident
                    </Button>
                  )}
                </div>
              </Drawer>
            );
          })()}
      </div>

      <PlaceAssignmentModal
        title="Assign a household relationship"
        placeLabel="Unit"
        key={`assign:${assignOpen}:${assignPlaceId || "none"}`}
        open={assignOpen}
        defaultPlaceId={assignPlaceId || undefined}
        siteId={placeId}
        places={unitRows}
        contextKey={contextKey}
        onClose={() => setAssignOpen(false)}
        onSaved={() => {
          setAssignOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
      <UnitFormModal
        key={`create:${createOpen}:${parentChoices[0]?.id || "none"}`}
        open={createOpen}
        mode="create"
        parents={parentChoices}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
      <UnitFormModal
        key={`edit:${editUnit?.id || "none"}`}
        open={!!editUnit}
        mode="edit"
        unit={editUnit}
        parents={parentChoices}
        onClose={() => setEditUnit(null)}
        onSaved={() => {
          setEditUnit(null);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
    </ResidentialShell>
  );
}

function UnitCharges({
  assignments,
}: {
  assignments: import("@/features/charges/api").Assignment[];
}) {
  if (!assignments.length)
    return (
      <p className="text-sm text-[var(--vms-ink-muted)]">
        No charges assigned to this unit.
      </p>
    );
  const currencies = new Set(
    assignments.map((item) => item.charge_definition.currency),
  );
  if (currencies.size > 1 || !currencies.has("NGN"))
    return (
      <p className="text-sm text-[var(--vms-ink-muted)]">
        View charges in the finance register for currency details.
      </p>
    );
  const monthly = assignments
    .filter((item) => item.charge_definition.recurrence === "monthly")
    .reduce((sum, item) => sum + Number(item.charge_definition.amount || 0), 0);
  const balance = assignments.reduce(
    (sum, item) => sum + Number(item.outstanding_amount || 0),
    0,
  );
  const nextDue = assignments
    .map((item) => item.next_due_date)
    .filter((date): date is string => !!date)
    .sort()[0];
  return (
    <dl className="text-sm">
      {[
        ["Monthly charge", formatCurrency(monthly)],
        ["Current balance", formatCurrency(balance)],
        [
          "Next due date",
          nextDue ? new Date(nextDue).toLocaleDateString() : "—",
        ],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-3 border-b border-[var(--vms-line)] py-2 last:border-0"
        >
          <dt className="text-[var(--vms-ink-muted)]">{label}</dt>
          <dd
            className={
              label === "Current balance" && balance > 0
                ? "font-semibold text-[var(--vms-danger)]"
                : "font-medium"
            }
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function UnitFormModal({
  open,
  mode,
  unit,
  parents,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  unit?: UnitRow | null;
  parents: ParentChoice[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const [name, setName] = useState(unit?.name || "");
  const [parentId, setParentId] = useState(
    unit?.building_id || parents[0]?.id || "",
  );
  const [unitType, setUnitType] = useState(unit?.building_type || "apartment");
  const [address, setAddress] = useState(unit?.address || "");
  const [description, setDescription] = useState(unit?.description || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async () => {
      if (mode === "edit" && unit) {
        return placesApi.update(unit.id, {
          name: name.trim(),
          address: address.trim(),
          description: description.trim(),
        });
      }
      return placesApi.create({
        site_id:
          (parentId.startsWith("site:")
            ? selectedSite?.id
            : parents.find((parent) => parent.id === parentId)?.site_id) ||
          parents[0]?.site_id ||
          selectedSite?.id ||
          "",
        name: name.trim(),
        kind: "unit",
        address: address.trim(),
        description: description.trim(),
        ...(parentId.startsWith("site:") ? {} : { parent_id: parentId }),
        building_type: unitType,
      });
    },
    onSuccess: () => {
      toast.success(`Unit ${mode === "edit" ? "updated" : "created"}.`);
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a unit name or number.";
    if (mode === "create" && !parentId)
      next.parent_id = "Choose the building or site that contains this unit.";
    if (mode === "create" && !unitType)
      next.building_type = "Choose a residential unit type.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        mode === "create" ? "Add a residential unit" : `Edit ${unit?.name}`
      }
      description="Units are canonical places, so occupancy, charges and access retain the same property identity."
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field id="unit-name" label="Unit name" required error={errors.name}>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              placeholder="e.g. Apartment 4B"
            />
          )}
        </Field>
        {mode === "create" ? (
          <>
            <Field
              id="unit-parent"
              label="Building or site"
              required
              error={errors.parent_id}
            >
              {(control) => (
                <select
                  {...control}
                  className={fieldControlClassName}
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                >
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} · {parent.kind}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              id="unit-type"
              label="Unit type"
              required
              error={errors.building_type}
            >
              {(control) => (
                <select
                  {...control}
                  className={fieldControlClassName}
                  value={unitType}
                  onChange={(event) => setUnitType(event.target.value)}
                >
                  {unitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </>
        ) : null}
        <Field id="unit-address" label="Address">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              autoComplete="street-address"
            />
          )}
        </Field>
        <Field id="unit-description" label="Description">
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending
              ? "Saving…"
              : mode === "create"
                ? "Create unit"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
