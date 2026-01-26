import { useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { useAdminHouses, useAdminHouseGroups, useCreateDue } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { DueForm, DueFormData } from "@/components/modules/admin/dues/DueForm";
import { CreateDueRequest, DueTenureLength } from "@/types";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function CreateDuePage() {
    const router = useRouter();
    const createMutation = useCreateDue();

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

        createMutation.mutate(payload, {
            onSuccess: () => {
                router.push("/admin/dues");
            },
        });
    };

    if (!router.isReady) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-xl font-bold">Create New Due</h1>
            </div>

            <DueForm
                onSubmit={onSubmit}
                isLoading={createMutation.isPending}
                houses={houses}
                groups={groups}
                submitLabel="Create Due"
            />
        </div>
    );
}

CreateDuePage.getLayout = function getLayout(page: ReactElement) {
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
