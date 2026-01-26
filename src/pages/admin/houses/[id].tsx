import { useState, useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { useAdminHouse, useAdminHouseResidents, useUpdateHouse, useAdminHouseGroups } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Calendar, Info, Users, Home, MapPin, Shield, Star } from "lucide-react";
import { formatDate, getFullName, getInitials } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ResidentHouse } from "@/types";
import { HouseForm, HouseFormData } from "@/components/modules/admin/houses/HouseForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function HouseDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const houseId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? "", [id]);

    const { data: house, isLoading, error } = useAdminHouse(houseId);
    const { data: residents, isLoading: residentsLoading } = useAdminHouseResidents(houseId);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const updateHouseMutation = useUpdateHouse();
    const { data: houseGroupsData } = useAdminHouseGroups({ page: 1, pageSize: 100 });
    const houseGroups = houseGroupsData?.items ?? [];

    if (!router.isReady) return null;

    if (isLoading || residentsLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-24" />
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-64 col-span-1" />
                    <Skeleton className="h-[500px] col-span-2" />
                </div>
            </div>
        );
    }

    if (error || !house) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                <h2 className="text-lg font-semibold text-destructive">House not found</h2>
                <Button onClick={() => router.push("/admin/houses")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Houses
                </Button>
            </div>
        );
    }

    const handleEditSubmit = (data: HouseFormData) => {
        updateHouseMutation.mutate(
            { houseId, data: data as any },
            { onSuccess: () => setIsEditModalOpen(false) }
        );
    };

    const residentColumns: Column<ResidentHouse>[] = [
        {
            key: "name",
            header: "Resident",
            sortable: true,
            accessor: (row) => {
                const fullName = getFullName(row?.resident?.user?.first_name, row?.resident?.user?.last_name);
                const initials = getInitials(row?.resident?.user?.first_name, row?.resident?.user?.last_name);
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-[rgb(var(--brand-primary))]">
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex flex-row items-center gap-2">
                                <span className="font-medium">{fullName}</span>
                                {row?.is_super_user && (
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        Super
                                    </Badge>
                                )}
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
                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/residents/${row.resident.id}`)}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/houses")} className="-ml-2 h-8 px-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Houses
                </Button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[rgb(var(--brand-primary)/0.2)] rounded-xl text-[rgb(var(--brand-primary))]">
                        <Home className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{house?.name}</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant={house?.is_active ? "success" : "secondary"}>{house?.is_active ? "Active" : "Inactive"}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Created {formatDate(house?.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>Edit House</Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b">
                            <h3 className="font-semibold flex items-center gap-2 text-sm"><Info className="h-4 w-4" />House Info</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Address</span>
                                <div className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 mt-0.5" /><span>{house?.address || "-"}</span></div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">ID</span>
                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{house?.id ? `${house.id.split('-')[0]}...` : "-"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b">
                            <h3 className="font-semibold flex items-center gap-2 text-sm"><Shield className="h-4 w-4" />Groups</h3>
                        </div>
                        <CardContent className="p-4">
                            {house?.house_groups && house.house_groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {house.house_groups.map(g => (
                                        <Badge key={g.id} variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted" onClick={() => router.push(`/admin/house-groups/${g.id}`)}>
                                            {g.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-center py-4 text-muted-foreground italic">None</p>}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <div className="p-6 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-5 w-5" />Residents</h3>
                        <Badge variant="default">{residents?.length || 0}</Badge>
                    </div>
                    <CardContent className="p-4">
                        {residents && residents.length > 0 ? (
                            <DataTable
                                data={residents as ResidentHouse[]}
                                columns={residentColumns}
                                searchable={true}
                                getRowId={(row) => row.resident.id}
                                pageSize={10}
                                showPagination={true}
                            />
                        ) : <div className="py-20 text-center"><p className="text-muted-foreground">No residents found</p></div>}
                    </CardContent>
                </Card>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit House">
                <HouseForm
                    initialData={{
                        name: house.name,
                        address: house.address || "",
                        description: house.description || "",
                        house_group_ids: house.house_groups?.map(g => g.id) || [],
                    }}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditModalOpen(false)}
                    isLoading={updateHouseMutation.isPending}
                    houseGroups={houseGroups}
                />
            </Modal>
        </div>
    );
}

HouseDetailPage.getLayout = function getLayout(page: ReactElement) {
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
