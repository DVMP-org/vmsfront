import { useEffect, useMemo, ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAdminHouses, useAdminUsers, useCreateResident } from "@/hooks/use-admin";
import { Users, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

const createResidentSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("existing"),
        user_id: z.string().min(1, "Please select an existing user"),
        email: z.string().optional(),
        first_name: z.string().min(2, "First name must be at least 2 characters"),
        last_name: z.string().min(2, "Last name must be at least 2 characters"),
        phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format"),
        address: z.string().min(5, "Address must be at least 5 characters"),
        house_slugs: z.array(z.string()).min(1, "Please select at least one house"),
    }),
    z.object({
        mode: z.literal("new"),
        user_id: z.string().optional(),
        email: z.string().email("Please enter a valid email address"),
        first_name: z.string().min(2, "First name must be at least 2 characters"),
        last_name: z.string().min(2, "Last name must be at least 2 characters"),
        phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format"),
        address: z.string().min(5, "Address must be at least 5 characters"),
        house_slugs: z.array(z.string()).min(1, "Please select at least one house"),
    }),
]);

type CreateResidentFormData = z.infer<typeof createResidentSchema>;

export default function CreateResidentPage() {
    const router = useRouter();
    const createResident = useCreateResident();
    const { data: users, isLoading: usersLoading } = useAdminUsers();
    const { data: housesData, isLoading: housesLoading } = useAdminHouses({
        page: 1,
        pageSize: 100,
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateResidentFormData>({
        resolver: zodResolver(createResidentSchema),
        defaultValues: {
            mode: "existing",
            user_id: "",
            email: "",
            first_name: "",
            last_name: "",
            phone: "",
            address: "",
            house_slugs: [],
        },
    });

    const mode = watch("mode");
    const userId = watch("user_id");
    const selectedHouseSlugs = watch("house_slugs") || [];

    const handleHouseToggle = (houseSlug: string) => {
        const nextSlugs = selectedHouseSlugs.includes(houseSlug)
            ? selectedHouseSlugs.filter((slug) => slug !== houseSlug)
            : [...selectedHouseSlugs, houseSlug];
        setValue("house_slugs", nextSlugs, { shouldValidate: true, shouldDirty: true });
    };

    const houses = useMemo(() => housesData?.items ?? [], [housesData?.items]);
    const sortedHouses = useMemo(
        () => houses.slice().sort((a, b) => a.name.localeCompare(b.name)),
        [houses]
    );

    const sortedUsers = useMemo(() => {
        if (!users || users.length === 0) return [];
        return [...users].sort((a, b) => {
            const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email;
            const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ") || b.email;
            return nameA.localeCompare(nameB);
        });
    }, [users]);

    const selectedUser = useMemo(() => {
        if (!userId) return null;
        return sortedUsers.find((user) => user.id === userId) || null;
    }, [userId, sortedUsers]);

    useEffect(() => {
        if (mode === "existing" && selectedUser) {
            setValue("first_name", selectedUser.first_name || "");
            setValue("last_name", selectedUser.last_name || "");
            setValue("email", selectedUser.email || "");
        } else if (mode === "new") {
            setValue("user_id", "");
            setValue("first_name", "");
            setValue("last_name", "");
        }
    }, [selectedUser, mode, setValue]);

    const onSubmit = (data: CreateResidentFormData) => {
        const payload = {
            ...data,
            user_id: data.mode === "existing" ? data.user_id : "",
            email: data.mode === "existing" ? sortedUsers.find((user) => user.id === data.user_id)?.email : data.email,
            first_name: data.first_name || undefined,
            last_name: data.last_name || undefined,
            phone: data.phone || undefined,
            address: data.address || undefined,
            house_slugs: data.house_slugs || [],
        };

        createResident.mutate(payload, {
            onSuccess: () => {
                router.push("/admin/residents");
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Link href="/admin/residents" className="text-[rgb(var(--brand-primary))] hover:underline">
                            Residents
                        </Link>
                        <span>/</span>
                        <span>Create</span>
                    </p>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
                        Add Resident
                    </h1>
                    <p className="text-muted-foreground">Onboard a new resident and link their homes.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resident details</CardTitle>
                    <CardDescription>Provide details and associate houses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                            <div className="flex flex-wrap gap-3">
                                {(["existing", "new"] as const).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setValue("mode", value);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                                            mode === value
                                                ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {value === "existing" ? "Use existing user" : "Create new user"}
                                    </button>
                                ))}
                            </div>

                            {mode === "existing" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select user</label>
                                    {usersLoading ? (
                                        <p className="text-sm text-muted-foreground">Loading...</p>
                                    ) : (
                                        <div className="space-y-1">
                                            <select
                                                className={cn(
                                                    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.5)]",
                                                    (errors as any).user_id && "border-destructive"
                                                )}
                                                {...register("user_id")}
                                            >
                                                <option value="" disabled>Choose a user</option>
                                                {sortedUsers.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {([u.first_name, u.last_name].filter(Boolean).join(" ") || u.email) + " • " + u.email}
                                                    </option>
                                                ))}
                                            </select>
                                            {(errors as any).user_id && <p className="text-xs text-destructive">{(errors as any).user_id.message}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {mode === "new" && (
                            <Input label="Email" type="email" {...register("email")} error={(errors as any).email?.message} />
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="First name" {...register("first_name")} error={errors.first_name?.message} />
                            <Input label="Last name" {...register("last_name")} error={errors.last_name?.message} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Phone" {...register("phone")} error={errors.phone?.message} />
                            <Input label="Address" {...register("address")} error={errors.address?.message} />
                        </div>

                        <div className={cn("space-y-4 rounded-lg border p-4", errors.house_slugs && "border-destructive bg-destructive/5")}>
                            <div className="flex items-center gap-2">
                                <Home className={cn("h-5 w-5", errors.house_slugs ? "text-destructive" : "text-[rgb(var(--brand-primary))]")} />
                                <div>
                                    <p className={cn("text-sm font-medium", errors.house_slugs && "text-destructive")}>Associate houses</p>
                                    <p className="text-xs text-muted-foreground">Select one or more houses.</p>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {sortedHouses.map((h) => (
                                    <Checkbox
                                        key={h.id}
                                        label={h.name}
                                        description={h.address}
                                        checked={h.slug ? selectedHouseSlugs.includes(h.slug) : false}
                                        disabled={!h.slug}
                                        onChange={() => h.slug && handleHouseToggle(h.slug)}
                                    />
                                ))}
                            </div>
                            {errors.house_slugs && <p className="text-xs text-destructive">{errors.house_slugs.message}</p>}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.push("/admin/residents")}>Cancel</Button>
                            <Button type="submit" isLoading={createResident.isPending}>Create resident</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CreateResidentPage.getLayout = function getLayout(page: ReactElement) {
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
