import { useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { useAdminDue, useAdminHouses, useAdminHouseGroups, useUpdateDue } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { DueForm, DueFormData } from "@/components/modules/admin/dues/DueForm";
import { CreateDueRequest, DueTenureLength } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function UpdateDuePage() {
    const router = useRouter();
    const { id } = router.query;
    const dueId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? "", [id]);

    const { data: due, isLoading: dueLoading } = useAdminDue(dueId);
    const updateMutation = useUpdateDue();

    const { data: housesData } = useAdminHouses({
        page: 1,
        pageSize: 100,
    });

    const { data: groupsData } = useAdminHouseGroups({
        page: 1,
        pageSize: 100,
    });

    const houses = useMemo(() => housesData?.items ?? [], [housesData]);
    const groups = useMemo(() => groupsData?.items ?? [], [groupsData]);

    const onSubmit = (data: DueFormData) => {
        const payload: CreateDueRequest = {
            name: data.name,
            description: data.description,
            amount: data.amount,
            recurring: data.recurring,
            house_groups_ids: data.house_groups_ids,
            houses_ids: data.houses_ids,
            minimum_payment_breakdown: data.recurring ? data.minimum_payment_breakdown : DueTenureLength.ONE_TIME,
            tenure_length: data.tenure_length,
            start_date: data.recurring ? data.start_date : undefined,
        };

        updateMutation.mutate({ dueId, data: payload }, {
            onSuccess: () => {
                router.push(`/admin/dues/${dueId}`);
            },
        });
    };

    if (!router.isReady) return null;

    if (dueLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!due) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold">Due not found</h2>
                <Button variant="ghost" className="mt-4" onClick={() => router.push("/admin/dues")}>
                    Back to Dues
                </Button>
            </div>
        );
    }

    const initialData: DueFormData = {
        name: due.name,
        description: due.description || "",
        amount: due.amount,
        recurring: due.recurring,
        minimum_payment_breakdown: due.minimum_payment_breakdown,
        tenure_length: due.tenure_length,
        start_date: due.start_date || "",
        houses_ids: due.houses.map(h => h.id),
        house_groups_ids: [],
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold">Update Due: {due.name}</h1>
            </div>

            <DueForm
                initialData={initialData}
                onSubmit={onSubmit}
                isLoading={updateMutation.isPending}
                houses={houses}
                groups={groups}
                submitLabel="Update Due"
            />
        </div>
    );
}

UpdateDuePage.getLayout = function getLayout(page: ReactElement) {
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
