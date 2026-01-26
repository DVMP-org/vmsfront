import { useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { useAdminHouseGroup } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Info, Home, ExternalLink, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable, Column } from "@/components/ui/DataTable";
import { House } from "@/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function HouseGroupDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const groupId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? "", [id]);

    const { data: group, isLoading, error } = useAdminHouseGroup(groupId);

    if (!router.isReady) return null;

    if (isLoading) return <div className="space-y-6 p-8"><Skeleton className="h-10 w-24" /><div className="grid grid-cols-3 gap-6"><Skeleton className="h-48 col-span-1" /><Skeleton className="h-96 col-span-2" /></div></div>;

    if (error || !group) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <h2 className="text-lg font-semibold text-destructive">Not found</h2>
                <Button onClick={() => router.push("/admin/house-groups")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            </div>
        );
    }

    const columns: Column<House>[] = [
        { key: "name", header: "House Name", accessor: (row) => <span className="font-medium">{row.name}</span> },
        { key: "address", header: "Address", accessor: (row) => row.address || "-" },
        { key: "is_active", header: "Status", accessor: (row) => <Badge variant={row.is_active ? "success" : "secondary"}>{row.is_active ? "Active" : "Inactive"}</Badge> },
        { key: "created_at", header: "Added", accessor: (row) => formatDate(row.created_at) },
        { key: "actions", header: "Actions", sortable: false, accessor: (row) => <Button variant="outline" size="sm" onClick={() => router.push(`/admin/houses/${row.id}`)}><Eye className="h-3.5 w-3.5 mr-1.5" />View</Button> }
    ];

    return (
        <div className="space-y-6">
            <button onClick={() => router.push("/admin/house-groups")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4"><ArrowLeft className="h-4 w-4" />House Groups</button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={group.is_active ? "success" : "secondary"}>{group.is_active ? "Active" : "Inactive"}</Badge>
                        <span className="text-xs text-muted-foreground">Created {formatDate(group.created_at)}</span>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/houses?houseGroupId=${group.id}`)}><ExternalLink className="h-4 w-4 mr-2" />View in List</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="h-fit">
                    <div className="p-4 border-b bg-muted/30 flex items-center gap-2 font-semibold"><Info className="h-4 w-4" />Details</div>
                    <CardContent className="p-6 space-y-4">
                        <div><p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Description</p><p className="text-sm">{group.description || "No description."}</p></div>
                        <div className="pt-4 border-t flex justify-between items-center"><span className="text-xs font-bold text-muted-foreground uppercase">Residences</span><Badge>{group.houses?.length || 0}</Badge></div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <div className="p-6 border-b flex items-center gap-3"><div className="p-2 bg-[rgb(var(--brand-primary)/0.2)] rounded-lg text-[rgb(var(--brand-primary))]"><Home className="h-5 w-5" /></div><div><h3 className="font-semibold text-lg">Member Houses</h3><p className="text-xs text-muted-foreground">Assigned to this group</p></div></div>
                    <CardContent className="p-0">
                        <DataTable data={group.houses || []} columns={columns} searchable={true} className="border-none" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

HouseGroupDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>{page}</AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
