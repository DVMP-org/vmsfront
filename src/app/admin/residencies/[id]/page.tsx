"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminResidency, useAdminResidencyResidents, useUpdateResidency, useAdminResidencyGroups } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Building2, Calendar, Info, Users, Home, MapPin, Shield, Star, Type } from "lucide-react";
import { formatDate, getFullName, getInitials } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ResidentResidency, ResidentUser } from "@/types";
import { ResidencyForm, ResidencyFormData } from "../components/ResidencyForm";

export default function ResidencyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const residencyId = params?.id as string;
    const { data: residency, isLoading, error } = useAdminResidency(residencyId);
    const { data: residents, isLoading: residentsLoading } = useAdminResidencyResidents(residencyId)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Mutations and data for edit
    const updateResidencyMutation = useUpdateResidency();
    const { data: residencyGroupsData } = useAdminResidencyGroups({
        page: 1,
        pageSize: 100,
    });
    const residencyGroups = residencyGroupsData?.items ?? [];

    if (isLoading || residentsLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-64 col-span-1" />
                    <Skeleton className="h-[500px] col-span-2" />
                </div>
            </div>
        );
    }

    if (error || !residency) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                <h2 className="text-lg font-semibold text-destructive">Residency not found</h2>
                <Button onClick={() => router.push("/admin/residencies")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Residencies
                </Button>
            </div>
        );
    }

    const handleEditSubmit = (data: ResidencyFormData) => {
        updateResidencyMutation.mutate(
            {
                residencyId,
                data: data as any,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                },
            }
        );
    };

    const { residency_groups = [] } = residency;


    const residentColumns: Column<ResidentResidency>[] = [
        {
            key: "name",
            header: "Resident",
            sortable: true,
            accessor: (row) => {
                const fullName = getFullName(row?.resident?.user?.first_name, row?.resident?.user?.last_name);
                const initials = getInitials(row?.resident?.user?.first_name, row?.resident?.user?.last_name);
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-[var(--brand-primary)]">
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex flex-row items-center gap-2">

                                <span className="font-medium">{fullName}</span>
                                <span className="text-[10px] text-muted-foreground"> {row?.is_super_user && (
                                    <Badge variant="outline" className="flex items-center text-muted-foreground gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        Super User
                                    </Badge>
                                )}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{row?.resident?.user?.email}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            key: "phone",
            header: "Phone",
            accessor: (row) => row?.resident?.user?.phone || "-",
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <Badge variant={row?.resident?.user?.is_active ? "success" : "secondary"}>
                    {row?.resident?.user?.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/residents/${row.resident.id}`)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/residencies")}
                        className="-ml-2 h-8 hover:bg-transparent hover:underline px-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Residencies
                    </Button>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="font-medium text-foreground">{residency?.name}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[rgb(var(--brand-primary)/0.2)] rounded-xl text-[rgb(var(--brand-primary))] ring-1 ring-[rgb(var(--brand-primary))] ring-opacity-10">
                        <Home className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{residency?.name}</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant={residency?.is_active ? "success" : "secondary"} className="rounded-md">
                                {residency?.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Created {formatDate(residency?.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                        Edit Residency
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Info Column */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b border-border/50">
                            <h3 className="font-semibold flex items-center gap-2 text-sm">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                Residency Information
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</span>
                                <div className="flex items-start gap-2 text-sm">
                                    {residency?.type?.slug == 'house' ? (
                                        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    ) : residency?.type?.slug == 'apartment' ? (
                                        <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    ) : (
                                        <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    )}
                                    <span>{residency?.type?.name || "-"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</span>
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <span>{residency?.address || "-"}</span>
                                </div>
                            </div>
                            {residency?.description && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</span>
                                    <p className="text-sm leading-relaxed">{residency?.description}</p>
                                </div>
                            )}
                            <div className="pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Residency ID</span>
                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {residency?.id ? `${residency.id.split('-')[0]}...` : "-"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b border-border/50">
                            <h3 className="font-semibold flex items-center gap-2 text-sm">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                Group Memberships
                            </h3>
                        </div>
                        <CardContent className="p-4">
                            {residency_groups && residency_groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {residency_groups.map(group => (
                                        <Badge
                                            key={group.id}
                                            variant="outline"
                                            className="cursor-pointer text-muted-foreground hover:bg-muted transition-colors px-3 py-1"
                                            onClick={() => router.push(`/admin/residency-groups/${group.id}`)}
                                        >
                                            {group.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4 italic">
                                    Not assigned to any groups
                                </p>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Residents Column */}
                <Card className="lg:col-span-2 shadow-sm border-border/50">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[rgb(var(--brand-primary)/0.2)] rounded-lg text-[rgb(var(--brand-primary))]">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-tight text-foreground">Residents</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage users living in this residency</p>
                            </div>
                        </div>
                        <Badge variant="default" className="font-mono">{residents?.length}</Badge>
                    </div>

                    <CardContent className="p-0">
                        <div className="p-4">
                            {residents && residents?.length > 0 ? (
                                <DataTable
                                    data={residents}
                                    columns={residentColumns}
                                    searchable={true}
                                    searchPlaceholder="Filter residents..."
                                    getRowId={(row) => row.resident.id}
                                    pageSize={10}
                                    showPagination={true}
                                    className="border-none shadow-none"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="rounded-full bg-muted/50 p-6">
                                        <Users className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                    <div className="max-w-[280px]">
                                        <p className="font-semibold text-lg">No residents yet</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            No users are currently assigned to this residency.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => router.push("/admin/residents")}>
                                        Manage Residents
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Residency"
            >
                <ResidencyForm
                    initialData={{
                        name: residency.name,
                        address: residency.address || "",
                        description: residency.description || "",
                        residency_group_ids: Array.isArray((residency as any).residency_group_ids) ? (residency as any).residency_group_ids : [],
                    }}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditModalOpen(false)}
                    isLoading={updateResidencyMutation.isPending}
                    residencyGroups={residencyGroups}
                />
            </Modal>
        </div>
    );
}
