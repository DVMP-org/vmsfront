"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Plus, Zap, Search, AlertCircle } from "lucide-react";
import { formatDate, titleCase } from "@/lib/utils";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { useAdminResidencies, useAdminResidents } from "@/hooks/use-admin";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import { Meter, MeterCreate } from "@/plugins/electricity/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminMetersPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<MeterCreate & { meter_type: string; disco: string }>({
        meter_number: "",
        meter_type: "",
        disco: "",
        residency_id: "",
    });

    // Pagination state
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Fetch meters
    const { data: metersData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["electricity", "meters", page],
        queryFn: async () => {
            const response = await electricityService.getMeters({
                page,
                pageSize,
            });
            return response.data;
        },
    });

    // Fetch residencies and residents for dropdowns
    const { data: residenciesData, isLoading: residenciesLoading } = useAdminResidencies({
        page: 1,
        pageSize: 100,
    });

    const { data: residentsData, isLoading: residentsLoading } = useAdminResidents({
        page: 1,
        pageSize: 100,
    });

    // Create meter mutation
    const createMeterMutation = useMutation({
        mutationFn: (data: MeterCreate) => electricityService.createMeter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["electricity", "meters"] });
            setPage(1); // Reset to first page after creating
            toast.success("Meter added successfully");
            setIsAddModalOpen(false);
            setFormErrors({});
            setFormData({
                meter_number: "",
                meter_type: "",
                disco: "",
                residency_id: "",
            });
        },
        onError: (error: any) => {
            toast.error(parseApiError(error).message);
        },
    });

    const meters = metersData?.items || [];
    const residencies = residenciesData?.items || [];
    const residents = residentsData?.items || [];

    // Sort residencies and residents for dropdown
    const sortedResidencies = [...residencies].sort((a, b) =>
        a.name.localeCompare(b.name),
    );
    const sortedResidents = [...residents].sort((a, b) => {
        const nameA =
            [a.user.first_name, a.user.last_name].filter(Boolean).join(" ") ||
            a.user.email;
        const nameB =
            [b.user.first_name, b.user.last_name].filter(Boolean).join(" ") ||
            b.user.email;
        return nameA.localeCompare(nameB);
    });

    // Filter meters by search query (client-side filtering for now)
    const filteredMeters = meters.filter(
        (meter) =>
            meter.meter_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.residency?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.residency?.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination data
    const totalPages = metersData?.total_pages ?? 1;
    const total = metersData?.total ?? 0;
    const hasNext = metersData?.has_next ?? false;
    const hasPrevious = metersData?.has_previous ?? false;
    const showPagination = totalPages > 1;

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleAddMeter = async () => {
        const nextErrors: Record<string, string> = {};
        if (!formData.meter_number.trim()) nextErrors.meter_number = "Meter number is required.";
        if (!formData.meter_type.trim()) nextErrors.meter_type = "Meter type is required.";
        if (!formData.disco.trim()) nextErrors.disco = "Distribution company is required.";
        if (!formData.residency_id) nextErrors.residency_id = "Select a property relationship.";
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        createMeterMutation.mutate(formData);
    };

    const columns: Column<Meter>[] = [
        {
            key: "meter_number",
            header: "Meter Number",
            accessor: (meter) => (
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                    <span className="font-medium">{meter.meter_number}</span>
                </div>
            ),
        },
        {
            key: "meter_type",
            header: "Type",
            accessor: (meter) => (
                <span className="text-[var(--vms-ink-muted)]">{titleCase(meter.meter_type.replace(/-/g, " "))}</span>
            ),
        },
        {
            key: "disco",
            header: "DISCO",
            accessor: (meter) => (
                <span className="text-[var(--vms-ink-muted)]">{titleCase(meter.disco.replace(/-/g, " "))}</span>
            ),
        },
        {
            key: "residency",
            header: "Residency",
            accessor: (meter) => (
                <div>
                    <div className="font-medium">{meter.residency?.name || "N/A"}</div>
                    <div className="text-xs text-[var(--vms-ink-muted)]">{meter.residency?.address || ""}</div>
                </div>
            ),
        },
        {
            key: "created_at",
            header: "Added",
            accessor: (meter) => meter.created_at ? formatDate(meter.created_at) : "N/A",
        },
    ];

    return (
        <div className="space-y-5 pb-8 text-[var(--vms-ink)]">
            <PageHeader
                eyebrow="Extensions / Electricity"
                title="Electricity meters"
                description="Manage the meters associated with property relationships in this organization."
                primaryAction={
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add meter
                    </Button>
                }
            />

            {/* Meters Table */}
            <Card>
                <CardHeader className="border-b border-[var(--vms-line)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Meter register</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]" aria-hidden="true" />
                            <Input
                                aria-label="Search meters"
                                placeholder="Search meters..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1); // Reset to first page on search
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
                                    : "Add your first meter to get started"
                            }
                            action={
                                !searchQuery
                                    ? {
                                        label: "Add Meter",
                                        onClick: () => setIsAddModalOpen(true),
                                    }
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
                                emptyMessage="No meters found"
                            />
                            {showPagination && (
                                <PaginationBar
                                    page={page}
                                    pageSize={pageSize}
                                    total={total}
                                    totalPages={totalPages}
                                    hasNext={hasNext}
                                    hasPrevious={hasPrevious}
                                    resourceLabel="meters"
                                    onChange={handlePageChange}
                                    isFetching={isLoading}
                                    className="mt-6"
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add Meter Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add meter"
                size="md"
            >
                <div className="space-y-4">
                    <FormErrorSummary errors={formErrors} />
                    <Field id="meter-number" label="Meter number" required error={formErrors.meter_number}>
                      {({ id, ...control }) => (
                        <Input
                            id={id}
                            {...control}
                            placeholder="Enter meter number"
                            value={formData.meter_number}
                            onChange={(e) =>
                                setFormData({ ...formData, meter_number: e.target.value })
                            }
                        />
                      )}
                    </Field>
                    <Field id="meter-type" label="Meter type" required error={formErrors.meter_type}>
                      {({ id, ...control }) => (
                        <Input
                            id={id}
                            {...control}
                            placeholder="e.g., prepaid, postpaid"
                            value={formData.meter_type}
                            onChange={(e) =>
                                setFormData({ ...formData, meter_type: e.target.value })
                            }
                        />
                      )}
                    </Field>
                    <Field id="disco" label="Distribution company" required error={formErrors.disco}>
                      {({ id, ...control }) => (
                        <Input
                            id={id}
                            {...control}
                            placeholder="e.g., EKEDC, IKEDC"
                            value={formData.disco}
                            onChange={(e) =>
                                setFormData({ ...formData, disco: e.target.value })
                            }
                        />
                      )}
                    </Field>
                    <Field id="meter-residency" label="Property relationship" required error={formErrors.residency_id}>
                      {({ id, ...control }) => (
                        <>
                          <select
                              id={id}
                              {...control}
                              className={fieldControlClassName}
                              value={formData.residency_id}
                              onChange={(e) =>
                                  setFormData({ ...formData, residency_id: e.target.value })
                              }
                          >
                              <option value="">Select residency</option>
                              {sortedResidencies.map((residency) => (
                                  <option key={residency.id} value={residency.id}>
                                      {residency.name} - {residency.address}
                                  </option>
                              ))}
                          </select>
                          {residenciesLoading && (
                              <p className="mt-1 text-xs text-[var(--vms-ink-muted)]" role="status">Loading property relationships…</p>
                          )}
                        </>
                      )}
                    </Field>
                    {formData.residency_id && (
                        <div>
                            <p className="mb-2 block text-[13px] font-semibold leading-[18px]">Associated residents</p>
                            <div className="space-y-1 text-sm text-[var(--vms-ink-muted)]">
                                {sortedResidents
                                    .filter(r => r?.residencies?.some(h => h.id === formData.residency_id))
                                    .map((resident) => (
                                        <div key={resident.user.id}>
                                            {[resident.user.first_name, resident.user.last_name].filter(Boolean).join(" ") || resident.user.email}
                                        </div>
                                    ))}
                                {sortedResidents.filter(r => r?.residencies?.some(h => h.id === formData.residency_id)).length === 0 && (
                                    <p className="text-xs">No residents found for this property relationship.</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMeter}
                            isLoading={createMeterMutation.isPending}
                        >
                            Add Meter
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

