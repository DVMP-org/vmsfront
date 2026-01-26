import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { House } from "@/types";

const houseGroupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    house_ids: z.array(z.string()).min(1, "At least one house must be selected"),
});

export type HouseGroupFormData = z.infer<typeof houseGroupSchema>;

interface HouseGroupFormProps {
    initialData?: Partial<HouseGroupFormData>;
    onSubmit: (data: HouseGroupFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    allHouses: House[];
}

export function HouseGroupForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    allHouses,
}: HouseGroupFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<HouseGroupFormData>({
        resolver: zodResolver(houseGroupSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            house_ids: initialData?.house_ids || [],
        },
    });

    const selectedHouseIds = watch("house_ids") || [];

    const toggleHouseSelection = (houseId: string) => {
        const currentIds = selectedHouseIds;
        const nextIds = currentIds.includes(houseId)
            ? currentIds.filter((id) => id !== houseId)
            : [...currentIds, houseId];
        setValue("house_ids", nextIds, { shouldValidate: true, shouldDirty: true });
    };

    const toggleAllHouses = () => {
        if (selectedHouseIds.length === allHouses.length) {
            setValue("house_ids", [], { shouldValidate: true, shouldDirty: true });
        } else {
            setValue("house_ids", allHouses.map((h) => h.id), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Group Name"
                placeholder="e.g., Building A"
                {...register("name")}
                error={errors.name?.message}
            />

            <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Brief description..."
                    {...register("description")}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={cn("block text-sm font-medium", errors.house_ids ? "text-destructive" : "text-foreground")}>
                        Houses <span className="text-destructive">*</span>
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={toggleAllHouses} className="h-7 text-xs">
                        {selectedHouseIds.length === allHouses.length ? "Deselect All" : "Select All"}
                    </Button>
                </div>
                <div className={cn("border rounded-md max-h-64 overflow-y-auto p-2", errors.house_ids ? "border-destructive bg-destructive/5" : "border-border")}>
                    {allHouses.map((house) => (
                        <label key={house.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                            <input type="checkbox" checked={selectedHouseIds.includes(house.id)} onChange={() => toggleHouseSelection(house.id)} className="h-4 w-4 rounded" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{house.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{house.address}</div>
                            </div>
                        </label>
                    ))}
                </div>
                {errors.house_ids && <p className="text-xs text-destructive mt-1">{errors.house_ids.message}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isLoading}>{initialData ? "Save Changes" : "Create Group"}</Button>
            </div>
        </form>
    );
}
