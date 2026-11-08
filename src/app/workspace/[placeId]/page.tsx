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
  qualifiedPlaceName,
  roleLabel,
  workspaceAreaMeta,
} from "@/features/workspaces/catalog";
import { AccessWorkspace } from "@/features/access-journey/AccessWorkspace";
import { MyCharges } from "@/features/charges/my-charges/MyCharges";
import { GuestStayDashboard } from "@/features/guest-stay/GuestStayDashboard";
import { WorkspaceNotifications } from "@/features/workspace-notifications/WorkspaceNotifications";
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
  const placeTitle = relationship
    ? qualifiedPlaceName(relationship.place)
    : null;

  return (
    <div className="occupancy-surface min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-9">
        <Link
          href="/select"
          className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All workspaces
        </Link>

        {context.isError ? (
          <div
            role="alert"
            className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
          >
            {parseApiError(context.error).message}
          </div>
        ) : context.isPending ? (
          <div role="status" className="space-y-3">
            <div className="h-10 w-72 animate-pulse rounded bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
            <div className="h-48 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
          </div>
        ) : !relationship ? (
          <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-8">
            <h1 className="text-2xl font-semibold">
              Workspace access unavailable
            </h1>
            <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
              This workspace is not active for your account in the selected
              organization.
            </p>
          </section>
        ) : (
          <>
            <header className="mb-5 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                {meta.title}
              </p>
              <div className="mt-3 flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.04em]">
                    {placeTitle}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
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
                value={placeTitle || relationship.place.name}
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

            <WorkspaceNotifications userId={context.data.user.id} />

            <MyCharges
              placeId={relationship.place.id}
              placeName={placeTitle || relationship.place.name}
            />

            {area === "guest" ? (
              <div className="mt-4">
                <GuestStayDashboard />
              </div>
            ) : null}

            <div className="mt-6">
              <AccessWorkspace
                relationship={relationship}
                partyName={
                  context.data?.party?.display_name ||
                  context.data?.user.name ||
                  context.data?.user.email
                }
                partyEmail={
                  context.data?.party?.email || context.data?.user.email
                }
              />
            </div>

            <section className="mt-5 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Workspace access</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--vms-ink-muted)]">
                {area === "guest"
                  ? "This is your personal stay workspace. You can invite visitors here; hotel staff retain reservations, room assignment and stay-management controls."
                  : area === "staff"
                    ? "This is your assigned staff workspace. You can create visitor invitations for this property; site administration remains a separate permission boundary."
                    : `This is your personal ${roleLabel(relationship.role).toLowerCase()} workspace. You can create and manage visitor invitations for this property.`}
              </p>
              <div className="mt-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                  Account identity
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--vms-ink)]">
                  {context.data?.party?.display_name ||
                    context.data?.user.name ||
                    context.data?.user.email}
                </p>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
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
    <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
      <Icon className="h-4 w-4 text-[var(--vms-action)]" />
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
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
