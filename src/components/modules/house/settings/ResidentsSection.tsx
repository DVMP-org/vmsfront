import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import {
    useHouseResidents,
    useAddHouseResident,
    useUpdateHouseResident,
    useDeleteHouseResident,
    useToggleHouseResidentStatus,
} from "@/hooks/use-house-residents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ResidentProfileUpdatePayload, ResidentHouse, ResidentCreate } from "@/types";
import { Plus, Search, Edit, Trash2, Loader2, Star, Power } from "lucide-react";
import { ResidentModal } from "./ResidentModal";
import { Modal } from "@/components/ui/Modal";

export function ResidentsSection() {
    const router = useRouter();
    const { houseId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<ResidentHouse | null>(null);
    const [deletingResident, setDeletingResident] = useState<ResidentHouse | null>(null);
    const [togglingResident, setTogglingResident] = useState<ResidentHouse | null>(null);

    const { data: residentsData, isLoading } = useHouseResidents(hId, { page, search });

    const addResident = useAddHouseResident(hId);
    const updateResident = useUpdateHouseResident(hId);
    const deleteResident = useDeleteHouseResident(hId);
    const toggleStatus = useToggleHouseResidentStatus(hId);

    if (isLoading) return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search residents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Resident</Button>
            </div>

            <div className="rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!residentsData?.items.length ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic">No residents found.</TableCell></TableRow>
                        ) : (
                            residentsData.items.map((item) => (
                                <TableRow key={item.resident.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.resident.user.first_name} {item.resident.user.last_name}
                                            {item.is_super_user && <Badge variant="outline" className="text-[10px] font-bold uppercase text-muted-foreground"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />Super</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{item.resident.user.email}</TableCell>
                                    <TableCell className="text-sm">{item.resident.user.phone || "-"}</TableCell>
                                    <TableCell><Badge variant={item.is_active ? "success" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setTogglingResident(item)} className={item.is_active ? "text-amber-600" : "text-emerald-600"}><Power className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingResident(item)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingResident(item)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ResidentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={(d) => addResident.mutateAsync(d)} isLoading={addResident.isPending} mode="create" />
            {editingResident && <ResidentModal isOpen={!!editingResident} onClose={() => setEditingResident(null)} onSubmit={(d) => updateResident.mutateAsync({ residentId: editingResident.resident.id, data: d })} isLoading={updateResident.isPending} initialData={editingResident} mode="edit" />}

            <Modal isOpen={!!deletingResident} onClose={() => setDeletingResident(null)} title="Remove Resident">
                <div className="space-y-4 pt-2">
                    <p>Are you sure you want to remove <strong>{deletingResident?.resident.user.first_name}</strong> from this house?</p>
                    <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setDeletingResident(null)}>Cancel</Button><Button variant="destructive" onClick={async () => { await deleteResident.mutateAsync(deletingResident!.resident.id); setDeletingResident(null); }} isLoading={deleteResident.isPending}>Remove</Button></div>
                </div>
            </Modal>

            <Modal isOpen={!!togglingResident} onClose={() => setTogglingResident(null)} title={`${togglingResident?.is_active ? 'Deactivate' : 'Activate'} Resident`}>
                <div className="space-y-4 pt-2">
                    <p>Change status for <strong>{togglingResident?.resident.user.first_name}</strong> to <strong>{togglingResident?.is_active ? 'inactive' : 'active'}</strong>?</p>
                    <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setTogglingResident(null)}>Cancel</Button><Button variant={togglingResident?.is_active ? "destructive" : "primary"} onClick={async () => { await toggleStatus.mutateAsync(togglingResident!.resident.id); setTogglingResident(null); }} isLoading={toggleStatus.isPending}>{togglingResident?.is_active ? 'Deactivate' : 'Activate'}</Button></div>
                </div>
            </Modal>
        </div>
    );
}
