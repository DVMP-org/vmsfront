"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Users, Search, Zap, Plus, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

// TODO: Replace with actual API types when available
interface ResidentMeter {
    id: string;
    residentId: string;
    residentName: string;
    houseAddress: string;
    meterNumber?: string;
    meterStatus?: "active" | "inactive" | "pending";
    totalPurchases: number;
    lastPurchase?: string;
    totalSpent: number;
}

// Mock data - replace with API call
const mockResidents: ResidentMeter[] = [];

export default function AdminResidentsPage() {
    const [residents, setResidents] = useState<ResidentMeter[]>(mockResidents);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddMeterModalOpen, setIsAddMeterModalOpen] = useState(false);
    const [selectedResident, setSelectedResident] = useState<ResidentMeter | null>(null);
    const [formData, setFormData] = useState({
        meterNumber: "",
    });

    // TODO: Replace with actual API call
    // const { data: residents, isLoading } = useElectricityResidents();
    // const addMeterMutation = useAddMeterToResident();

    const filteredResidents = residents.filter(
        (resident) =>
            resident.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resident.houseAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resident.meterNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddMeter = (resident: ResidentMeter) => {
        setSelectedResident(resident);
        setIsAddMeterModalOpen(true);
    };

    const handleSubmitMeter = async () => {
        if (!formData.meterNumber || !selectedResident) {
            toast.error("Please enter a meter number");
            return;
        }

        // TODO: Replace with actual API call
        // addMeterMutation.mutate(
        //     {
        //         residentId: selectedResident.residentId,
        //         meterNumber: formData.meterNumber,
        //     },
        //     {
        //         onSuccess: () => {
        //             toast.success("Meter added successfully");
        //             setIsAddMeterModalOpen(false);
        //             setFormData({ meterNumber: "" });
        //         },
        //         onError: (error) => {
        //             toast.error(error.message || "Failed to add meter");
        //         },
        //     }
        // );

        toast.success("Meter added successfully (mock)");
        setIsAddMeterModalOpen(false);
        setFormData({ meterNumber: "" });
    };

    const columns: Column<ResidentMeter>[] = [
        {
            key: "residentName",
            header: "Resident",
            accessor: (resident) => (
                <div>
                    <p className="font-medium">{resident.residentName}</p>
                    <p className="text-sm text-muted-foreground">{resident.houseAddress}</p>
                </div>
            ),
        },
        {
            key: "meterNumber",
            header: "Meter",
            accessor: (resident) =>
                resident.meterNumber ? (
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{resident.meterNumber}</span>
                        {resident.meterStatus && (
                            <Badge
                                variant={
                                    resident.meterStatus === "active"
                                        ? "default"
                                        : resident.meterStatus === "pending"
                                            ? "secondary"
                                            : "danger"
                                }
                                className="text-xs"
                            >
                                {resident.meterStatus}
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground">No meter</span>
                ),
        },
        {
            key: "totalPurchases",
            header: "Purchases",
            accessor: (resident) => (
                <span className="text-muted-foreground">{resident.totalPurchases}</span>
            ),
        },
        {
            key: "totalSpent",
            header: "Total Spent",
            accessor: (resident) => (
                <span className="font-semibold">₦{resident.totalSpent.toLocaleString()}</span>
            ),
        },
        {
            key: "lastPurchase",
            header: "Last Purchase",
            accessor: (resident) =>
                resident.lastPurchase ? (
                    formatDate(resident.lastPurchase)
                ) : (
                    <span className="text-muted-foreground">Never</span>
                ),
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (resident) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMeter(resident)}
                    className="gap-2"
                >
                    {resident.meterNumber ? (
                        <>
                            <Zap className="h-4 w-4" />
                            Update Meter
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Add Meter
                        </>
                    )}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Residents & Meters</h1>
                    <p className="text-muted-foreground">
                        Manage residents and their electricity meters
                    </p>
                </div>
            </div>

            {/* Residents Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>All Residents</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search residents..."
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
                    ) : filteredResidents.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No residents yet"
                            description={
                                searchQuery
                                    ? "No residents match your search"
                                    : "Residents with meters will appear here"
                            }
                        />
                    ) : (
                        <DataTable
                            data={filteredResidents}
                            columns={columns}
                            searchable={false}
                            emptyMessage="No residents found"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Add Meter Modal */}
            <Modal
                isOpen={isAddMeterModalOpen}
                onClose={() => {
                    setIsAddMeterModalOpen(false);
                    setFormData({ meterNumber: "" });
                }}
                title={selectedResident?.meterNumber ? "Update Meter" : "Add Meter"}
                size="md"
            >
                <div className="space-y-4">
                    {selectedResident && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">{selectedResident.residentName}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedResident.houseAddress}
                            </p>
                        </div>
                    )}
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
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddMeterModalOpen(false);
                                setFormData({ meterNumber: "" });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitMeter}>
                            {selectedResident?.meterNumber ? "Update" : "Add"} Meter
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

