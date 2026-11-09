"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CarFront,
  Dumbbell,
  Landmark,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import {
  mixedUseApi,
  type FacilityType,
  type SharedFacility,
  type SharedFacilityInput,
} from "./api";
import { MixedUseShell, useMixedUseAccess } from "./MixedUseShell";

const facilityTypes: Array<{ value: FacilityType; label: string }> = [
  { value: "amenity", label: "Amenity" },
  { value: "conference_room", label: "Conference room" },
  { value: "parking", label: "Parking" },
  { value: "pool", label: "Pool" },
  { value: "gym", label: "Gym" },
  { value: "coworking", label: "Coworking" },
  { value: "garden", label: "Garden" },
  { value: "other", label: "Other" },
];

const typeIcons = {
  amenity: Sparkles,
  conference_room: Landmark,
  parking: CarFront,
  pool: Waves,
  gym: Dumbbell,
  coworking: Share2,
  garden: Sparkles,
  other: Share2,
} satisfies Record<FacilityType, typeof Share2>;

const emptyForm: SharedFacilityInput = {
  name: "",
  facility_type: "amenity",
  description: "",
  capacity: null,
};

export function SharedFacilities() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const context = useMixedUseAccess();
  const client = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SharedFacility | null>(null);
  const [form, setForm] = useState<SharedFacilityInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["mixed-use-facilities", selectedProperty?.id],
    queryFn: () =>
      mixedUseApi.listFacilities(selectedProperty!.id, {
        page: 1,
        page_size: 100,
      }),
    enabled: !!selectedProperty?.id,
    retry: false,
  });

  const save = useMutation({
    mutationFn: async (input: SharedFacilityInput) => {
      if (!selectedProperty) throw new Error("Select a property first");
      if (editing) {
        return mixedUseApi.updateFacility(
          selectedProperty.id,
          editing.id,
          input,
        );
      }
      return mixedUseApi.createFacility(selectedProperty.id, input);
    },
    onSuccess: () => {
      toast.success(editing ? "Facility updated." : "Facility added.");
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void client.invalidateQueries({ queryKey: ["mixed-use-facilities"] });
    },
    onError: (error) => setFormError(parseApiError(error).message),
  });

  const toggle = useMutation({
    mutationFn: async ({
      facility,
      active,
    }: {
      facility: SharedFacility;
      active: boolean;
    }) => {
      if (!selectedProperty) throw new Error("Select a property first");
      return mixedUseApi.updateFacility(selectedProperty.id, facility.id, {
        is_active: active,
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["mixed-use-facilities"] });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const rows = query.data?.items ?? [];
  const activeCount = rows.filter((facility) => facility.is_active).length;
  const totalCapacity = rows.reduce(
    (total, facility) => total + (facility.capacity ?? 0),
    0,
  );
  const selectedFacilities = rows.filter((facility) =>
    selectedRows.has(facility.id),
  );

  const bulkActions: BulkAction[] = context.canManageFacilities
    ? [
        {
          label: "Activate selected",
          onClick: (ids) => {
            const facilities = rows.filter((facility) =>
              ids.includes(facility.id),
            );
            facilities.forEach((facility) =>
              toggle.mutate({ facility, active: true }),
            );
          },
        },
        {
          label: "Archive selected",
          variant: "outline",
          onClick: (ids) => {
            const facilities = rows.filter((facility) =>
              ids.includes(facility.id),
            );
            facilities.forEach((facility) =>
              toggle.mutate({ facility, active: false }),
            );
          },
        },
      ]
    : [];

  const columns: Column<SharedFacility>[] = [
    {
      key: "name",
      header: "Facility",
      sortable: true,
      accessor: (facility) => {
        const Icon = typeIcons[facility.facility_type];
        return (
          <div className="flex min-w-52 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{facility.name}</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-[var(--vms-ink-muted)]">
                {facility.description || "No operating note added."}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "facility_type",
      header: "Type",
      sortable: true,
      accessor: (facility) =>
        facilityTypes.find((item) => item.value === facility.facility_type)
          ?.label ?? facility.facility_type,
    },
    {
      key: "capacity",
      header: "Capacity",
      sortable: true,
      accessor: (facility) =>
        facility.capacity ? `${facility.capacity} people` : "Not limited",
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      accessor: (facility) => (
        <span
          className={
            facility.is_active
              ? "font-semibold text-[var(--vms-success)]"
              : "font-semibold text-[var(--vms-ink-muted)]"
          }
        >
          {facility.is_active ? "Active" : "Archived"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      accessor: (facility) =>
        context.canManageFacilities ? (
          <Button variant="ghost" size="sm" onClick={() => openEdit(facility)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        ) : null,
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(facility: SharedFacility) {
    setEditing(facility);
    setForm({
      name: facility.name,
      facility_type: facility.facility_type,
      description: facility.description ?? "",
      capacity: facility.capacity,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Enter a facility name.");
      return;
    }
    setFormError(null);
    save.mutate({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      capacity: form.capacity || null,
    });
  }

  return (
    <MixedUseShell
      title="Shared facilities"
      description="Maintain the common amenities available across residential, commercial and hospitality operations."
      primaryAction={
        context.canManageFacilities ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add facility
          </Button>
        ) : undefined
      }
    >
      <section
        aria-label="Shared facility summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        <Summary label="Facilities" value={rows.length} />
        <Summary label="Active" value={activeCount} />
        <Summary label="Combined capacity" value={totalCapacity} />
      </section>

      {query.isError && query.data ? (
        <InlineAlert
          tone="warning"
          title="Showing the last available facility register"
          action={
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          }
        >
          {parseApiError(query.error).message}
        </InlineAlert>
      ) : null}

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(facility) => facility.id}
          selectable={context.canManageFacilities}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          bulkActions={bulkActions}
          availableFilters={[
            {
              field: "facility_type",
              label: "Facility type",
              type: "select",
              isSearchable: true,
              options: facilityTypes,
            },
            {
              field: "is_active",
              label: "Status",
              type: "select",
              options: [
                { value: "true", label: "Active" },
                { value: "false", label: "Archived" },
              ],
            },
          ]}
          initialSort="name"
          searchPlaceholder="Search facilities"
          emptyMessage="No shared facilities have been added for this property."
          isLoading={query.isPending}
          isStale={query.isError && !!query.data}
          onRetry={() => query.refetch()}
          tableLabel="Shared facilities"
          scrollHint="Scroll horizontally to compare facility details."
          mobileSummary={(facility) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{facility.name}</p>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {facilityTypes.find(
                      (item) => item.value === facility.facility_type,
                    )?.label ?? facility.facility_type}
                    {facility.capacity ? ` · ${facility.capacity} people` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold">
                  {facility.is_active ? "Active" : "Archived"}
                </span>
              </div>
              <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
                {facility.description || "No operating note added."}
              </p>
            </div>
          )}
        />
        {selectedFacilities.length ? (
          <p className="mt-3 text-xs text-[var(--vms-ink-muted)]">
            {selectedFacilities.length} selected
          </p>
        ) : null}
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!save.isPending) setFormOpen(false);
        }}
        title={editing ? "Edit shared facility" : "Add shared facility"}
        description="Facilities are available only inside the selected mixed-use property."
        size="lg"
      >
        <form className="space-y-4" onSubmit={submit} noValidate>
          {formError ? (
            <InlineAlert tone="danger" title="Facility was not saved">
              {formError}
            </InlineAlert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Facility name</span>
              <input
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
                placeholder="Residents lounge"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Facility type</span>
              <select
                value={form.facility_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    facility_type: event.currentTarget.value as FacilityType,
                  }))
                }
                className={fieldClass}
              >
                {facilityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Operating note</span>
            <textarea
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.currentTarget.value,
                }))
              }
              rows={4}
              className={`${fieldClass} min-h-24 py-3`}
              placeholder="Access rules, booking expectations or shared-use notes."
            />
          </label>
          <label className="block max-w-xs space-y-1.5 text-sm font-medium">
            <span>Capacity</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={form.capacity ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  capacity: event.currentTarget.value
                    ? Number(event.currentTarget.value)
                    : null,
                }))
              }
              className={fieldClass}
              placeholder="Optional"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--vms-line)] pt-4">
            <Button
              variant="secondary"
              disabled={save.isPending}
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={save.isPending}
              loadingLabel="Saving…"
            >
              {editing ? "Save facility" : "Add facility"}
            </Button>
          </div>
        </form>
      </Modal>
    </MixedUseShell>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base outline-none focus:border-[var(--vms-ink)] focus:ring-2 focus:ring-[var(--vms-focus)] sm:text-sm";

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
      <p className="text-xs font-medium text-[var(--vms-ink-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}
