"use client";

import { useParams, useRouter } from "next/navigation";
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
    ExternalLink,
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
import { useState } from "react";
import { UpdateDueModal } from "../components/UpdateDueModal";
import { cn } from "@/lib/utils";

export default function DueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;
    const { data: due, isLoading, error } = useAdminDue(dueId);
    const deleteMutation = useDeleteDue();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

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
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border/60 max-w-2xl mx-auto mt-20">
                <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <h2 className="text-xl font-bold text-foreground">Due not found</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">The requested record could not be found or may have been removed.</p>
                <Button variant="outline" className="font-bold text-xs uppercase" onClick={() => router.push("/admin/dues")}>
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
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-70">UID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "address",
            header: "Address",
            accessor: (row) => <span className="text-xs text-muted-foreground truncate max-w-[350px] block">{row.address || "No address."}</span>,
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-brand-primary transition-colors"
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
            {/* VMS Action Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/admin/dues")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Dues
                </button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/40">
                        Record: {dueId.split('-')[0]}
                    </Badge>
                </div>
            </div>

            {/* Header Section */}
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 border-border/60 hover:bg-muted/50"
                        onClick={() => setIsUpdateModalOpen(true)}
                    >
                        <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        Edit Due
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-10 px-4 shadow-none bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Record
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-4 border-b bg-muted/20">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-border/60">
                                <div className="p-4 space-y-4">
                                    <DetailItem label="Total Amount" value={formatCurrency(due.amount)} />
                                    <DetailItem label="Billing Cycle" value={due.recurring ? titleCase(due.tenure_length) : "One-time"} />
                                    <DetailItem label="Created" value={formatDate(due.created_at)} />
                                </div>
                                <div className="p-4 space-y-4">
                                    <DetailItem label="Houses" value={`${due.houses?.length || 0} units`} />
                                    <DetailItem label="Minimum Plan" value={`${titleCase(due.minimum_payment_breakdown)}`} />
                                    <DetailItem label="Description" value={due.description || "No description."} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-4 border-b flex flex-row items-center justify-between h-14">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Houses
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-brand-primary" onClick={() => router.push(`/admin/dues/${dueId}/houses`)}>
                                View Houses
                                <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {due.houses && due.houses.length > 0 ? (
                                <DataTable
                                    data={due.houses}
                                    columns={columns}
                                    searchable={true}
                                    searchPlaceholder="Find house by name..."
                                    pageSize={10}
                                    getRowId={(row) => row.id}
                                    className="border-none"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
                                    <Building2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">No houses assigned.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Status & Notices Column */}
                <div className="space-y-6">
                    <Card className="rounded-lg shadow-none border-border/60">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Active Cycle</span>
                                </div>
                                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    Valid from {formatDate(due.created_at)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Summary</p>
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

                    <Card className="rounded-lg shadow-none border-brand-primary/20 bg-brand-primary/[0.03]">
                        <CardContent className="p-4 space-y-3 font-medium">
                            <div className="flex items-center gap-2 text-brand-primary text-sm font-bold">
                                <Calendar className="h-4 w-4" />
                                Information
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Payments are tracked automatically. Residents will be notified when a new due is active.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-5">
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex gap-4">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">Delete Due</p>
                            <p className="text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-red-900 dark:text-red-100 px-1 italic">"{due.name}"</span>?
                                This will stop all billing for this due and cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 font-bold" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" size="sm" className="h-9 px-4 font-bold bg-red-500 hover:bg-red-600" onClick={handleDelete} isLoading={deleteMutation.isPending}>Yes, Delete Record</Button>
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
            <p className="text-sm font-semibold text-foreground tracking-tight">
                {value}
            </p>
        </div>
    );
}
