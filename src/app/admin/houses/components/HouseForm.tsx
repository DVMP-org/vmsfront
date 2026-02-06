"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HouseGroup } from "@/types";
import { cn } from "@/lib/utils";

export const houseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  description: z.string().optional(),
  house_group_ids: z.array(z.string()).default([]),
});

export type HouseFormData = z.infer<typeof houseSchema>;

interface HouseFormProps {
  initialData?: Partial<HouseFormData>;
  onSubmit: (data: HouseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  houseGroups: HouseGroup[];
}

export function HouseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  houseGroups,
}: HouseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HouseFormData>({
    resolver: zodResolver(houseSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      description: initialData?.description || "",
      house_group_ids: initialData?.house_group_ids || [],
    },
  });

  const selectedHouseGroupIds = watch("house_group_ids") || [];

  const toggleHouseGroupSelection = (groupId: string) => {
    const currentIds = selectedHouseGroupIds;
    const nextIds = currentIds.includes(groupId)
      ? currentIds.filter((id) => id !== groupId)
      : [...currentIds, groupId];
    setValue("house_group_ids", nextIds, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="House Name"
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
        placeholder="Additional details about the house"
        {...register("description")}
        error={errors.description?.message}
      />

      <div>
        <label
          className={cn(
            "block text-sm font-medium mb-2",
            errors.house_group_ids ? "text-destructive" : "text-foreground",
          )}
        >
          House Groups (Optional)
        </label>
        <div
          className={cn(
            "max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 transition-colors",
            errors.house_group_ids
              ? "border-destructive bg-destructive/5"
              : "border-input",
          )}
        >
          {houseGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No house groups available
            </p>
          ) : (
            houseGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedHouseGroupIds.includes(group.id)}
                  onChange={() => toggleHouseGroupSelection(group.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))
          )}
        </div>
        {errors.house_group_ids && (
          <p className="text-xs text-destructive mt-1">
            {errors.house_group_ids.message}
          </p>
        )}
      </div>

      <div className="flex gap-4 justify-end pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          id="house_form_submit_button"
        >
          {initialData?.name ? "Update House" : "Create House"}
        </Button>
      </div>
    </form>
  );
}
