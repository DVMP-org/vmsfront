import { useResidentHouse, useUpdateHouse } from "@/hooks/use-resident";
import { useGetHouseGroups } from "@/hooks/use-house-residents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Home, Info, MapPin, Users, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { UpdateHouseRequest } from "@/types";

const houseSchema = z.object({
    name: z.string().min(1, "House name is required"),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required"),
});

interface HouseDetailsSectionProps {
    houseId: string;
}

export function HouseDetailsSection({ houseId }: HouseDetailsSectionProps) {
    const { data: residentHouse, isLoading: isLoadingHouse } = useResidentHouse(houseId);
    const { data: houseGroups, isLoading: isLoadingGroups } = useGetHouseGroups(houseId);
    const updateHouseMutation = useUpdateHouse(houseId);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<UpdateHouseRequest>({
        resolver: zodResolver(houseSchema),
    });

    useEffect(() => {
        if (residentHouse?.house) {
            reset({
                name: residentHouse.house.name,
                description: residentHouse.house.description || "",
                address: residentHouse.house.address,
            });
        }
    }, [residentHouse, reset]);

    const onSubmit = (data: UpdateHouseRequest) => {
        updateHouseMutation.mutate(data);
    };

    if (isLoadingHouse) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-zinc-200">
                <CardHeader>
                    <div className="flex items-center gap-2"><Home className="h-5 w-5 text-zinc-600" /><CardTitle>House Details</CardTitle></div>
                    <CardDescription>Update your house name, address and other information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input label="House Name" placeholder="e.g. House A" {...register("name")} error={errors.name?.message} icon={Home} />
                        <Input label="Address" placeholder="e.g. 123 Street" {...register("address")} error={errors.address?.message} icon={MapPin} />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Tell us more..." {...register("description")} />
                        </div>
                        <div className="flex justify-end pt-4 border-t mt-6">
                            <Button type="submit" disabled={!isDirty || updateHouseMutation.isPending} isLoading={updateHouseMutation.isPending}>Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="shadow-sm border-zinc-200 bg-zinc-50/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-zinc-600" /><CardTitle className="text-base font-semibold">House Groups</CardTitle></div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingGroups ? <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> : houseGroups?.length ? (
                            <div className="flex flex-wrap gap-2">{houseGroups.map((g: any) => (<Badge key={g.id} variant="secondary" className="bg-white border-zinc-200 text-zinc-700 font-normal px-3 py-1">{g.name}</Badge>))}</div>
                        ) : <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">Not in any groups.</p>}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200 bg-[rgb(var(--brand-primary)/0.2)]">
                    <CardHeader><div className="flex items-center gap-2 text-[rgb(var(--brand-primary))] text-sm font-semibold"><Info className="h-4 w-4" />Information</div></CardHeader>
                    <CardContent className="text-xs text-[rgb(var(--brand-primary)/0.8)] leading-relaxed">Changing the house name or address will affect identification by security and visitors.</CardContent>
                </Card>
            </div>
        </div>
    );
}
