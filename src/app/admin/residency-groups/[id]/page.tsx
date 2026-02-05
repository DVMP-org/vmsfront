"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminResidencyGroup } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Building2, Calendar, Info, Layout, Home, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Residency } from "@/types";

export default function ResidencyGroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params?.id as string;
    const { data: group, isLoading, error } = useAdminResidencyGroup(groupId);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-48 col-span-1" />
                    <Skeleton className="h-96 col-span-2" />
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                <h2 className="text-lg font-semibold text-destructive">Residency group not found</h2>
                <Button onClick={() => router.push("/admin/residency-groups")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Residency Groups
                </Button>
            </div>
        );
    }

    const residencies = group.residencies || [];

    const columns: Column<Residency>[] = [
        {
            key: "name",
            header: "Residency Name",
            sortable: true,
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                </div>
            ),
        },
        {
            key: "address",
            header: "Address",
            sortable: true,
            accessor: (row) => row.address || "-",
        },
        {
            key: "is_active",
            header: "Status",
            sortable: true,
            accessor: (row) => (
                <Badge variant={row.is_active ? "success" : "secondary"}>
                    {row.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "created_at",
            header: "Added On",
            sortable: true,
            accessor: (row) => formatDate(row.created_at),
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
                        onClick={() => router.push("/admin/residency-groups")}
                        className="-ml-2 h-8 hover:bg-transparent hover:underline px-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Residency Groups
                    </Button>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="font-medium text-foreground">{group.name}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{group.name}</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={group.is_active ? "success" : "secondary"} className="rounded-md">
                            {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Created {formatDate(group.created_at)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/residencies?residencyGroupId=${group.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Master List
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Statistics / Overview */}
                <Card className="md:col-span-1 border-border/50 shadow-sm overflow-hidden h-fit">
                    <div className="bg-muted/30 p-4 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Group Details
                        </h3>
                    </div>
                    <CardContent className="p-6">
                        <div className="space-y-5">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider mb-1">Description</span>
                                <p className="text-sm text-foreground leading-relaxed">
                                    {group.description || "No description provided for this group."}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-border/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Residences</span>
                                    <Badge variant="default" className="font-mono">{residencies.length}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group UUID</span>
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {group.id.split('-')[0]}...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Residencies Table */}
                <Card className="md:col-span-2 shadow-sm border-border/50">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[rgb(var(--brand-primary)/0.2)] rounded-lg text-[rgb(var(--brand-primary))]">
                                <Home className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-tight text-foreground">Member Residencies</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Residencies currently assigned to this group</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="p-4">
                            {residencies.length > 0 ? (
                                <DataTable
                                    data={residencies}
                                    columns={columns}
                                    searchable={true}
                                    searchPlaceholder="Search residencies in group..."
                                    getRowId={(row) => row.id}
                                    pageSize={10}
                                    showPagination={residencies.length > 10}
                                    className="border-none shadow-none"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="rounded-full bg-muted/50 p-6 ring-8 ring-muted/20">
                                        <Layout className="h-10 w-10 text-muted-foreground/40" />
                                    </div>
                                    <div className="max-w-[280px]">
                                        <p className="font-semibold text-lg">No residencies assigned</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            This group is empty. You can assign residencies to it from the Residencies management page.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => router.push("/admin/residencies")}>
                                        Assign Residencies
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
