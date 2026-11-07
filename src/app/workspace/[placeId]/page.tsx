"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ConciergeBell,
  Home,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import {
  areaForRelationship,
  roleLabel,
  workspaceAreaMeta,
} from "@/features/workspaces/catalog";
import { useVerifyToken } from "@/hooks/use-auth";
import { parseApiError } from "@/lib/error-utils";

const areaIcon = {
  management: ShieldCheck,
  occupancy: Home,
  staff: BriefcaseBusiness,
  guest: ConciergeBell,
};

export default function WorkspacePage() {
  const params = useParams<{ placeId: string }>();
  const context = useVerifyToken();
  const relationship = useMemo(
    () =>
      context.data?.workspaces.find(
        (workspace) => workspace.place.id === params.placeId,
      ),
    [context.data, params.placeId],
  );
  const area = relationship ? areaForRelationship(relationship) : "occupancy";
  const meta = workspaceAreaMeta[area];
  const Icon = areaIcon[area];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Header type="select" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          href="/select"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All workspaces
        </Link>

        {context.isError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {parseApiError(context.error).message}
          </div>
        ) : context.isPending ? (
          <div role="status" className="space-y-3">
            <div className="h-10 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-48 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
          </div>
        ) : !relationship ? (
          <section className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-semibold">Workspace access unavailable</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This workspace is not active for your account in the selected
              organization.
            </p>
          </section>
        ) : (
          <>
            <header className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                {meta.title}
              </p>
              <div className="mt-3 flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-indigo-300">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em]">
                    {relationship.place.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {relationship.place.kind} workspace ·{" "}
                    {roleLabel(relationship.role)} access
                  </p>
                </div>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={MapPin}
                label="Property"
                value={relationship.place.name}
                detail={`${relationship.place.kind} · ${relationship.place.slug}`}
              />
              <InfoCard
                icon={ShieldCheck}
                label="Access role"
                value={roleLabel(relationship.role)}
                detail="Personal relationship, separate from administration"
              />
              <InfoCard
                icon={CalendarDays}
                label="Access period"
                value={
                  relationship.effective_to
                    ? formatDate(relationship.effective_to)
                    : "Open-ended"
                }
                detail={
                  relationship.effective_from
                    ? `From ${formatDate(relationship.effective_from)}`
                    : "No start date recorded"
                }
              />
            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">{meta.title} workspace</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {area === "guest"
                  ? "This workspace reflects guest access only. Hotel staff manage reservations, room assignment and check-in; guest access never grants those controls."
                  : area === "staff"
                    ? "This workspace reflects assigned operational access. Organization-wide administration remains a separate permission boundary."
                    : `This workspace reflects your ${roleLabel(relationship.role).toLowerCase()} access. Management tools are available only through a separate administrative workspace.`}
              </p>
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Account identity
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {context.data?.party?.display_name ||
                    context.data?.user.name ||
                    context.data?.user.email}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {context.data?.party?.email || context.data?.user.email}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
