"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus, Zap, Search, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

// TODO: Replace with actual API types when available
interface Meter {
    id: string;
    meterNumber: string;
    residentName: string;
    houseAddress: string;
    status: "active" | "inactive" | "pending";
    createdAt: string;
    lastPurchase?: string;
    totalPurchases: number;
}

// Mock data - replace with API call
const mockMeters: Meter[] = [];

export default function AdminMetersPage() {
    const [meters, setMeters] = useState<Meter[]>(mockMeters);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({
        meterNumber: "",
        residentId: "",
        houseId: "",
    });

    // TODO: Replace with actual API call
    // const { data: meters, isLoading } = useElectricityMeters();
    // const createMeterMutation = useCreateElectricityMeter();

    const filteredMeters = meters.filter(
        (meter) =>
            meter.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meter.houseAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddMeter = async () => {
        if (!formData.meterNumber || !formData.residentId || !formData.houseId) {
            toast.error("Please fill in all fields");
            return;
        }

        // TODO: Replace with actual API call
        // createMeterMutation.mutate(formData, {
        //     onSuccess: () => {
        //         toast.success("Meter added successfully");
        //         setIsAddModalOpen(false);
        //         setFormData({ meterNumber: "", residentId: "", houseId: "" });
        //     },
        //     onError: (error) => {
        //         toast.error(error.message || "Failed to add meter");
        //     },
        // });

        toast.success("Meter added successfully (mock)");
        setIsAddModalOpen(false);
        setFormData({ meterNumber: "", residentId: "", houseId: "" });
    };

    const columns: Column<Meter>[] = [
        {
            key: "meterNumber",
            header: "Meter Number",
            accessor: (meter) => (
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{meter.meterNumber}</span>
                </div>
            ),
        },
        {
            key: "residentName",
            header: "Resident",
            accessor: (meter) => meter.residentName,
        },
        {
            key: "houseAddress",
            header: "House Address",
            accessor: (meter) => meter.houseAddress,
        },
        {
            key: "status",
            header: "Status",
            accessor: (meter) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${meter.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : meter.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                >
                    {meter.status}
                </span>
            ),
        },
        {
            key: "totalPurchases",
            header: "Purchases",
            accessor: (meter) => (
                <span className="text-muted-foreground">{meter.totalPurchases}</span>
            ),
        },
        {
            key: "createdAt",
            header: "Added",
            accessor: (meter) => formatDate(meter.createdAt),
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
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                        <DataTable
                            data={filteredMeters}
                            columns={columns}
                            searchable={false}
                            emptyMessage="No meters found"
                        />
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
                            value={formData.meterNumber}
                            onChange={(e) =>
                                setFormData({ ...formData, meterNumber: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Resident *
                        </label>
                        <Input
                            placeholder="Select resident"
                            value={formData.residentId}
                            onChange={(e) =>
                                setFormData({ ...formData, residentId: e.target.value })
                            }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            TODO: Replace with resident selector dropdown
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            House *
                        </label>
                        <Input
                            placeholder="Select house"
                            value={formData.houseId}
                            onChange={(e) =>
                                setFormData({ ...formData, houseId: e.target.value })
                            }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            TODO: Replace with house selector dropdown
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddMeter}>
                            Add Meter
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

