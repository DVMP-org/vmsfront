"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAdminProfileDetails,
  useResidentProfileDetails,
} from "@/hooks/use-profile";
import { parseApiError } from "@/lib/error-utils";
import { cn, getFullName } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { profileApi, type ProfileUpdate } from "./api";
import { ProfileAvatar } from "./components/ProfileAvatar";

interface ProfileValues {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

function initialValues(
  user: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null | undefined,
): ProfileValues {
  return {
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  };
}

/**
 * The shared profile experience for every signed-in principal.
 *
 * SiteAdmins and Parties edit the same User identity record; only the role
 * label and the navigation shell differ.
 */
export function ProfilePage({
  audience,
}: {
  audience: "admin" | "resident";
}) {
  return audience === "admin" ? <AdminProfile /> : <ResidentProfile />;
}

function AdminProfile() {
  const query = useAdminProfileDetails();
  const authUser = useAuthStore((state) => state.user);
  const user = query.data?.user ?? authUser;
  const initial = useMemo(() => initialValues(user), [user]);
  return (
    <ProfileForm
      user={user}
      roleLabel={query.data?.role?.name ?? "Administrator"}
      initial={initial}
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      retry={() => query.refetch()}
    />
  );
}

function ResidentProfile() {
  const query = useResidentProfileDetails();
  const authUser = useAuthStore((state) => state.user);
  // A Party without a Resident record still owns this User identity, so the
  // shared form stays available instead of failing on the resident lookup.
  const user = query.data?.user ?? authUser;
  const initial = useMemo(() => initialValues(user), [user]);
  return (
    <ProfileForm
      user={user}
      roleLabel="Party"
      initial={initial}
      isPending={query.isPending && !authUser}
      isError={!user}
      error={query.error}
      retry={() => query.refetch()}
    />
  );
}

function ProfileForm({
  user,
  roleLabel,
  initial,
  isPending,
  isError,
  error,
  retry,
}: {
  user:
    | {
        first_name?: string | null;
        last_name?: string | null;
        email?: string;
        phone?: string | null;
        address?: string | null;
        avatar_url?: string | null;
      }
    | null
    | undefined;
  roleLabel: string;
  initial: ProfileValues;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
}) {
  const client = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => setValues(initial), [initial]);

  const update = useMutation({
    mutationFn: (body: ProfileUpdate) => profileApi.update(body),
    onSuccess: async (nextUser) => {
      updateUser(nextUser);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["profile"] }),
        client.invalidateQueries({ queryKey: ["auth", "profile"] }),
      ]);
      toast.success("Profile saved.");
    },
    onError: (saveError) => toast.error(parseApiError(saveError).message),
  });

  const isDirty = (Object.keys(initial) as Array<keyof ProfileValues>).some(
    (key) => values[key] !== initial[key],
  );
  const fullName = getFullName(values.first_name, values.last_name);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const result = await profileApi.uploadAvatar(file);
      updateUser({ avatar_url: result.avatar_url });
      await client.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile photo updated.");
    } catch (uploadError) {
      toast.error(parseApiError(uploadError).message);
    } finally {
      setUploading(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.first_name.trim()) next.first_name = "First name is required.";
    if (!values.last_name.trim()) next.last_name = "Last name is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    update.mutate({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
    });
  }

  if (isPending) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Account"
          title="Profile"
          description="Loading account details…"
        />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (isError || !user) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Account" title="Profile" />
        <div
          role="alert"
          className="rounded-xl border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
        >
          <p>{parseApiError(error).message}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5 pb-8 text-[var(--vms-ink)]" onSubmit={submit}>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your shared identity: the name and photo used across invitations, checkpoints and activity."
        secondaryActions={
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty || update.isPending}
            onClick={() => {
              setValues(initial);
              setErrors({});
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        }
        primaryAction={
          <Button type="submit" isLoading={update.isPending} disabled={!isDirty}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save changes
          </Button>
        }
      />

      {update.isSuccess ? (
        <div
          role="status"
          className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-success)_30%,transparent)] bg-[var(--vms-success-subtle)] px-4 py-3 text-sm text-[var(--vms-success)]"
        >
          Your profile was saved.
        </div>
      ) : null}
      {update.isError ? (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] px-4 py-3 text-sm text-[var(--vms-danger)]"
        >
          {parseApiError(update.error).message}
        </div>
      ) : null}

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
        <ProfileAvatar
          name={fullName || "User"}
          avatarUrl={user.avatar_url}
          uploading={uploading}
          onSelect={uploadAvatar}
          onClear={() => update.mutate({ avatar_url: null })}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Personal details</h2>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
            Your name is used on invitations and in checkpoint history.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="profile-first-name" label="First name" required error={errors.first_name}>
              {(control) => (
                <input
                  {...control}
                  value={values.first_name}
                  autoComplete="given-name"
                  className={fieldControlClassName}
                  onChange={(event) =>
                    setValues((state) => ({
                      ...state,
                      first_name: event.target.value,
                    }))
                  }
                />
              )}
            </Field>
            <Field id="profile-last-name" label="Last name" required error={errors.last_name}>
              {(control) => (
                <input
                  {...control}
                  value={values.last_name}
                  autoComplete="family-name"
                  className={fieldControlClassName}
                  onChange={(event) =>
                    setValues((state) => ({
                      ...state,
                      last_name: event.target.value,
                    }))
                  }
                />
              )}
            </Field>
            <Field id="profile-email" label="Email">
              {(control) => (
                <input
                  {...control}
                  type="email"
                  value={user.email ?? ""}
                  disabled
                  className={cn(fieldControlClassName, "opacity-70")}
                />
              )}
            </Field>
            <Field id="profile-phone" label="Phone">
              {(control) => (
                <input
                  {...control}
                  type="tel"
                  value={values.phone}
                  autoComplete="tel"
                  className={fieldControlClassName}
                  onChange={(event) =>
                    setValues((state) => ({
                      ...state,
                      phone: event.target.value,
                    }))
                  }
                />
              )}
            </Field>
            <Field id="profile-address" label="Address" className="sm:col-span-2">
              {(control) => (
                <textarea
                  {...control}
                  value={values.address}
                  autoComplete="street-address"
                  className={cn(fieldControlClassName, "min-h-24 py-2")}
                  onChange={(event) =>
                    setValues((state) => ({
                      ...state,
                      address: event.target.value,
                    }))
                  }
                />
              )}
            </Field>
          </div>
        </section>

        <aside className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--vms-ink-muted)]">Role</dt>
              <dd>
                <Badge variant="neutral">
                  <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                  {roleLabel}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--vms-ink-muted)]">Email</dt>
              <dd className="inline-flex min-w-0 items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-[var(--vms-line)] pt-4 text-xs text-[var(--vms-ink-muted)]">
            Your email address is managed by your organization administrator.
          </p>
        </aside>
      </div>
    </form>
  );
}
