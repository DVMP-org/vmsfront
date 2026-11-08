"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  LayoutGrid,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { useAuthStore } from "@/store/auth-store";

export default function OrganizationHomePage() {
  const { organization, isLoading, isError, refetch } =
    useCurrentOrganization();
  const user = useAuthStore((state) => state.user);

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-[#E7C76B] bg-[#FFF6DB] p-5 text-sm text-[#684500]"
      >
        <p className="font-semibold">Organization home is unavailable.</p>
        <p className="mt-1">
          We could not load the active organization. Retry before continuing.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 font-semibold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !organization) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading organization home</span>
        <div className="h-28 animate-pulse rounded-lg bg-white ring-1 ring-[#E5E7EB]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-36 animate-pulse rounded-lg bg-white ring-1 ring-[#E5E7EB]" />
          <div className="h-36 animate-pulse rounded-lg bg-white ring-1 ring-[#E5E7EB]" />
        </div>
      </div>
    );
  }

  const displayName =
    user?.first_name || user?.email || "Organization administrator";
  const useCase =
    organization.use_case?.replaceAll("_", " ") || "Not configured";
  const subscription = organization.subscription?.status || "Not active";

  return (
    <div className="space-y-5">
      <header className="border-b border-[#DDE2E6] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667280]">
          Organization home
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {organization.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#667280]">
              {organization.description ||
                "Manage organization identity and administration, then enter a permitted property workspace."}
            </p>
          </div>
          <Link
            href="/organization/workspaces"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1F2933] px-4 text-sm font-semibold text-white transition hover:bg-[#111820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A] focus-visible:ring-offset-2"
          >
            Open Workspaces
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section
        aria-label="Organization details"
        className="grid overflow-hidden rounded-lg border border-[#E5E7EB] bg-white sm:grid-cols-2 xl:grid-cols-4"
      >
        <Fact label="Operating use case" value={titleCase(useCase)} />
        <Fact label="Organization URL" value={organization.slug} />
        <Fact label="Subscription" value={titleCase(subscription)} />
        <Fact
          label="Signed in"
          value={displayName}
          detail={user?.email}
        />
      </section>

      {organization.needs_first_site ? (
        <section className="rounded-lg border border-[#E7C76B] bg-[#FFF6DB] p-5">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#946200]" />
            <div>
              <h2 className="text-sm font-semibold text-[#684500]">
                Add the first property
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#7C5A16]">
                Workspaces become available after a property is created and
                access is assigned.
              </p>
              <Link
                href="/admin/properties/new?setup=first-place"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#1F2933] px-3 text-xs font-semibold text-white"
              >
                Set up the first property
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#596675]" />
            <h2 className="text-base font-semibold">Workspaces</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#667280]">
            Choose a management, occupancy, staff or guest relationship for a
            property in {organization.name}. Organization membership alone does
            not create a workspace.
          </p>
          <Link
            href="/organization/workspaces"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#C7CDD3] bg-white px-3 text-xs font-semibold text-[#1F2933] transition hover:bg-[#F5F7F8]"
          >
            Review permitted workspaces
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section
          aria-labelledby="organization-admin-heading"
          className="rounded-lg border border-[#E5E7EB] bg-white p-5"
        >
          <h2 id="organization-admin-heading" className="text-base font-semibold">
            Organization administration
          </h2>
          <div className="mt-3 grid gap-1">
            <AdminLink
              href="/organization/settings/administrators"
              icon={UserCog}
              label="Administrators"
            />
            <AdminLink
              href="/organization/settings/roles"
              icon={ShieldCheck}
              label="Roles & permissions"
            />
            <AdminLink
              href="/organization/settings"
              icon={Settings}
              label="Organization settings"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="border-b border-[#E5E7EB] p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667280]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[#1F2933]">
        {value}
      </p>
      {detail ? (
        <p className="mt-0.5 truncate text-xs text-[#667280]">{detail}</p>
      ) : null}
    </div>
  );
}

function AdminLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium text-[#344054] transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
    >
      <Icon className="h-4 w-4 text-[#596675]" />
      {label}
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#9AA4AE]" />
    </Link>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
