"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
} from "lucide-react";
import { contextApi } from "@/features/context/api";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Skeleton } from "@/components/ui/Skeleton";

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
        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
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
        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-5 text-sm text-[var(--vms-warning)]"
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
    <div className="space-y-4">
      <div className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2">
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
    </div>
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
      className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
      onSubmit={submit}
    >
      <header className="border-b border-[var(--vms-line)] px-5 py-4">
        <h2 className="text-base font-semibold">General details</h2>
        <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
          These details identify the organization across management surfaces.
        </p>
      </header>
      <fieldset
        className="grid gap-5 p-5 md:grid-cols-2"
        disabled={!editable || mutation.isPending}
      >
        <Field id="organization-name" label="Name" required>
          {(control) => (
            <input
              {...control}
              aria-label="Name"
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldControlClassName}
            />
          )}
        </Field>
        <Field
          id="organization-url"
          label="Organization URL"
          description="Fixed after creation."
        >
          {(control) => (
            <input
              {...control}
              aria-label="Organization URL"
              value={org.slug}
              readOnly
              className={`${fieldControlClassName} bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]`}
            />
          )}
        </Field>
        <Field
          id="organization-description"
          label="Description"
          className="md:col-span-2"
        >
          {(control) => (
            <textarea
              {...control}
              aria-label="Description"
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldControlClassName} resize-y`}
            />
          )}
        </Field>
      </fieldset>
      {!editable ? (
        <p className="mx-5 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
          You can view these settings. An authorized organization administrator
          must make changes.
        </p>
      ) : null}
      {mutation.isError ? (
        <FormErrorSummary
          errors={{ "organization-name": parseApiError(mutation.error).message }}
          className="mx-5 mt-3"
        />
      ) : null}
      {mutation.isSuccess ? (
        <p
          role="status"
          className="mx-5 mt-3 flex items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-success)] bg-[var(--vms-success-subtle)] px-3 py-2 text-xs text-[var(--vms-success)]"
        >
          <CheckCircle2 className="h-4 w-4" />
          Organization saved.
        </p>
      ) : null}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vms-line)] px-5 py-4">
        <p className="text-xs text-[var(--vms-ink-muted)]">
          Need to manage access?{" "}
          <Link
            href="/admin/admins"
            className="font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            Review administrators
          </Link>
        </p>
        {editable ? (
          <Button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Saving…" : "Save organization"}
          </Button>
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
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading organization settings</span>
      <Skeleton className="h-24" />
      <Skeleton className="h-96" />
    </div>
  );
}
