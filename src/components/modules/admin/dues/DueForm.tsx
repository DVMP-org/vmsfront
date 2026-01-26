"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DueTenureLength, House, HouseGroup } from "@/types";
import { Landmark, Home, Users, Zap, Repeat } from "lucide-react";

export const dueSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    recurring: z.boolean().default(false),
    minimum_payment_breakdown: z.string(),
    tenure_length: z.string(),
    start_date: z.string().optional(),
    house_groups_ids: z.array(z.string()),
    houses_ids: z.array(z.string()),
});

export type DueFormData = z.infer<typeof dueSchema>;

const TENURE_OPTIONS = [
    { value: DueTenureLength.ONE_TIME, label: "One Time" },
    { value: DueTenureLength.DAILY, label: "Daily" },
    { value: DueTenureLength.WEEKLY, label: "Weekly" },
    { value: DueTenureLength.MONTHLY, label: "Monthly" },
    { value: DueTenureLength.QUARTERLY, label: "Quarterly" },
    { value: DueTenureLength.BIANNUALLY, label: "Biannually" },
    { value: DueTenureLength.YEARLY, label: "Yearly" },
];

const TENURE_WEIGHTS: Record<string, number> = {
    [DueTenureLength.DAILY]: 1,
    [DueTenureLength.WEEKLY]: 2,
    [DueTenureLength.MONTHLY]: 3,
    [DueTenureLength.QUARTERLY]: 4,
    [DueTenureLength.BIANNUALLY]: 5,
    [DueTenureLength.YEARLY]: 6,
};

interface DueFormProps {
    initialData?: Partial<DueFormData>;
    onSubmit: (data: DueFormData) => void;
    isLoading?: boolean;
    houses: House[];
    groups: HouseGroup[];
    submitLabel?: string;
}

export function DueForm({
    initialData,
    onSubmit,
    isLoading,
    houses,
    groups,
    submitLabel = "Save Due"
}: DueFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DueFormData>({
        resolver: zodResolver(dueSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            amount: initialData?.amount || 0,
            recurring: initialData?.recurring || false,
            minimum_payment_breakdown: initialData?.minimum_payment_breakdown || DueTenureLength.ONE_TIME,
            tenure_length: initialData?.tenure_length || DueTenureLength.MONTHLY,
            start_date: initialData?.start_date || "",
            house_groups_ids: initialData?.house_groups_ids || [],
            houses_ids: initialData?.houses_ids || [],
        },
    });

    const recurring = watch("recurring");
    const selectedHouseIds = watch("houses_ids");
    const selectedGroupIds = watch("house_groups_ids");

    const toggleSelection = (id: string, field: "houses_ids" | "house_groups_ids") => {
        const current = watch(field);
        const next = current.includes(id)
            ? current.filter((i) => i !== id)
            : [...current, id];
        setValue(field, next, { shouldValidate: true });
    };

    const tenureLength = watch("tenure_length");
    const breakdown = watch("minimum_payment_breakdown");

    useEffect(() => {
        const tenureWeight = TENURE_WEIGHTS[tenureLength] || 0;
        const breakdownWeight = TENURE_WEIGHTS[breakdown] || 0;

        if (breakdownWeight >= tenureWeight && tenureWeight > 1) {
            const validBreakdowns = Object.entries(TENURE_WEIGHTS)
                .filter(([_, w]) => w < tenureWeight)
                .sort((a, b) => b[1] - a[1]);

            if (validBreakdowns.length > 0) {
                setValue("minimum_payment_breakdown", validBreakdowns[0][0]);
            }
        } else if (tenureWeight === 1) {
            if (breakdown !== DueTenureLength.DAILY) {
                setValue("minimum_payment_breakdown", DueTenureLength.DAILY);
            }
        }
    }, [tenureLength, breakdown, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <Input
                            label="Due Name"
                            placeholder="e.g. Monthly Security Fee"
                            {...register("name")}
                            error={errors.name?.message}
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe the purpose..."
                                {...register("description")}
                            />
                            {errors.description?.message && <p className="text-xs text-destructive">{errors.description?.message}</p>}
                        </div>
                        <Input
                            label="Amount (₦)"
                            type="number"
                            placeholder="0.00"
                            {...register("amount")}
                            error={errors.amount?.message}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Billing Cycle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setValue("recurring", false);
                                    setValue("tenure_length", DueTenureLength.ONE_TIME);
                                    setValue("minimum_payment_breakdown", DueTenureLength.ONE_TIME);
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-2 text-center ${!recurring
                                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.05)] text-[rgb(var(--brand-primary))]"
                                    : "border-zinc-200 text-muted-foreground"
                                    }`}
                            >
                                <Zap className="h-5 w-5" />
                                <div className="text-sm font-semibold">One-time</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setValue("recurring", true);
                                    setValue("tenure_length", DueTenureLength.MONTHLY);
                                    setValue("minimum_payment_breakdown", DueTenureLength.MONTHLY);
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-2 text-center ${recurring
                                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.05)] text-[rgb(var(--brand-primary))]"
                                    : "border-zinc-200 text-muted-foreground"
                                    }`}
                            >
                                <Repeat className="h-5 w-5" />
                                <div className="text-sm font-semibold">Recurring</div>
                            </button>
                        </div>

                        {recurring && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tenure Length</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.5)]"
                                        {...register("tenure_length")}
                                    >
                                        {TENURE_OPTIONS.filter((o) => o.value !== DueTenureLength.ONE_TIME).map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Payment Breakdown</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.5)]"
                                        {...register("minimum_payment_breakdown")}
                                    >
                                        {TENURE_OPTIONS.filter((o) => {
                                            if (o.value === DueTenureLength.ONE_TIME) return false;
                                            const optionWeight = TENURE_WEIGHTS[o.value] || 0;
                                            const currentTenureWeight = TENURE_WEIGHTS[tenureLength] || 0;
                                            return currentTenureWeight > 1 ? optionWeight < currentTenureWeight : optionWeight <= currentTenureWeight;
                                        }).map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="Start Date" type="date" {...register("start_date")} error={errors.start_date?.message} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{recurring ? "Recurring" : "One-time"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Frequency:</span>
                                <span className="font-medium capitalize">{watch("tenure_length").replace("_", " ")}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center">
                                <span className="text-sm font-semibold">Total Cost:</span>
                                <span className="text-lg font-bold">₦{watch("amount") || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Landmark className="h-4 w-4" />
                                    House Groups ({selectedGroupIds.length})
                                </label>
                                <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                                    {groups.map((group) => (
                                        <label key={group.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroupIds.includes(group.id)}
                                                onChange={() => toggleSelection(group.id, "house_groups_ids")}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm">{group.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Individual Houses ({selectedHouseIds.length})
                                </label>
                                <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                                    {houses.map((house) => (
                                        <label key={house.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedHouseIds.includes(house.id)}
                                                onChange={() => toggleSelection(house.id, "houses_ids")}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm">{house.name}</span>
                                                <span className="text-[10px] text-muted-foreground truncate">{house.address}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" isLoading={isLoading}>{submitLabel}</Button>
            </div>
        </form>
    );
}
