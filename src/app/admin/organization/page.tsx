"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";
import { contextApi } from "@/features/context/api";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";

export default function OrganizationPage() {
  const organization = useAppStore((state) => state.organization);
  const user = useAuthStore((state) => state.user);
  const key = `${organization?.id}:${user?.id}`;
  const profile = useQuery({
    queryKey: ["organization-profile", key],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: !!organization && !!user,
    staleTime: 0,
  });
  const canView =
    profile.isFetchedAfterMount &&
    !profile.isError &&
    hasAdminPermission(profile.data, "organizations.show");
  const details = useQuery({
    queryKey: ["organization-settings", key],
    queryFn: contextApi.organization,
    enabled: canView,
  });
  const catalog = useQuery({
    queryKey: ["context-catalog", key],
    queryFn: contextApi.catalog,
    enabled: canView,
  });

  if (profile.isError || details.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      >
        <p>{parseApiError(profile.error || details.error).message}</p>
        <button
          type="button"
          className="mt-3 font-semibold underline"
          onClick={() => {
            profile.refetch();
            details.refetch();
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (profile.isPending || (canView && details.isPending)) {
    return <SettingsSkeleton />;
  }
  if (!canView) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
      >
        You do not have permission to view organization settings.
      </div>
    );
  }
  if (!details.data) return null;

  const useCase =
    catalog.data?.use_cases.find(
      (item) => item.value === details.data.use_case,
    )?.label || details.data.use_case?.replaceAll("_", " ");

  return (
    <main className="space-y-5 pb-10 text-[#0f1b31]">
      <header className="border-b border-[#dce3ee] pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
          <Building2 className="h-3.5 w-3.5 text-[#2563eb]" />
          <span>{details.data.name}</span>
          <span className="text-[#c3cad6]">/</span>
          <span>Settings</span>
        </div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
              Organization administration
            </p>
            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Organization settings
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#667085]">
              Manage the identity, operating context and configuration that
              sit above your properties and workspaces.
            </p>
          </div>
          <Link
            href="/select"
            className="inline-flex items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-semibold text-[#344054] transition hover:bg-[#f8faff]"
          >
            View workspaces
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[#dce3ee] bg-white p-2 shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
            Organization
          </p>
          <SettingsLink
            href="/admin/organization"
            icon={SlidersHorizontal}
            label="General details"
            active
          />
          <SettingsLink
            href="/admin/settings?tab=branding"
            icon={Palette}
            label="Brand and theme"
          />
          <SettingsLink
            href="/admin/admins"
            icon={ShieldCheck}
            label="Administrators"
          />
          <SettingsLink
            href="/admin/people"
            icon={Users}
            label="People directory"
          />
          <SettingsLink
            href="/admin/settings?tab=payment"
            icon={WalletCards}
            label="Billing and payments"
          />
        </aside>

        <section className="space-y-4">
          <div className="grid overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:grid-cols-2">
            <Summary
              label="Operating use case"
              value={useCase || "Not configured"}
              detail="Fixed when the organization is created"
            />
            <Summary
              label="Organization URL"
              value={details.data.slug}
              detail="The tenant subdomain cannot be changed here"
            />
          </div>

          <OrganizationEditor
            key={`${key}:${details.data.updated_at}`}
            org={details.data}
            editable={hasAdminPermission(profile.data, "organizations.update")}
          />
        </section>
      </div>
    </main>
  );
}

function OrganizationEditor({
  org,
  editable,
}: {
  org: { name: string; description?: string | null; slug: string };
  editable: boolean;
}) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description || "");
  const client = useQueryClient();
  const update = useAppStore((state) => state.setSelectedOrganization);
  const mutation = useMutation({
    mutationFn: () =>
      contextApi.updateOrganization({
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async (data) => {
      update(data);
      await client.invalidateQueries({ queryKey: ["organization-settings"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form
      className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]"
      onSubmit={submit}
    >
      <header className="border-b border-[#edf0f5] px-5 py-4">
        <h2 className="text-base font-semibold">General details</h2>
        <p className="mt-1 text-xs text-[#667085]">
          These details identify the organization across management surfaces.
        </p>
      </header>
      <fieldset
        className="grid gap-4 p-5 md:grid-cols-2"
        disabled={!editable || mutation.isPending}
      >
        <label className="block text-xs font-semibold text-[#344054]">
          Name
          <input
            required
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
          />
        </label>
        <label className="block text-xs font-semibold text-[#344054]">
          Organization URL
          <input
            value={org.slug}
            readOnly
            className="mt-1.5 w-full rounded-md border border-[#e4e7ec] bg-[#f8faff] px-3 py-2.5 text-sm font-normal text-[#667085]"
          />
          <span className="mt-1 block font-normal text-[#98a2b3]">
            Fixed after creation.
          </span>
        </label>
        <label className="block text-xs font-semibold text-[#344054] md:col-span-2">
          Description
          <textarea
            maxLength={2000}
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-md border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
          />
        </label>
      </fieldset>
      {!editable ? (
        <p className="mx-5 rounded-md border border-[#dce3ee] bg-[#f8faff] px-3 py-2 text-xs text-[#667085]">
          You can view these settings. An authorized organization administrator
          must make changes.
        </p>
      ) : null}
      {mutation.isError ? (
        <p
          role="alert"
          className="mx-5 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          {parseApiError(mutation.error).message}
        </p>
      ) : null}
      {mutation.isSuccess ? (
        <p
          role="status"
          className="mx-5 mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4" />
          Organization saved.
        </p>
      ) : null}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] px-5 py-4">
        <p className="text-xs text-[#667085]">
          Need to manage access?{" "}
          <Link
            href="/admin/admins"
            className="font-semibold text-[#2563eb] hover:underline"
          >
            Review administrators
          </Link>
        </p>
        {editable ? (
          <button
            type="submit"
            className="rounded-md bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Saving…" : "Save organization"}
          </button>
        ) : null}
      </footer>
    </form>
  );
}

function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-[#edf0f5] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold capitalize">{value}</p>
      <p className="mt-1 text-[11px] text-[#667085]">{detail}</p>
    </div>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center gap-2.5 rounded-md bg-[#edf3ff] px-3 py-2.5 text-xs font-semibold text-[#1d4ed8]"
          : "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-xs font-medium text-[#475467] transition hover:bg-[#f4f7fb] hover:text-[#0f1b31]"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SettingsSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading organization settings</span>
      <div className="h-24 animate-pulse rounded-lg bg-[#e8edf5]" />
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-lg bg-[#e8edf5]" />
        <div className="h-96 animate-pulse rounded-lg bg-[#e8edf5]" />
      </div>
    </div>
  );
}
