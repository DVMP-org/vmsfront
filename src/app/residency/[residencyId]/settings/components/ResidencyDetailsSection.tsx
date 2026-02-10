"use client";

import { useResidentResidency, useUpdateResidency } from "@/hooks/use-resident";
import { useGetResidencyGroups } from "@/hooks/use-residency-residents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Home, Info, MapPin, Users, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { UpdateResidencyRequest } from "@/types";

const residencySchema = z.object({
    name: z.string().min(1, "Residency name is required"),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required"),
});

interface ResidencyDetailsSectionProps {
    residencyId: string;
}

export function ResidencyDetailsSection({ residencyId }: ResidencyDetailsSectionProps) {
    const { data: residentResidency, isLoading: isLoadingResidency } = useResidentResidency(residencyId);
    const { data: residencyGroups, isLoading: isLoadingGroups } = useGetResidencyGroups(residencyId);
    const updateResidencyMutation = useUpdateResidency(residencyId);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<UpdateResidencyRequest>({
        resolver: zodResolver(residencySchema),
    });

    useEffect(() => {
        if (residentResidency?.residency) {
            reset({
                name: residentResidency?.residency?.name,
                description: residentResidency?.residency?.description || "",
                address: residentResidency?.residency?.address,
            });
        }
    }, [residentResidency, reset]);

    const onSubmit = (data: UpdateResidencyRequest) => {
        updateResidencyMutation.mutate(data);
    };

    if (isLoadingResidency) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-zinc-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-zinc-600" />
                        <CardTitle>Residency Details</CardTitle>
                    </div>
                    <CardDescription>
                        Update your residency name, address and other information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Residency Name"
                                placeholder="e.g. Residency A, Building 1"
                                {...register("name")}
                                error={errors.name?.message}
                                icon={Home}
                            />

                            <Input
                                label="Address"
                                placeholder="e.g. 123 Street Name, Estate City"
                                {...register("address")}
                                error={errors.address?.message}
                                icon={MapPin}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Description (Optional)
                                </label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tell us more about this residency..."
                                    {...register("description")}
                                />
                                {errors.description && (
                                    <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-zinc-100 mt-6">
                            <Button
                                type="submit"
                                disabled={!isDirty || updateResidencyMutation.isPending}
                                isLoading={updateResidencyMutation.isPending}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="shadow-sm border-zinc-200 bg-zinc-50/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-zinc-600" />
                            <CardTitle className="text-base font-semibold">Residency Groups</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Groups this residency belongs to.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingGroups ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : residencyGroups && residencyGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {residencyGroups.map((group: any) => (
                                    <Badge key={group.id} variant="secondary" className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 px-3 py-1">
                                        {group.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 border-2 border-dashed border-zinc-200 rounded-lg">
                                <p className="text-xs text-muted-foreground">Not in any groups yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200 bg-[rgb(var(--brand-primary)/0.2)]">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                            <CardTitle className="text-sm font-semibold text-[rgb(var(--brand-primary))]">Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-xs text-[rgb(var(--brand-primary)/0.8)] leading-relaxed">
                        Changing the residency name or address will affect how your residency is identified by security and visitors.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
