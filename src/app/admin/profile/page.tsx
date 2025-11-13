"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Mail,
  Phone,
  Building2,
  UserCog,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth-store";
import { getFullName, getInitials } from "@/lib/utils";
import {
  useAdminProfileDetails,
  useUpdateAdminProfile,
} from "@/hooks/use-profile";

interface AdminFormState {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  title: string;
}

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const { data: adminProfile, isLoading } = useAdminProfileDetails();
  const updateAdminProfile = useUpdateAdminProfile();
  const adminUser = adminProfile?.user ?? user ?? null;

  const [formState, setFormState] = useState<AdminFormState>({
    first_name: adminUser?.first_name ?? "",
    last_name: adminUser?.last_name ?? "",
    phone: adminUser?.phone ?? "",
    address: adminUser?.address ?? "",
    title: adminProfile?.name ?? "",
  });

  useEffect(() => {
    if (adminUser) {
      setFormState({
        first_name: adminUser.first_name ?? "",
        last_name: adminUser.last_name ?? "",
        phone: adminUser.phone ?? "",
        address: adminUser.address ?? "",
        title: adminProfile?.name ?? "",
      });
    }
  }, [adminUser, adminProfile?.name]);

  const permissions = useMemo(
    () => normalizePermissions(adminProfile?.role?.permissions ?? adminProfile?.permissions ?? null),
    [adminProfile?.role?.permissions, adminProfile?.permissions]
  );

  if (isLoading || !adminUser) {
    return (
      <DashboardLayout type="admin">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = getFullName(adminUser.first_name, adminUser.last_name);
  const initials = getInitials(adminUser.first_name, adminUser.last_name);
  const memberSince = adminProfile?.created_at
    ? formatDistanceToNow(new Date(adminProfile.created_at), { addSuffix: true })
    : "N/A";
  const roleName = adminProfile?.role?.name ?? "Administrator";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateAdminProfile.mutate(formState);
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-semibold uppercase shadow">
                {initials}
              </div>
              <div>
                <p className="text-sm text-white/80">Admin console</p>
                <h1 className="text-3xl font-semibold">{fullName}</h1>
                <p className="text-white/80">{adminUser.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <AdminChip label="Role" value={roleName} icon={Shield} />
              <AdminChip label="Member since" value={memberSince} icon={UserCog} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Admin profile</CardTitle>
              <CardDescription>Keep your operator contact details up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="First name"
                    value={formState.first_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                  />
                  <Input
                    label="Last name"
                    value={formState.last_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                  />
                </div>
                <Input
                  label="Title / function"
                  placeholder="Community operations lead"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <Input label="Email" value={adminUser.email} disabled />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Office address</label>
                    <textarea
                      className="min-h-[98px] rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#2563eb)]"
                      value={formState.address}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, address: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-dashed border-border/60 pt-4 md:flex-row">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={updateAdminProfile.isPending}
                  >
                    Save profile
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      if (adminUser) {
                        setFormState({
                          first_name: adminUser.first_name ?? "",
                          last_name: adminUser.last_name ?? "",
                          phone: adminUser.phone ?? "",
                          address: adminUser.address ?? "",
                          title: adminProfile?.name ?? "",
                        });
                      }
                    }}
                    disabled={updateAdminProfile.isPending}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & access</CardTitle>
              <CardDescription>Review permissions and critical console actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Role permissions</p>
                <div className="flex flex-wrap gap-2">
                  {permissions.length === 0 ? (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                      Permissions will appear once assigned
                    </Badge>
                  ) : (
                    permissions.slice(0, 6).map((permission) => (
                      <Badge key={permission} variant="secondary" className="bg-white text-foreground">
                        {permission}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Multi-factor authentication
                </p>
                <p className="text-lg font-semibold">
                  Enabled on {adminUser.updated_at ? new Date(adminUser.updated_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline">Generate API token</Button>
                <Button variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Disable account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Operational footprint</CardTitle>
            <CardDescription>High-level overview of what you supervise.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FootprintTile
              label="Communities managed"
              value={adminProfile?.role?.permissions ? permissions.length : 1}
              icon={Building2}
            />
            <FootprintTile
              label="Role ID"
              value={adminProfile?.role?.code ?? adminProfile?.role_id ?? "N/A"}
              icon={Shield}
            />
            <FootprintTile
              label="Account ID"
              value={adminProfile?.id}
              icon={UserCog}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function normalizePermissions(
  raw: string | string[] | Record<string, string[]> | Record<string, unknown> | null
): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizePermissions(parsed);
    } catch {
      return raw
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  if (typeof raw === "object") {
    return Object.entries(raw).flatMap(([group, value]) => {
      if (Array.isArray(value)) {
        return value.map((permission) => `${group}:${permission}`);
      }
      return `${group}`;
    });
  }
  return [];
}

function AdminChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-inner backdrop-blur">
      <div className="flex items-center gap-2 text-white/80">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FootprintTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | undefined;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-[var(--brand-primary,#2563eb)]" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value ?? "N/A"}</p>
    </div>
  );
}
