"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResidencyGroup, ResidencyType } from "@/types";
import { cn } from "@/lib/utils";

export const residencySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    description: z.string().optional(),
    residency_group_ids: z.array(z.string()).default([]),
    type_id: z.string().default(""),
});

export type ResidencyFormData = z.infer<typeof residencySchema>;

interface ResidencyFormProps {
    initialData?: Partial<ResidencyFormData>;
    onSubmit: (data: ResidencyFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    residencyGroups: ResidencyGroup[];
    residencyTypes?: ResidencyType[];
}

export function ResidencyForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    residencyGroups,
    residencyTypes,
}: ResidencyFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ResidencyFormData>({
        resolver: zodResolver(residencySchema),
        defaultValues: {
            name: initialData?.name || "",
            address: initialData?.address || "",
            description: initialData?.description || "",
            residency_group_ids: initialData?.residency_group_ids || [],
            type_id: initialData?.type_id || "",
        }
    });

    const selectedResidencyGroupIds = watch("residency_group_ids") || [];
    const selectedTypeId = watch("type_id") || "";

    const toggleResidencyGroupSelection = (groupId: string) => {
        const currentIds = selectedResidencyGroupIds;
        const nextIds = currentIds.includes(groupId)
            ? currentIds.filter((id) => id !== groupId)
            : [...currentIds, groupId];
        setValue("residency_group_ids", nextIds, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Residency Name"
                placeholder="e.g., Unit 101, Blue Villa"
                {...register("name")}
                error={errors.name?.message}
            />
            <Input
                label="Address"
                placeholder="Full physical address"
                {...register("address")}
                error={errors.address?.message}
            />
            <Input
                label="Description (Optional)"
                placeholder="Additional details about the residency"
                {...register("description")}
                error={errors.description?.message}
            />

            <div>
                <label className={cn(
                    "block text-sm font-medium mb-2",
                    errors.residency_group_ids ? "text-destructive" : "text-foreground"
                )}>
                    Residency Groups (Optional)
                </label>
                <div className={cn(
                    "max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 transition-colors",
                    errors.residency_group_ids ? "border-destructive bg-destructive/5" : "border-input"
                )}>
                    {residencyGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No residency groups available</p>
                    ) : (
                        residencyGroups.map((group) => (
                            <label
                                key={group.id}
                                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedResidencyGroupIds.includes(group.id)}
                                    onChange={() => toggleResidencyGroupSelection(group.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">{group.name}</span>
                            </label>
                        ))
                    )}
                </div>
                {errors.residency_group_ids && (
                    <p className="text-xs text-destructive mt-1">{errors.residency_group_ids.message}</p>
                )}
            </div>
            <div>
                <label className={cn(
                    "block text-sm font-medium mb-2",
                    errors.type_id ? "text-destructive" : "text-foreground"
                )}>
                    Types (Optional)
                </label>
                <select className={cn(
                    "w-full max-h-48 overflow-y-auto border rounded-md p-3 bg-card",
                    errors.type_id ? "border-destructive bg-destructive/5" : "border-input"
                )}
                    value={selectedTypeId}
                    onChange={(e) => setValue("type_id", e.target.value, { shouldValidate: true, shouldDirty: true })}
                >
                    <option value="">Select a type</option>
                    {residencyTypes && residencyTypes.length === 0 ? (
                        <option disabled>No residency types available</option>
                    ) : (
                        residencyTypes?.map((type) => (
                            <option key={type.id} value={type.id} className="text-sm">
                                {type.name}
                            </option>
                        ))
                    )}

                </select>
                {errors.type_id && (
                    <p className="text-xs text-destructive mt-1">{errors.type_id.message}</p>
                )}
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData?.name ? "Update Residency" : "Create Residency"}
                </Button>
            </div>
        </form>
    );
}
