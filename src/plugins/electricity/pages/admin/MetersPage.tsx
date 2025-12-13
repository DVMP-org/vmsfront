"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Plus, Zap, Search, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAdminHouses, useAdminResidents } from "@/hooks/use-admin";
import { electricityService } from "@/services/electricity-service";
import { Meter, MeterCreate } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminMetersPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState<MeterCreate & { meter_type: string; disco: string }>({
        meter_number: "",
        meter_type: "",
        disco: "",
        house_id: "",
    });

    // Pagination state
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Fetch meters
    const { data: metersData, isLoading } = useQuery({
        queryKey: ["electricity", "meters", page],
        queryFn: async () => {
            const response = await electricityService.getMeters({
                page,
                pageSize,
            });
            return response.data;
        },
    });

    // Fetch houses and residents for dropdowns
    const { data: housesData, isLoading: housesLoading } = useAdminHouses({
        page: 1,
        pageSize: 1000,
    });

    const { data: residentsData, isLoading: residentsLoading } = useAdminResidents({
        page: 1,
        pageSize: 1000,
    });

    // Create meter mutation
    const createMeterMutation = useMutation({
        mutationFn: (data: MeterCreate) => electricityService.createMeter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["electricity", "meters"] });
            setPage(1); // Reset to first page after creating
            toast.success("Meter added successfully");
            setIsAddModalOpen(false);
            setFormData({
                meter_number: "",
                meter_type: "",
                disco: "",
                house_id: "",
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to add meter");
        },
    });

    const meters = metersData?.items || [];
    const houses = housesData?.items || [];
    const residents = residentsData?.items || [];

    // Sort houses and residents for dropdown
    const sortedHouses = useMemo(
        () => [...houses].sort((a, b) => a.name.localeCompare(b.name)),
        [houses]
    );

    const sortedResidents = useMemo(
        () => [...residents].sort((a, b) => {
            const nameA = [a.user.first_name, a.user.last_name].filter(Boolean).join(" ") || a.user.email;
            const nameB = [b.user.first_name, b.user.last_name].filter(Boolean).join(" ") || b.user.email;
            return nameA.localeCompare(nameB);
        }),
        [residents]
    );

    // Filter meters by search query (client-side filtering for now)
    const filteredMeters = meters.filter(
        (meter) =>
            meter.meter_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.house?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.house?.address.toLowerCase().includes(searchQuery.toLowerCase())
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
        if (!formData.meter_number || !formData.meter_type || !formData.disco || !formData.house_id) {
            toast.error("Please fill in all fields");
            return;
        }

        createMeterMutation.mutate(formData);
    };

    const columns: Column<Meter>[] = [
        {
            key: "meter_number",
            header: "Meter Number",
            accessor: (meter) => (
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{meter.meter_number}</span>
                </div>
            ),
        },
        {
            key: "meter_type",
            header: "Type",
            accessor: (meter) => (
                <span className="text-muted-foreground">{meter.meter_type}</span>
            ),
        },
        {
            key: "disco",
            header: "DISCO",
            accessor: (meter) => (
                <span className="text-muted-foreground">{meter.disco}</span>
            ),
        },
        {
            key: "house",
            header: "House",
            accessor: (meter) => (
                <div>
                    <div className="font-medium">{meter.house?.name || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{meter.house?.address || ""}</div>
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Electricity Meters</h1>
                    <p className="text-muted-foreground">
                        Manage all electricity meters in the system
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Meter
                </Button>
            </div>

            {/* Meters Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>All Meters</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
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
                title="Add New Meter"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Meter Number *
                        </label>
                        <Input
                            placeholder="Enter meter number"
                            value={formData.meter_number}
                            onChange={(e) =>
                                setFormData({ ...formData, meter_number: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Meter Type *
                        </label>
                        <Input
                            placeholder="e.g., prepaid, postpaid"
                            value={formData.meter_type}
                            onChange={(e) =>
                                setFormData({ ...formData, meter_type: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            DISCO *
                        </label>
                        <Input
                            placeholder="e.g., EKEDC, IKEDC"
                            value={formData.disco}
                            onChange={(e) =>
                                setFormData({ ...formData, disco: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            House *
                        </label>
                        <select
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={formData.house_id}
                            onChange={(e) =>
                                setFormData({ ...formData, house_id: e.target.value })
                            }
                        >
                            <option value="">Select house</option>
                            {sortedHouses.map((house) => (
                                <option key={house.id} value={house.id}>
                                    {house.name} - {house.address}
                                </option>
                            ))}
                        </select>
                        {housesLoading && (
                            <p className="text-xs text-muted-foreground mt-1">Loading houses...</p>
                        )}
                    </div>
                    {formData.house_id && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Associated Residents
                            </label>
                            <div className="text-sm text-muted-foreground space-y-1">
                                {sortedResidents
                                    .filter(r => r.houses.some(h => h.id === formData.house_id))
                                    .map((resident) => (
                                        <div key={resident.user.id}>
                                            {[resident.user.first_name, resident.user.last_name].filter(Boolean).join(" ") || resident.user.email}
                                        </div>
                                    ))}
                                {sortedResidents.filter(r => r.houses.some(h => h.id === formData.house_id)).length === 0 && (
                                    <p className="text-xs">No residents found for this house</p>
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

