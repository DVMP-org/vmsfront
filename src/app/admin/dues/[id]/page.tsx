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
    Calendar,
    Info,
    Home,
    Trash2,
    Pencil,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Eye
} from "lucide-react";
import { formatDate, formatCurrency, titleCase } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { HouseLite } from "@/types";
import { useState } from "react";
import { UpdateDueModal } from "../components/UpdateDueModal";

export default function DueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;
    const { data: due, isLoading, error } = useAdminDue(dueId);
    const deleteMutation = useDeleteDue();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-64 col-span-1" />
                    <Skeleton className="h-96 col-span-2" />
                </div>
            </div>
        );
    }

    if (error || !due) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold text-destructive">Due not found</h2>
                <Button onClick={() => router.push("/admin/dues")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
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

    const houses = due.houses || [];

    const columns: Column<HouseLite>[] = [
        {
            key: "name",
            header: "House Name",
            accessor: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: "address",
            header: "Address",
            accessor: (row) => row.address || "-",
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/dues/${dueId}/house/${row.id}`)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        View Status
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/dues")}
                        className="-ml-2 h-8 hover:bg-transparent hover:underline px-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dues List
                    </Button>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="font-medium text-foreground">{due.name}</span>
                </div>
            </div>

            {/* Title and Action Buttons */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{due.name}</h1>
                    {due.description && (
                        <p className="mt-1 text-muted-foreground">{due.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={due.recurring ? "default" : "secondary"} className="h-6">
                            {due.recurring ? "Recurring" : "One-time"}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {due.recurring ? "Billed " : "Breakdown: "} {titleCase(due.recurring ? due.tenure_length : due.minimum_payment_breakdown)}
                        </span>
                        {due.recurring && due.start_date && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 ml-2" />
                                Starts {formatDate(due.start_date)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUpdateModalOpen(true)}
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        Update
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Info Column */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Due Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Total Amount</span>
                                <span className="text-2xl font-bold text-foreground">{formatCurrency(due.amount)}</span>
                            </div>
                            <div className="pt-4 border-t space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Tenure</span>
                                    <span className="font-medium capitalize">{titleCase(due.tenure_length)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm gap-4">
                                    <span className="text-muted-foreground">Breakdown</span>
                                    <span className="font-medium capitalize text-right">{titleCase(due.minimum_payment_breakdown)}</span>
                                </div>
                                {due.recurring && due.start_date && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Start Date</span>
                                        <span className="font-medium">{formatDate(due.start_date)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Houses Assigned</span>
                                <Badge variant="outline">{houses.length}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Houses Column */}
                <Card className="md:col-span-2">
                    <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Assigned Houses</CardTitle>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/dues/${dueId}/houses`)}
                        >
                            View All House Dues
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {houses.length > 0 ? (
                            <div className="p-4">
                                <DataTable
                                    data={houses}
                                    columns={columns}
                                    searchable={true}
                                    searchPlaceholder="Filter houses..."
                                    pageSize={10}
                                    getRowId={(row) => row.id}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Home className="h-12 w-12 mb-2 opacity-20" />
                                <p className="text-sm">No individual houses assigned</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Due"
            >
                <div className="space-y-4">
                    <p className="text-sm text-foreground">
                        Are you sure you want to delete <span className="font-bold">{due.name}</span>?
                        This action will prevent future billings for this due and cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            isLoading={deleteMutation.isPending}
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Update Modal */}
            <UpdateDueModal
                due={due}
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
            />
        </div>
    );
}
