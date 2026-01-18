import { useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { useAdminDue, useDeleteDue } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
    ArrowLeft,
    Clock,
    Pencil,
    Trash2,
    ChevronRight,
    Receipt,
    Building2,
    Calendar,
    BadgeCheck,
    AlertCircle,
    Fingerprint
} from "lucide-react";
import { formatDate, formatCurrency, titleCase } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { HouseLite } from "@/types";
import { UpdateDueModal } from "@/components/modules/admin/dues/UpdateDueModal";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function DueDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const dueId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? "", [id]);

    const { data: due, isLoading, error } = useAdminDue(dueId);
    const deleteMutation = useDeleteDue();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    if (!router.isReady) return null;

    if (isLoading) return (
        <div className="space-y-4 max-w-7xl px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        </div>
    );

    if (error || !due) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-20">
                <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <h2 className="text-xl font-bold text-foreground">Due not found</h2>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/dues")}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                    Back to Dues
                </Button>
            </div>
        );
    }

    const handleDelete = () => {
        deleteMutation.mutate(dueId, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                router.push("/admin/dues");
            },
        });
    };

    const columns: Column<HouseLite>[] = [
        {
            key: "name",
            header: "House",
            sortable: true,
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-medium text-foreground block">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase opacity-70">UID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "address",
            header: "Address",
            accessor: (row) => <span className="text-xs text-muted-foreground truncate max-w-[350px] block">{row.address || "—"}</span>,
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-brand-primary"
                        onClick={() => router.push(`/admin/dues/${dueId}/house/${row.id}`)}
                    >
                        View
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/admin/dues")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Dues
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        {due.name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Professional assessment for <span className="font-medium text-foreground">{due.recurring ? "recurring" : "one-time"}</span> property service fees.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-10 px-4" onClick={() => setIsUpdateModalOpen(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit Due
                    </Button>
                    <Button variant="destructive" size="sm" className="h-10 px-4" onClick={() => setIsDeleteModalOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Record
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="py-4 border-b bg-muted/20">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                                <div className="p-4 space-y-4">
                                    <DetailItem label="Total Amount" value={formatCurrency(due.amount)} />
                                    <DetailItem label="Billing Cycle" value={due.recurring ? titleCase(due.tenure_length) : "One-time"} />
                                    <DetailItem label="Created" value={formatDate(due.created_at)} />
                                </div>
                                <div className="p-4 space-y-4">
                                    <DetailItem label="Houses" value={`${due.houses?.length || 0} units`} />
                                    <DetailItem label="Minimum Plan" value={`${titleCase(due.minimum_payment_breakdown)}`} />
                                    <DetailItem label="Description" value={due.description || "—"} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4 border-b h-14">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Houses
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {due.houses && due.houses.length > 0 ? (
                                <DataTable
                                    data={due.houses}
                                    columns={columns}
                                    searchable={true}
                                    searchPlaceholder="Find house..."
                                    pageSize={10}
                                    getRowId={(row) => row.id}
                                    className="border-none"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
                                    <Building2 className="h-10 w-10 text-muted-foreground/20 " />
                                    <p className="text-sm text-muted-foreground">No houses assigned.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Active Cycle</span>
                                </div>
                                <p className="text-sm font-medium text-emerald-800">
                                    Valid from {formatDate(due.created_at)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase px-1">Summary</p>
                                <div className="divide-y border rounded-lg bg-muted/5">
                                    <div className="flex justify-between p-3">
                                        <span className="text-xs text-muted-foreground">Houses</span>
                                        <span className="text-xs font-bold text-foreground">{due.houses?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between p-3">
                                        <span className="text-xs text-muted-foreground">Status</span>
                                        <span className="text-xs font-bold text-foreground">{due.recurring ? "Recurring" : "One-time"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <div className="space-y-5">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex gap-4">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-800 mb-1">Delete Due</p>
                            <p className="text-xs text-red-700 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold italic">"{due.name}"</span>?
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>Yes, Delete</Button>
                    </div>
                </div>
            </Modal>

            <UpdateDueModal due={due} isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} />
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">{label}</p>
            <p className="text-sm font-semibold text-foreground tracking-tight">{value}</p>
        </div>
    );
}

DueDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
