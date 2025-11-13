"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  Phone,
  Home,
  Shield,
  Calendar,
  UserCheck,
  Hash,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth-store";
import { getFullName, getInitials, cn } from "@/lib/utils";
import { useProfile as useDashboardProfile } from "@/hooks/use-auth";
import {
  useResidentProfileDetails,
  useUpdateResidentProfile,
} from "@/hooks/use-profile";

interface ContactFormState {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

export default function ResidentProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: residentProfile, isLoading } = useResidentProfileDetails();
  const { data: dashboardProfile } = useDashboardProfile();
  const updateProfileMutation = useUpdateResidentProfile();

  const isAdminUser = useMemo(() => {
    if (!user) return false;
    const type = `${user.user_type ?? ""}`.toLowerCase();
    return user.is_admin || type === "admin";
  }, [user]);

  useEffect(() => {
    if (isAdminUser) {
      router.replace("/admin/profile");
    }
  }, [isAdminUser, router]);

  const houses = useMemo(
    () => dashboardProfile?.houses ?? residentProfile?.houses ?? [],
    [dashboardProfile?.houses, residentProfile?.houses]
  );

  const residentUser = residentProfile?.user ?? user ?? null;
  const [contactForm, setContactForm] = useState<ContactFormState>({
    first_name: residentUser?.first_name ?? "",
    last_name: residentUser?.last_name ?? "",
    phone: residentUser?.phone ?? "",
    address: residentUser?.address ?? "",
  });
  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    smsUpdates: false,
  });

  useEffect(() => {
    if (residentUser) {
      setContactForm({
        first_name: residentUser.first_name ?? "",
        last_name: residentUser.last_name ?? "",
        phone: residentUser.phone ?? "",
        address: residentUser.address ?? "",
      });
    }
  }, [residentUser]);

  const fullName = residentUser ? getFullName(residentUser.first_name, residentUser.last_name) : "Resident";
  const initials = getInitials(residentUser?.first_name, residentUser?.last_name);
  const membershipStatus = residentProfile?.onboarded ? "Active member" : "Pending activation";
  const passCode = residentProfile?.pass_code ?? "Not issued yet";
  const memberSince = residentProfile?.created_at
    ? formatDistanceToNow(new Date(residentProfile.created_at), { addSuffix: true })
    : "N/A";

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfileMutation.mutate(contactForm);
  };

  if (isAdminUser) {
    return (
      <DashboardLayout type="resident">
        <div className="py-24 text-center text-muted-foreground">
          Redirecting to the admin profile experience...
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading || !residentUser) {
    return (
      <DashboardLayout type="resident">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="resident">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#2563eb)] to-indigo-700 text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-semibold uppercase shadow-inner">
                {initials}
              </div>
              <div>
                <p className="text-sm text-white/80">Resident account</p>
                <h1 className="text-3xl font-semibold">{fullName}</h1>
                <p className="text-white/80">{residentUser.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <StatChip label="Linked homes" value={houses.length} icon={Home} />
              <StatChip label="Status" value={membershipStatus} icon={UserCheck} />
              <StatChip label="Member since" value={memberSince} icon={Calendar} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact & Personal Information</CardTitle>
              <CardDescription>Update how the community can reach you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="First name"
                    value={contactForm.first_name}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                  />
                  <Input
                    label="Last name"
                    value={contactForm.last_name}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                  />
                </div>
                <Input label="Email" value={residentUser.email} disabled />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <textarea
                      className="min-h-[98px] rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#2563eb)]"
                      placeholder="Your address"
                      value={contactForm.address}
                      onChange={(event) =>
                        setContactForm((prev) => ({ ...prev, address: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-dashed border-border/60 pt-4 md:flex-row">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={updateProfileMutation.isPending}
                  >
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      if (residentUser) {
                        setContactForm({
                          first_name: residentUser.first_name ?? "",
                          last_name: residentUser.last_name ?? "",
                          phone: residentUser.phone ?? "",
                          address: residentUser.address ?? "",
                        });
                      }
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Snapshot</CardTitle>
              <CardDescription>Your membership identifiers and device preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Resident pass code
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-wider">{passCode}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this only with trusted building staff.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                <div className="flex flex-wrap gap-2">
                  <PreferenceToggle
                    label="Email updates"
                    active={preferences.emailUpdates}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, emailUpdates: !prev.emailUpdates }))
                    }
                    icon={Mail}
                  />
                  <PreferenceToggle
                    label="SMS alerts"
                    active={preferences.smsUpdates}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, smsUpdates: !prev.smsUpdates }))
                    }
                    icon={Phone}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Notification preferences are stored locally for now — server-side sync coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Linked homes</CardTitle>
            <CardDescription>Memberships and roles across your residences.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {houses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-muted-foreground">
                You are not linked to any homes yet. Choose a house from the dashboard to get started.
              </div>
            ) : (
              houses.map((house) => (
                <div
                  key={house.id}
                  className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{house.name}</p>
                      <p className="text-sm text-muted-foreground">{house.address}</p>
                    </div>
                    {/* <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                      Primary
                    </Badge> */}
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {house?.address ?? "No Address Provided"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Access level: Resident
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => router.push(`/house/${house.id}/forum`)}
                  >
                    Open house space
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 shadow-inner backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-white/80">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function PreferenceToggle({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-[var(--brand-primary,#2563eb)] bg-[var(--brand-primary,#2563eb)]/10 text-[var(--brand-primary,#2563eb)]"
          : "border-border/70 text-muted-foreground hover:bg-muted/40"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
