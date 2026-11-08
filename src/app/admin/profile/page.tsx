"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Briefcase,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Shield,
  User,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { PluginMetricStrip, PluginNotice } from "@/components/plugins/PluginUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAdminProfileDetails,
  useUpdateAdminProfile,
} from "@/hooks/use-profile";
import { parseApiError } from "@/lib/error-utils";
import {
  cn,
  getFullName,
  getInitials,
  titleCase,
} from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

interface AdminFormState {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  title: string;
}

function initialForm(
  user:
    | {
        first_name?: string | null;
        last_name?: string | null;
        phone?: string | null;
        address?: string | null;
      }
    | null
    | undefined,
  title?: string | null,
): AdminFormState {
  return {
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    title: title ?? "",
  };
}

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const organization = useAppStore((state) => state.organization);
  const {
    data: adminProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminProfileDetails();
  const updateAdminProfile = useUpdateAdminProfile();
  const adminUser = adminProfile?.user ?? user ?? null;
  const initial = useMemo(
    () => initialForm(adminUser, adminProfile?.name),
    [adminUser, adminProfile?.name],
  );
  const [formState, setFormState] = useState<AdminFormState>(initial);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormState(initial);
  }, [initial]);

  const permissions = useMemo(
    () =>
      normalizePermissions(
        adminProfile?.role?.permissions ?? adminProfile?.permissions ?? null,
      ),
    [adminProfile?.role?.permissions, adminProfile?.permissions],
  );
  const isDirty = Object.entries(formState).some(
    ([key, value]) => value !== initial[key as keyof AdminFormState],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!formState.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
    }
    if (!formState.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    updateAdminProfile.mutate(formState);
  };

  if (isLoading || (!adminUser && !isError)) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Account"
          title="Profile"
          description="Loading account details…"
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !adminUser) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Account" title="Profile" />
        <PluginNotice
          tone="danger"
          title="Profile could not be loaded"
          action={
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {parseApiError(error).message}
        </PluginNotice>
      </div>
    );
  }

  const fullName = getFullName(adminUser.first_name, adminUser.last_name);
  const initials = getInitials(adminUser.first_name, adminUser.last_name);
  const roleName = adminProfile?.role?.name ?? "Administrator";
  const isActive = adminUser.is_active ?? true;

  return (
    <form
      className="space-y-5 pb-8 text-[var(--vms-ink)]"
      onSubmit={handleSubmit}
    >
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage the identity shown in organization and property operations."
        metadata={
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-full bg-[var(--vms-action)] text-sm font-semibold text-[var(--vms-on-action)]"
              aria-hidden="true"
            >
              {initials}
            </span>
            <span>
              <strong className="block text-sm font-semibold">{fullName}</strong>
              <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                {roleName} · {adminUser.email}
              </span>
            </span>
            <Badge variant={isActive ? "success" : "danger"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        }
        secondaryActions={
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFormState(initial);
              setFormErrors({});
            }}
            disabled={!isDirty || updateAdminProfile.isPending}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        }
        primaryAction={
          <Button
            type="submit"
            isLoading={updateAdminProfile.isPending}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save changes
          </Button>
        }
      />

      {updateAdminProfile.isSuccess ? (
        <PluginNotice tone="success" title="Profile updated">
          Your account details were saved.
        </PluginNotice>
      ) : null}
      {updateAdminProfile.isError ? (
        <PluginNotice tone="danger" title="Profile was not saved">
          {parseApiError(updateAdminProfile.error).message}
        </PluginNotice>
      ) : null}

      <PluginMetricStrip
        label="Account summary"
        metrics={[
          {
            label: "Access",
            value: permissions.length || 1,
            detail: "Effective capabilities",
            icon: Shield,
          },
          {
            label: "Role",
            value: titleCase(adminProfile?.role?.code ?? "admin"),
            detail: roleName,
            icon: UserCog,
          },
          {
            label: "Organization",
            value: organization?.name ?? "Current organization",
            detail: "Account scope",
            icon: Building2,
          },
          {
            label: "Status",
            value: isActive ? "Active" : "Inactive",
            detail: "Account state",
            icon: CheckCircle2,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b border-[var(--vms-line)]">
            <CardTitle>Personal details</CardTitle>
            <CardDescription>
              These fields identify you in operational activity and approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <FormErrorSummary errors={formErrors} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="profile-first-name"
                label="First name"
                required
                error={formErrors.first_name}
              >
                {({ id, ...control }) => (
                  <InputWithIcon
                    id={id}
                    icon={<User className="h-4 w-4" aria-hidden="true" />}
                    value={formState.first_name}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        first_name: event.target.value,
                      }))
                    }
                    {...control}
                  />
                )}
              </Field>
              <Field
                id="profile-last-name"
                label="Last name"
                required
                error={formErrors.last_name}
              >
                {({ id, ...control }) => (
                  <InputWithIcon
                    id={id}
                    icon={<User className="h-4 w-4" aria-hidden="true" />}
                    value={formState.last_name}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        last_name: event.target.value,
                      }))
                    }
                    {...control}
                  />
                )}
              </Field>
              <Field id="profile-title" label="Job title" className="sm:col-span-2">
                {({ id, ...control }) => (
                  <InputWithIcon
                    id={id}
                    icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
                    placeholder="e.g. Operations Manager"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        title: event.target.value,
                      }))
                    }
                    {...control}
                  />
                )}
              </Field>
              <Field id="profile-email" label="Work email">
                {({ id }) => (
                  <InputWithIcon
                    id={id}
                    type="email"
                    icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                    value={adminUser.email}
                    disabled
                  />
                )}
              </Field>
              <Field id="profile-phone" label="Work phone">
                {({ id, ...control }) => (
                  <InputWithIcon
                    id={id}
                    type="tel"
                    autoComplete="tel"
                    icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                    placeholder="+234 800 000 0000"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        phone: event.target.value,
                      }))
                    }
                    {...control}
                  />
                )}
              </Field>
              <Field id="profile-address" label="Office address" className="sm:col-span-2">
                {({ id, ...control }) => (
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--vms-ink-muted)]"
                      aria-hidden="true"
                    />
                    <textarea
                      id={id}
                      {...control}
                      autoComplete="street-address"
                      className={cn(fieldControlClassName, "min-h-24 pl-10")}
                      placeholder="Building, street and city"
                      value={formState.address}
                      onChange={(event) =>
                        setFormState((state) => ({
                          ...state,
                          address: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[var(--vms-line)]">
            <CardTitle>Role permissions</CardTitle>
            <CardDescription>
              Effective permissions are read-only here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {permissions.length ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="neutral">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--vms-ink-muted)]">
                No additional role permissions are assigned.
              </p>
            )}
            <dl className="space-y-3 border-t border-[var(--vms-line)] pt-4 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--vms-ink-muted)]">Account ID</dt>
                <dd className="truncate font-mono">
                  {adminProfile?.id?.slice(0, 12) ?? "Unavailable"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--vms-ink-muted)]">Role ID</dt>
                <dd className="truncate font-mono">
                  {adminProfile?.role?.code ?? "Unavailable"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function InputWithIcon({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vms-ink-muted)]">
        {icon}
      </span>
      <input {...props} className={cn(fieldControlClassName, "pl-10", className)} />
    </div>
  );
}

function normalizePermissions(
  raw:
    | string
    | string[]
    | Record<string, string[]>
    | Record<string, unknown>
    | null,
): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return normalizePermissions(JSON.parse(raw));
    } catch {
      return raw
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return Object.entries(raw).flatMap(([group, value]) =>
    Array.isArray(value)
      ? value.map((permission) => `${group}:${permission}`)
      : [group],
  );
}
