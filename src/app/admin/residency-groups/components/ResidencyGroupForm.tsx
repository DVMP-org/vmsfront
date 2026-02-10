"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Residency } from "@/types";

const residencyGroupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    residency_ids: z.array(z.string()).min(1, "At least one residency must be selected"),
});

export type ResidencyGroupFormData = z.infer<typeof residencyGroupSchema>;

interface ResidencyGroupFormProps {
    initialData?: Partial<ResidencyGroupFormData>;
    onSubmit: (data: ResidencyGroupFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    allResidencies: Residency[];
}

export function ResidencyGroupForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    allResidencies,
}: ResidencyGroupFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ResidencyGroupFormData>({
        resolver: zodResolver(residencyGroupSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            residency_ids: initialData?.residency_ids || [],
        },
    });

    const selectedResidencyIds = watch("residency_ids") || [];

    const toggleResidencySelection = (residencyId: string) => {
        const currentIds = selectedResidencyIds;
        const nextIds = currentIds.includes(residencyId)
            ? currentIds.filter((id) => id !== residencyId)
            : [...currentIds, residencyId];
        setValue("residency_ids", nextIds, { shouldValidate: true, shouldDirty: true });
    };

    const toggleAllResidencies = () => {
        if (selectedResidencyIds.length === allResidencies.length) {
            setValue("residency_ids", [], { shouldValidate: true, shouldDirty: true });
        } else {
            setValue("residency_ids", allResidencies.map((h) => h.id), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Group Name"
                placeholder="e.g., Building A, East Wing"
                {...register("name")}
                error={errors.name?.message}

            />

            <div>
                <label className="block text-sm font-medium mb-2">
                    Description (Optional)
                </label>
                <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Brief description of this group"
                    {...register("description")}
                />
                {errors.description && (
                    <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={cn(
                        "block text-sm font-medium",
                        errors.residency_ids ? "text-destructive" : "text-foreground"
                    )}>
                        Residencies <span className="text-destructive">*</span>
                    </label>
                    {allResidencies.length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleAllResidencies}
                            className="h-7 text-xs"
                        >
                            {selectedResidencyIds.length === allResidencies.length
                                ? "Deselect All"
                                : "Select All"}
                        </Button>
                    )}
                </div>
                <div className={cn(
                    "border rounded-md max-h-64 overflow-y-auto p-2 transition-colors",
                    errors.residency_ids ? "border-destructive bg-destructive/5" : "border-border"
                )}>
                    {allResidencies.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">
                            No residencies available
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {allResidencies.map((residency) => (
                                <label
                                    key={residency.id}
                                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedResidencyIds.includes(residency.id)}
                                        onChange={() => toggleResidencySelection(residency.id)}
                                        className="h-4 w-4 rounded border-input"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">{residency.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {residency.address}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                {errors.residency_ids && (
                    <p className="text-xs text-destructive mt-1">{errors.residency_ids.message}</p>
                )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? "Save Changes" : "Create Group"}
                </Button>
            </div>
        </form>
    );
}
