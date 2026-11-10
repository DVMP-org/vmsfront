"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { residentialApi } from "./api";
import { titleCase } from "./contracts";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";

export function ResidentProfile({
  relationshipId,
}: {
  relationshipId: string;
}) {
  const { contextKey, selectedProperty } = useResidentialAccess();
  const relationship = useQuery({
    queryKey: ["residential", contextKey, "relationship", relationshipId],
    queryFn: () => residentialApi.relationship(relationshipId),
    enabled: !!selectedProperty?.id && !!relationshipId,
    retry: false,
  });
  const household = useQuery({
    queryKey: [
      "residential",
      contextKey,
      "household",
      relationship.data?.place.id,
    ],
    queryFn: () =>
      residentialApi.relationships({
        place_id: relationship.data!.place.id,
        status: "active",
      }),
    enabled: !!relationship.data,
    retry: false,
  });
  const resident = relationship.data;
  const date = (value: string | null) =>
    value ? format(new Date(value), "MMM d, yyyy") : null;

  return (
    <ResidentialShell
      title="Resident profile"
      description="Contact information and occupancy details."
      showWorkspace
    >
      <Link
        href="/admin/residential/occupancies"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--vms-ink-muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to residents
      </Link>
      {relationship.isPending && selectedProperty ? (
        <p role="status">Loading resident details…</p>
      ) : null}
      {relationship.isError ? (
        <section
          role="alert"
          className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
        >
          <p>{parseApiError(relationship.error).message}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => relationship.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : null}
      {resident && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-200 text-xl font-semibold text-slate-600">
                  {resident.party.display_name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {resident.party.display_name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                    {resident.place.name} · {titleCase(resident.role)}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      tone={
                        resident.status === "active"
                          ? "success"
                          : resident.status === "suspended"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {titleCase(resident.status)}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
              <h2 className="text-lg font-semibold">Contact information</h2>
              <p className="mt-4 flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                {resident.party.email || "No email available"}
              </p>
            </section>
            <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
              <h2 className="text-lg font-semibold">Occupancy</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                  {resident.place.name} · {titleCase(resident.role)}
                </p>
                <p className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                  {date(resident.effective_from) || "Start date unavailable"} –{" "}
                  {date(resident.effective_to) || "Present"}
                </p>
              </div>
            </section>
          </div>
          <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <UsersRound className="h-5 w-5" /> Household members
            </h2>
            {household.isPending ? (
              <p className="mt-4 text-sm">Loading household…</p>
            ) : household.isError ? (
              <div className="mt-4 text-sm" role="alert">
                <p>{parseApiError(household.error).message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => household.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : household.data?.items.length ? (
              household.data.items.map((member) => (
                <Link
                  key={member.id}
                  href={`/admin/residential/occupancies/${encodeURIComponent(member.id)}`}
                  className="flex items-center justify-between gap-2 border-b border-[var(--vms-line)] py-3 text-sm"
                >
                  <span>{member.party.display_name}</span>
                  <span className="text-xs text-[var(--vms-ink-muted)]">
                    {titleCase(member.role)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="mt-4 text-sm text-[var(--vms-ink-muted)]">
                No active household members.
              </p>
            )}
          </section>
        </div>
      )}
    </ResidentialShell>
  );
}
