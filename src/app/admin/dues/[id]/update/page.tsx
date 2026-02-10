"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminDue, useAdminResidencies, useAdminResidencyGroups, useUpdateDue } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { DueForm, DueFormData } from "../../components/DueForm";
import { CreateDueRequest, DueTenureLength } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function UpdateDuePage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;
    const { data: due, isLoading: dueLoading } = useAdminDue(dueId);
    const updateMutation = useUpdateDue();

    const { data: residenciesData } = useAdminResidencies({
        page: 1,
        pageSize: 100,
    });

    const { data: groupsData } = useAdminResidencyGroups({
        page: 1,
        pageSize: 100,
    });

    const residencies = useMemo(() => residenciesData?.items ?? [], [residenciesData]);
    const groups = useMemo(() => groupsData?.items ?? [], [groupsData]);

    const onSubmit = (data: DueFormData) => {
        const payload: CreateDueRequest = {
            name: data.name,
            description: data.description,
            amount: data.amount,
            recurring: data.recurring,
            residency_groups_ids: data.residency_groups_ids,
            residencies_ids: data.residencies_ids,
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
        residencies_ids: due.residencies.map(h => h.id),
        residency_groups_ids: [],
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
                residencies={residencies}
                groups={groups}
                submitLabel="Update Due"
            />
        </div>
    );
}
