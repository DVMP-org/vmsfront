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
  Save,
  RotateCcw,
  ExternalLink,
  Check,
  Copy,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPassCode = () => {
    if (!residentProfile?.pass_code) return;
    navigator.clipboard.writeText(residentProfile.pass_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
  const membershipStatus = residentProfile?.onboarded ? "Active" : "Pending";
  const passCode = residentProfile?.pass_code ?? "—";
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
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="resident">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[rgb(var(--brand-primary)/0.2)] text-lg font-medium text-[rgb(var(--brand-primary))]">
              {getInitials(residentUser.first_name, residentUser.last_name)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{fullName}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{residentUser.email}</span>
                <span className="text-border">|</span>
                <span className={cn(
                  "flex items-center gap-1.5",
                  residentProfile?.onboarded ? "text-emerald-600" : "text-amber-600"
                )}>
                  <UserCheck className="h-3.5 w-3.5" />
                  {membershipStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
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
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Changes
            </Button>
            <Button
              size="sm"
              onClick={handleContactSubmit}
              isLoading={updateProfileMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-8 lg:col-span-2">

            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">Contact Information</h2>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="First name"
                    value={contactForm.first_name}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                    className="h-9 text-sm"
                  />
                  <Input
                    label="Last name"
                    value={contactForm.last_name}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                    className="h-9 text-sm"
                  />
                  <Input
                    label="Email address"
                    value={residentUser.email}
                    disabled
                    className="bg-muted/50 h-9 text-sm"
                  />
                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="h-9 text-sm"
                  />
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
                    <textarea
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your residential address"
                      value={contactForm.address}
                      onChange={(event) =>
                        setContactForm((prev) => ({ ...prev, address: event.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Linked Homes */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-foreground">Linked Residences</h2>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {houses.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No residences linked to this account.
                  </div>
                ) : (
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Residence</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Address</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Role</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {houses.map((house) => (
                          <tr key={house.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                {house.name}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">{house.address}</td>
                            <td className="p-4 align-middle">
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                Resident
                              </div>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/house/${house.id}/forum`)}
                                title="Open House Portal"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Open</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">

            {/* Account Metadata */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-foreground">Account Details</h2>
              <div className="rounded-lg border border-border bg-card">
                {residentProfile?.badge_url && (
                  <div className="border-b border-border p-6 text-center">
                    <div className="mx-auto mb-2 aspect-square w-48 overflow-hidden rounded-xl bg-white p-2 shadow-sm">
                      <img
                        src={residentProfile.badge_url}
                        alt="Resident QR Badge"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scan this QR code at the gate for quick access.
                    </p>
                  </div>
                )}
                <div className="border-b border-border p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Pass Code</div>
                  <button
                    onClick={handleCopyPassCode}
                    className="group flex w-full items-center gap-2 rounded-md py-1 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    title="Click to copy pass code"
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-lg font-medium tracking-wide">{passCode}</span>
                    <div className="ml-auto flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Member Since</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {memberSince}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Account ID</div>
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {residentUser?.id}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-foreground">Preferences</h2>
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">Receive updates via email</div>
                  </div>
                  <PreferenceToggle
                    active={preferences.emailUpdates}
                    onChange={() => setPreferences(p => ({ ...p, emailUpdates: !p.emailUpdates }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">SMS Alerts</div>
                    <div className="text-xs text-muted-foreground">Urgent alerts to phone</div>
                  </div>
                  <PreferenceToggle
                    active={preferences.smsUpdates}
                    onChange={() => setPreferences(p => ({ ...p, smsUpdates: !p.smsUpdates }))}
                  />
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PreferenceToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? "bg-[rgb(var(--brand-primary))]" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          active ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

