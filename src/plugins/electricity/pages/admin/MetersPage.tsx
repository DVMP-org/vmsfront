"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Zap, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { parseApiError } from "@/lib/error-utils";
import { formatDate, titleCase } from "@/lib/utils";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { Meter, MeterCreate, MeterUpdate } from "@/plugins/electricity/types";
import { SiteRequired } from "./SiteRequired";
import { useAppStore } from "@/store/app-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** The editable part of a meter. Create sends a Site; edit never changes it. */
interface MeterForm {
  meter_number: string;
  meter_type: string;
  disco: string;
  place_id: string;
  meter_name: string;
  is_active: boolean;
}

const EMPTY_FORM: MeterForm = {
  meter_number: "",
  meter_type: "",
  disco: "",
  place_id: "",
  meter_name: "",
  is_active: true,
};

function formFor(meter: Meter): MeterForm {
  return {
    meter_number: meter.meter_number,
    meter_type: meter.meter_type,
    disco: meter.disco,
    place_id: meter.place_id ?? "",
    meter_name: meter.meter_name ?? "",
    is_active: meter.is_active ?? true,
  };
}

export default function AdminMetersPage() {
  const queryClient = useQueryClient();
  const selectedSite = useAppStore((state) => state.selectedSite);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [meterToDelete, setMeterToDelete] = useState<Meter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<MeterForm>(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: metersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["electricity", "meters", selectedSite?.id ?? null, page],
    queryFn: async () => {
      const response = await electricityService.getMeters({ page, pageSize });
      return response.data;
    },
    enabled: Boolean(selectedSite?.id),
  });

  const { data: discosData, isLoading: discosLoading } = useQuery({
    queryKey: ["electricity", "discos"],
    queryFn: async () => (await electricityService.getDiscos()).data,
    staleTime: 10 * 60 * 1000,
  });

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ["electricity", "places", selectedSite?.id ?? null],
    queryFn: async () => (await electricityService.getPlaces()).data,
    enabled: Boolean(selectedSite?.id),
  });

  const createMeterMutation = useMutation({
    mutationFn: (data: MeterCreate) => electricityService.createMeter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricity", "meters"] });
      queryClient.invalidateQueries({ queryKey: ["electricity", "stats"] });
      setPage(1);
      toast.success("Meter added successfully");
      closeDrawer();
    },
    onError: (error: unknown) => {
      toast.error(parseApiError(error).message);
    },
  });

  const updateMeterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MeterUpdate }) =>
      electricityService.updateMeter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricity", "meters"] });
      queryClient.invalidateQueries({ queryKey: ["electricity", "stats"] });
      toast.success("Meter updated");
      closeDrawer();
    },
    onError: (error: unknown) => {
      toast.error(parseApiError(error).message);
    },
  });

  const deleteMeterMutation = useMutation({
    mutationFn: (meterId: string) => electricityService.deleteMeter(meterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricity", "meters"] });
      queryClient.invalidateQueries({ queryKey: ["electricity", "stats"] });
      toast.success("Meter deleted");
      setMeterToDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(parseApiError(error).message);
    },
  });

  const meters = metersData?.items || [];
  const discos = discosData || [];
  const places = useMemo(() => placesData || [], [placesData]);

  function openCreate() {
    setEditingMeter(null);
    setFormErrors({});
    setFormData(EMPTY_FORM);
    setDrawerMode("create");
  }

  function openEdit(meter: Meter) {
    setEditingMeter(meter);
    setFormErrors({});
    setFormData(formFor(meter));
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingMeter(null);
    setFormErrors({});
    setFormData(EMPTY_FORM);
  }

  const placeOptions = useMemo(
    () =>
      places.map((place) => ({
        value: place.id,
        label: `${place.name} · ${titleCase(
          (place.building_type || place.kind).replace(/-/g, " "),
        )}`,
      })),
    [places],
  );

  if (!selectedSite) return <SiteRequired />;

  const selectedDisco = discos.find((disco) => disco.code === formData.disco);
  const meterTypes = selectedDisco?.meter_types ?? ["prepaid", "postpaid"];

  const filteredMeters = meters.filter((meter) =>
    `${meter.meter_number} ${meter.disco_name ?? ""} ${meter.place?.name ?? ""} ${meter.meter_name ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const totalPages = metersData?.total_pages ?? 1;
  const total = metersData?.total ?? 0;
  const showPagination = totalPages > 1;

  const handleSubmitMeter = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!selectedSite)
      nextErrors.site_id = "Select a Site before adding meters.";
    if (!formData.meter_number.trim())
      nextErrors.meter_number = "Meter number is required.";
    if (!formData.place_id)
      nextErrors.place_id = "Select the unit this meter belongs to.";
    if (!formData.disco) nextErrors.disco = "Select the distribution company.";
    if (!formData.meter_type) nextErrors.meter_type = "Select the meter type.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedSite) return;

    if (drawerMode === "edit" && editingMeter) {
      updateMeterMutation.mutate({
        id: editingMeter.id,
        data: {
          meter_number: formData.meter_number.trim(),
          meter_type: formData.meter_type,
          disco: formData.disco,
          place_id: formData.place_id,
          meter_name: formData.meter_name.trim(),
          is_active: formData.is_active,
        },
      });
      return;
    }

    const payload: MeterCreate = {
      meter_number: formData.meter_number.trim(),
      meter_type: formData.meter_type,
      disco: formData.disco,
      place_id: formData.place_id,
      site_id: selectedSite.id,
    };
    createMeterMutation.mutate(payload);
  };

  const columns: Column<Meter>[] = [
    {
      key: "meter_number",
      header: "Meter",
      accessor: (meter) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />
          <div>
            <span className="font-medium">{meter.meter_number}</span>
            {meter.meter_name ? (
              <span className="block text-xs text-[var(--vms-ink-muted)]">
                {meter.meter_name}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "place",
      header: "Unit",
      accessor: (meter) => (
        <div>
          <span className="font-medium">{meter.place?.name || "Unassigned"}</span>
          {meter.place ? (
            <span className="block text-xs text-[var(--vms-ink-muted)]">
              {titleCase((meter.place.building_type || meter.place.kind).replace(/-/g, " "))}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "disco",
      header: "DISCO",
      accessor: (meter) => (
        <span className="text-[var(--vms-ink-muted)]">
          {meter.disco_name || meter.disco}
        </span>
      ),
    },
    {
      key: "meter_type",
      header: "Type",
      accessor: (meter) => (
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{titleCase(meter.meter_type)}</Badge>
          {meter.is_active === false ? (
            <Badge variant="warning">Inactive</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Added",
      accessor: (meter) =>
        meter.created_at ? formatDate(meter.created_at) : "N/A",
    },
    {
      key: "actions",
      header: "",
      accessor: (meter) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit meter ${meter.meter_number}`}
            onClick={() => openEdit(meter)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete meter ${meter.meter_number}`}
            className="text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)]"
            onClick={() => setMeterToDelete(meter)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Extensions / Electricity"
        title="Electricity meters"
        description="Register a meter against a unit in this Site — a house, apartment, shop, office or room — then buy tokens for it."
        primaryAction={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add meter
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b border-[var(--vms-line)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Meter register</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <Input
                aria-label="Search meters"
                placeholder="Search meters..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Meters could not be loaded"
              description={parseApiError(error).message}
              action={{ label: "Retry", onClick: () => refetch() }}
            />
          ) : filteredMeters.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No meters yet"
              description={
                searchQuery
                  ? "No meters match your search"
                  : "Add the first meter for a unit in this Site"
              }
              action={
                !searchQuery
                  ? { label: "Add Meter", onClick: openCreate }
                  : undefined
              }
            />
          ) : (
            <>
              <DataTable
                data={filteredMeters}
                columns={columns}
                searchable={false}
                showPagination={false}
                      getRowId={(meter) => meter.id}
                emptyMessage="No meters found"
              />
              {showPagination && (
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  totalPages={totalPages}
                        hasNext={metersData?.has_next ?? false}
                        hasPrevious={metersData?.has_previous ?? false}
                  resourceLabel="meters"
                        onChange={setPage}
                  isFetching={isLoading}
                  className="mt-6"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <FormDrawer
        isOpen={drawerMode !== null}
        onClose={closeDrawer}
        title={drawerMode === "edit" ? "Edit meter" : "Add meter"}
        description={
          drawerMode === "edit"
            ? "Update the unit, identity or status of this meter."
            : "Register a meter against a unit in this Site."
        }
        onSubmit={handleSubmitMeter}
        submitLabel={drawerMode === "edit" ? "Save changes" : "Add meter"}
        isSubmitting={
          createMeterMutation.isPending || updateMeterMutation.isPending
        }
        canSubmit={Boolean(selectedSite)}
        footerNote={
          drawerMode === "edit"
            ? "Changing the number, DISCO or type re-verifies the meter with the provider."
            : "The meter is verified with the Site's bound vending provider before it is saved."
        }
      >
        <div className="space-y-4">
          <FormErrorSummary errors={formErrors} />
          <Field
            id="meter-place"
            label="Unit"
            required
            error={formErrors.place_id}
            hint="The place this meter serves. Units come from the Site's structure."
          >
            {({ id }) => (
              <>
                <SearchableSelect
                  inputId={id}
                  value={formData.place_id || undefined}
                  onChange={(value) =>
                    setFormData({ ...formData, place_id: value ?? "" })
                  }
                  options={placeOptions}
                  placeholder={placementsPlaceholder(
                    discosLoading,
                    placesLoading,
                    places.length,
                  )}
                  isClearable={false}
                  isDisabled={!selectedSite || placesLoading}
                />
                {!placesLoading && places.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    This Site has no units yet. Add places under the Site before
                    registering meters.
                  </p>
                ) : null}
              </>
            )}
          </Field>
          <Field
            id="disco"
            label="Distribution company"
            required
            error={formErrors.disco}
          >
            {({ id }) => (
              <select
                id={id}
                className={fieldControlClassName}
                value={formData.disco}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    disco: e.target.value,
                    meter_type: "",
                  })
                }
                disabled={discosLoading}
              >
                <option value="">Select DISCO</option>
                {discos.map((disco) => (
                  <option key={disco.code} value={disco.code}>
                    {disco.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="meter-type"
            label="Meter type"
            required
            error={formErrors.meter_type}
          >
            {({ id }) => (
              <select
                id={id}
                className={fieldControlClassName}
                value={formData.meter_type}
                onChange={(e) =>
                  setFormData({ ...formData, meter_type: e.target.value })
                }
                disabled={!formData.disco}
              >
                <option value="">Select meter type</option>
                {meterTypes.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="meter-number"
            label="Meter number"
            required
            error={formErrors.meter_number}
          >
            {({ id }) => (
              <Input
                id={id}
                placeholder="Enter meter number"
                value={formData.meter_number}
                onChange={(e) =>
                  setFormData({ ...formData, meter_number: e.target.value })
                }
              />
            )}
          </Field>
          <Field
            id="meter-name"
            label="Label"
            hint="Shown in the register and on tokens. Defaults to the provider's customer name."
          >
            {({ id }) => (
              <Input
                id={id}
                placeholder="e.g. Flat 3B meter"
                value={formData.meter_name}
                onChange={(e) =>
                  setFormData({ ...formData, meter_name: e.target.value })
                }
              />
            )}
          </Field>
          {drawerMode === "edit" ? (
            <label className="flex items-center gap-2 text-sm text-[var(--vms-ink)]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              Meter is active
            </label>
          ) : null}
        </div>
      </FormDrawer>

      <Modal
        isOpen={meterToDelete !== null}
        onClose={() => setMeterToDelete(null)}
        title="Delete meter"
        description="This removes the meter and its link to the unit."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setMeterToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMeterMutation.isPending}
              onClick={() =>
                meterToDelete && deleteMeterMutation.mutate(meterToDelete.id)
              }
            >
              Delete meter
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--vms-ink-muted)]">
          {meterToDelete
            ? `Delete meter ${meterToDelete.meter_number} on ${meterToDelete.place?.name ?? "this unit"
            }? A meter with purchase history cannot be deleted — deactivate it instead so past purchases stay intact.`
            : null}
        </p>
      </Modal>
    </div>
  );
}

function placementsPlaceholder(
  discosLoading: boolean,
  placesLoading: boolean,
  placeCount: number,
) {
  if (discosLoading || placesLoading) return "Loading units…";
  if (!placeCount) return "No units in this Site yet";
  return "Select a unit";
}
