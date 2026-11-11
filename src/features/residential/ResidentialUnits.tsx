"use client";

import { useConfirmAction } from "@/components/ui/useConfirmAction";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  Building2,
  DoorOpen,
  FileText,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { PropertyImage } from "@/components/ui/PropertyImage";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { FormSection } from "@/components/ui/form/FormSection";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import {
  propertiesApi,
  type Property,
  type PropertyTreeNode,
} from "@/features/properties/api";
import { PlaceAssignmentModal } from "@/features/places/PlaceAssignmentModal";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import {
  ResidentialUnitDetail,
  type ResidentialUnitRow,
} from "./ResidentialUnitDetail";

type UnitRow = ResidentialUnitRow;
type ParentChoice = Pick<PropertyTreeNode, "id" | "name" | "site_id"> & {
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
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const { contextKey, selectedProperty, canManageUnits, canManagePeople } =
    useResidentialAccess();
  const queryClient = useQueryClient();
  const placeId = selectedProperty?.id || "";
  const [createOpen, setCreateOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<UnitRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSession, setAssignSession] = useState(0);
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
    if (!selectedProperty) return parentPlaces;
    return [
      {
        id: `site:${selectedProperty.id}`,
        name: selectedProperty.name,
        site_id: selectedProperty.id,
        kind: "site",
      },
      ...parentPlaces,
    ];
  }, [parentPlaces, selectedProperty]);
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
        const rootParentId = selectedProperty
          ? `site:${selectedProperty.id}`
          : "";
        return {
          ...place,
          building_id: parent?.id || (place.parent_id ? "" : rootParentId),
          building_name:
            parent?.name ||
            (place.parent_id
              ? "Unknown building"
              : selectedProperty?.name || "Site root"),
          status: place.is_active ? "active" : "archived",
          occupancy_status: residents.length ? "occupied" : "vacant",
          residents: residents.map((row) => row.display_name).join(", "),
        };
      });
  }, [allPlaces, relationships.data?.items, scopedPlaces, selectedProperty]);

  const toggle = useMutation({
    mutationFn: async (ids: string[]) => {
      const targets = unitRows.filter((row) => ids.includes(row.id));
      const shouldActivate = targets.every((row) => !row.is_active);
      return Promise.all(
        targets.map((row) => propertiesApi.toggle(row.id, shouldActivate)),
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
  function requestArchive(unit: UnitRow) {
    if (!unit.is_active) { toggle.mutate([unit.id]); return; }
    confirmAction({
      title: `Archive ${unit.name}?`,
      description: "This removes the unit from active inventory. Existing occupancy or future use may prevent archiving.",
      confirmLabel: "Archive unit",
      onConfirm: () => toggle.mutateAsync([unit.id]),
    });
  }

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
                onClick={() => requestArchive(unit)}
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
      description={`Unit directory for ${selectedProperty?.name || "the selected"} residential property.`}
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
                        onClick={() => requestArchive(unit)}
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
        <ResidentialUnitDetail
          key={contextKey}
          unit={unitRows.find((unit) => unit.id === detailId)}
          relationships={relationships.data?.items || []}
          contextKey={contextKey}
          siteId={placeId}
          canManageUnits={canManageUnits}
          canManagePeople={canManagePeople}
          onClose={() => setDetailId(null)}
          onEdit={(unit) => {
            setDetailId(null);
            setEditUnit(unit);
          }}
          onAssign={(id) => {
            setAssignSession((session) => session + 1);
            setAssignPlaceId(id);
            setDetailId(null);
            setAssignOpen(true);
          }}
        />
      </div>

      <PlaceAssignmentModal
        title="Assign a household relationship"
        placeLabel="Unit"
        key={`assign:${assignSession}:${assignPlaceId || "none"}`}
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
      {confirmationDialog}
    </ResidentialShell>
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
  const formId = useId();
  const fieldIds: Record<string, string> = {
    name: `${formId}-unit-name`,
    parent_id: `${formId}-unit-parent`,
    building_type: `${formId}-unit-type`,
    address: `${formId}-unit-address`,
    description: `${formId}-unit-description`,
  };
  const selectedSite = useAppStore((state) => state.selectedProperty);
  const [name, setName] = useState(unit?.name || "");
  const [parentId, setParentId] = useState(
    unit?.building_id || parents[0]?.id || "",
  );
  const [unitType, setUnitType] = useState(unit?.building_type || "apartment");
  const [address, setAddress] = useState(unit?.address || "");
  const [description, setDescription] = useState(unit?.description || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const defaultParentId = parents[0]?.id || "";
  useEffect(() => {
    if (!open) return;
    setName(unit?.name || "");
    setParentId(unit?.building_id || defaultParentId);
    setUnitType(unit?.building_type || "apartment");
    setAddress(unit?.address || "");
    setDescription(unit?.description || "");
    setErrors({});
  }, [open, unit, defaultParentId]);
  const save = useMutation({
    mutationFn: async () => {
      if (mode === "edit" && unit) {
        return propertiesApi.update(unit.id, {
          name: name.trim(),
          address: address.trim(),
          description: description.trim(),
        });
      }
      return propertiesApi.create({
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
    if (save.isPending) return;
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
      onClose={() => {
        if (!save.isPending) onClose();
      }}
      title={
        mode === "create"
          ? "Add a residential unit"
          : `Edit ${unit?.name || name}`
      }
      description={
        mode === "create"
          ? "Add a home to your property. Connect residents and charges when you’re ready."
          : "Update the unit’s name, address and notes for your team."
      }
      icon={DoorOpen}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={save.isPending}>
            {mode === "create" ? "Create unit" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="space-y-6"
        onSubmit={submit}
        noValidate
        aria-busy={save.isPending}
      >
        <fieldset disabled={save.isPending} className="min-w-0 space-y-6">
          <FormErrorSummary
            errors={Object.fromEntries(
              Object.entries(errors).map(([key, value]) => [
                fieldIds[key] || key,
                value,
              ]),
            )}
          />
          <FormSection
            title="Unit details"
            description="A clear name and location help your team find the right home."
            icon={DoorOpen}
            className="md:grid-cols-1 md:gap-4"
          >
            <Field
              id={fieldIds.name}
              label="Unit name"
              icon={DoorOpen}
              required
              error={errors.name}
            >
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
                  id={fieldIds.parent_id}
                  label="Building or site"
                  icon={Building2}
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
                          {parent.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field
                  id={fieldIds.building_type}
                  label="Unit type"
                  icon={DoorOpen}
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
          </FormSection>
          <FormSection
            title="Location & notes"
            description="Add the details residents and your team need."
            icon={MapPin}
            className="md:grid-cols-1 md:gap-4"
          >
            <Field id={fieldIds.address} label="Address" icon={MapPin}>
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  placeholder="Street address or location within the property"
                />
              )}
            </Field>
            <Field
              id={fieldIds.description}
              label="Description"
              icon={FileText}
              description="Optional notes about the layout, location or access."
            >
              {(control) => (
                <textarea
                  {...control}
                  className={`${fieldControlClassName} min-h-24 py-2`}
                  placeholder="e.g. Two-bedroom apartment on the second floor"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              )}
            </Field>
          </FormSection>
        </fieldset>
      </form>
    </Modal>
  );
}
