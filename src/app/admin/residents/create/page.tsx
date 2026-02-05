"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useAdminResidencies, useAdminUsers, useCreateResident } from "@/hooks/use-admin";
import { toast } from "sonner";
import { Users, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createResidentSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    user_id: z.string().min(1, "Please select an existing user"),
    email: z.string().optional(),
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    residency_slugs: z.array(z.string()).min(1, "Please select at least one residency"),
  }),
  z.object({
    mode: z.literal("new"),
    user_id: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    residency_slugs: z.array(z.string()).min(1, "Please select at least one residency"),
  }),
]);

type CreateResidentFormData = z.infer<typeof createResidentSchema>;

export default function CreateResidentPage() {
  const router = useRouter();
  const createResident = useCreateResident();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: residenciesData, isLoading: residenciesLoading } = useAdminResidencies({
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
      residency_slugs: [],
    },
  });

  const mode = watch("mode");
  const userId = watch("user_id");
  const selectedResidencySlugs = watch("residency_slugs") || [];

  const handleResidencyToggle = (residencySlug: string) => {
    const nextSlugs = selectedResidencySlugs.includes(residencySlug)
      ? selectedResidencySlugs.filter((slug) => slug !== residencySlug)
      : [...selectedResidencySlugs, residencySlug];
    setValue("residency_slugs", nextSlugs, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = (data: CreateResidentFormData) => {
    const payload = {
      ...data,
      user_id: data.mode === "existing" ? data.user_id : "",
      email:
        data.mode === "existing"
          ? sortedUsers.find((user) => user.id === data.user_id)?.email
          : data.email,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      residency_slugs: data.residency_slugs || [],
    };

    createResident.mutate(payload, {
      onSuccess: () => {
        router.push("/admin/residents");
      },
    });
  };

  const residencies = useMemo(() => residenciesData?.items ?? [], [residenciesData?.items]);
  const sortedResidencies = useMemo(
    () => residencies.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [residencies]
  );

  const sortedUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    return [...users].sort((a, b) => {
      const nameA =
        [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email;
      const nameB =
        [b.first_name, b.last_name].filter(Boolean).join(" ") || b.email;
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Link href="/admin/residents" className="text-[var(--brand-primary,#213928)] hover:underline">
                Residents
              </Link>
              <span>/</span>
              <span>Create</span>
            </p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-[var(--brand-primary,#213928)]" />
              Add Resident
            </h1>
            <p className="text-muted-foreground">
              Promote an existing user into a resident profile and link their homes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resident details</CardTitle>
            <CardDescription>
              Provide the user identifier and optional profile updates. Residencies will determine their access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-wrap gap-3">
                  {(["existing", "new"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setValue("mode", value);
                        if (value === "new") {
                          setValue("user_id", "");
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                        mode === value
                          ? "border-[var(--brand-primary,#213928)] bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {value === "existing" ? "Use existing user" : "Create new user"}
                    </button>
                  ))}
                </div>

                {mode === "existing" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Select user
                    </label>
                    {usersLoading ? (
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    ) : sortedUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No users available. Onboard a user first.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <select
                          className={cn(
                            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            errors.mode === undefined && (errors as any).user_id && "border-destructive text-destructive"
                          )}
                          {...register("user_id")}
                        >
                          <option value="" disabled>
                            Choose an existing user
                          </option>
                          {sortedUsers.map((userOption) => (
                            <option key={userOption.id} value={userOption.id}>
                              {([userOption.first_name, userOption.last_name]
                                .filter(Boolean)
                                .join(" ") || userOption.email) +
                                " • " +
                                userOption.email}
                            </option>
                          ))}
                        </select>
                        {mode === "existing" && (errors as any).user_id && (
                          <p className="text-xs text-destructive">{(errors as any).user_id?.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {mode === "new" && (
                <Input
                  label="Resident email"
                  type="email"
                  placeholder="resident@example.com"
                  {...register("email")}
                  error={(errors as any).email?.message}
                />
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="First name"
                  placeholder="Optional override"
                  {...register("first_name")}
                  error={errors.first_name?.message}
                />
                <Input
                  label="Last name"
                  placeholder="Optional override"
                  {...register("last_name")}
                  error={errors.last_name?.message}
                />
              </div>


              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Phone"
                  placeholder="+234 810 000 0000"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
                <Input
                  label="Address"
                  placeholder="Apartment 5B, Riverside"
                  {...register("address")}
                  error={errors.address?.message}
                />
              </div>

              <div className={cn(
                "space-y-4 rounded-lg border p-4 transition-colors",
                errors.residency_slugs ? "border-destructive bg-destructive/5" : "border-border"
              )}>
                <div className="flex items-center gap-2">
                  <Home className={cn(
                    "h-5 w-5",
                    errors.residency_slugs ? "text-destructive" : "text-[var(--brand-primary,#213928)]"
                  )} />
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      errors.residency_slugs ? "text-destructive" : "text-foreground"
                    )}>Associate residencies</p>
                    <p className="text-xs text-muted-foreground">
                      Select one or more residencies that the resident should belong to.
                    </p>
                  </div>
                </div>
                {residenciesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading residencies...</p>
                ) : sortedResidencies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No residencies found. Create a residency first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-3 md:grid-cols-2">
                      {sortedResidencies.map((residency) => {
                        const slug = residency.slug;
                        const isSelectable = Boolean(slug);
                        return (
                          <Checkbox
                            key={residency.id}
                            label={residency.name}
                            description={residency.address}
                            checked={slug ? selectedResidencySlugs.includes(slug) : false}
                            disabled={!isSelectable}
                            onChange={() => slug && handleResidencyToggle(slug)}
                          />
                        );
                      })}
                    </div>
                    {errors.residency_slugs && (
                      <p className="text-xs text-destructive">{errors.residency_slugs.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/residents")}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createResident.isPending}>
                  Create resident
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div >
    </>
  );
}
