"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminResidencies, useAdminResidencyGroups, useCreateDue } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { DueForm, DueFormData } from "../components/DueForm";
import { CreateDueRequest, DueTenureLength } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function CreateDuePage() {
    const router = useRouter();
    const createMutation = useCreateDue();

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
            residency_groups_ids: data?.residency_groups_ids,
            residencies_ids: data?.residencies_ids,
            minimum_payment_breakdown: data.recurring ? data.minimum_payment_breakdown : DueTenureLength.ONE_TIME,
            tenure_length: data.recurring ? data.tenure_length : DueTenureLength.ONE_TIME,
            start_date: data.recurring ? data.start_date : undefined,
        };

        createMutation.mutate(payload, {
            onSuccess: () => {
                router.push("/admin/dues");
            },
        });
    };

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
                residencies={residencies}
                groups={groups}
                submitLabel="Create Due"
            />
        </div>
    );
}
