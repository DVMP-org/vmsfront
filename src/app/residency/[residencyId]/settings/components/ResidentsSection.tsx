"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useResidencyResidents,
    useAddResidencyResident,
    useUpdateResidencyResident,
    useDeleteResidencyResident,
    useToggleResidencyResidentStatus,
} from "@/hooks/use-residency-residents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ResidentUser, ResidentUserCreate, ResidentProfileUpdatePayload, ResidentResidency, ResidentCreate } from "@/types";
import { Plus, Search, Edit, Trash2, MoreVertical, Loader2, Star, RefreshCcw, Power } from "lucide-react";
import { ResidentModal } from "./ResidentModal";

import { Modal } from "@/components/ui/Modal";

export function ResidentsSection() {
    const params = useParams<{ residencyId: string }>();
    const residencyId = params?.residencyId ?? null;

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<ResidentResidency | null>(null);
    const [deletingResident, setDeletingResident] = useState<ResidentResidency | null>(null);
    const [togglingResident, setTogglingResident] = useState<ResidentResidency | null>(null);

    const { data: residentsData, isLoading } = useResidencyResidents(residencyId, {
        page,
        search,
    });

    const addResident = useAddResidencyResident(residencyId);
    const updateResident = useUpdateResidencyResident(residencyId);
    const deleteResident = useDeleteResidencyResident(residencyId);
    const toggleStatus = useToggleResidencyResidentStatus(residencyId);

    const handleAddResident = async (data: ResidentCreate) => {
        // Transform form data to match API expectation if needed
        // Assuming backend needs residency_slugs or similar for creating resident relation
        // For now passing data as is to match ResidentUserCreate roughly

        // Note: The actual API call might need adjustment based on real backend expecting email only to invite/link
        // Adapting based on standard patterns

        await addResident.mutateAsync(data);
    };

    const handleUpdateResident = async (data: any) => {
        if (!editingResident) return;
        const payload: ResidentProfileUpdatePayload = {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            // email usually not updated here
        };
        await updateResident.mutateAsync({ residentId: editingResident.resident.id, data: payload });
        setEditingResident(null);
    };

    const handleDeleteResident = async () => {
        if (!deletingResident) return;
        await deleteResident.mutateAsync(deletingResident.resident.id);
        setDeletingResident(null);
    };
    const handleToggleStatus = async () => {
        if (!togglingResident) return;
        await toggleStatus.mutateAsync(togglingResident.resident.id);
        setTogglingResident(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search residents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Resident
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!residentsData?.items.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No residents found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            residentsData.items.map((item) => (
                                <TableRow key={item.resident.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item?.resident?.user?.first_name} {item?.resident?.user?.last_name}
                                            {item?.is_super_user && (
                                                <Badge variant="outline" className="flex items-center text-muted-foreground gap-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    Super User
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item?.resident?.user?.email}</TableCell>
                                    <TableCell>{item?.resident?.user?.phone || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item?.is_active ? "default" : "secondary"}>
                                            {item?.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className={item.is_active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"} title={item.is_active ? "Deactivate" : "Activate"} onClick={() => setTogglingResident(item)}>
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingResident(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingResident(item)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Modal */}
            <ResidentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleAddResident}
                isLoading={addResident.isPending}
                mode="create"
            />

            {/* Edit Modal */}
            <ResidentModal
                isOpen={!!editingResident}
                onClose={() => setEditingResident(null)}
                onSubmit={handleUpdateResident}
                isLoading={updateResident.isPending}
                initialData={editingResident}
                mode="edit"
            />

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deletingResident}
                onClose={() => setDeletingResident(null)}
                title="Remove Resident"
            >
                <div className="space-y-4">
                    <p>
                        Are you sure you want to remove <strong>{deletingResident?.resident?.user?.first_name} {deletingResident?.resident?.user?.last_name}</strong> from this residency?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setDeletingResident(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteResident} isLoading={deleteResident.isPending}>
                            Remove
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Status Toggle Confirmation */}
            <Modal
                isOpen={!!togglingResident}
                onClose={() => setTogglingResident(null)}
                title={`${togglingResident?.is_active ? 'Deactivate' : 'Activate'} Resident`}
            >
                <div className="space-y-4">
                    <p>
                        Are you sure you want to <strong>{togglingResident?.is_active ? 'deactivate' : 'activate'}</strong> <strong>{togglingResident?.resident?.user?.first_name} {togglingResident?.resident?.user?.last_name}</strong>?
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {togglingResident?.is_active
                            ? "Deactivating a resident will prevent them from creating gate passes or accessing the residency services until they are reactivated."
                            : "Activating a resident will restore their access to residency services."}
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setTogglingResident(null)}>Cancel</Button>
                        <Button
                            variant={togglingResident?.is_active ? "destructive" : "primary"}
                            onClick={handleToggleStatus}
                            isLoading={toggleStatus.isPending}
                        >
                            {togglingResident?.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
