"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CircleSlash2,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns/format";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import type { WorkspaceRelationship } from "@/types";
import { PlaceAssignmentModal } from "@/features/places/PlaceAssignmentModal";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { leaseState, leaseTone } from "./leases";
import { occupancyRoles, titleCase } from "./contracts";

type OccupancyRow = {
  id: string;
  relationship: WorkspaceRelationship;
  unit_id: string;
  unit_name: string;
  person_name: string;
  email: string;
  role: string;
  status: string;
  lease_state: string;
  effective_from: string;
  effective_to: string;
};

export default function ResidentialOccupancies() {
  const { contextKey, selectedSite, canManagePeople } =
    useResidentialAccess();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tab, setTab] = useState<"residents" | "households" | "pending">(
    "residents",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const placeId = selectedSite?.id || "";
  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const relationships = useQuery({
    queryKey: ["residential", contextKey, "relationships", placeId, "all"],
    queryFn: () => residentialApi.relationships(),
    enabled: !!placeId,
  });
  const allPlaces = useMemo(
    () => (tree.data ? flattenPlaces(tree.data) : []),
    [tree.data],
  );
  const scopeIds = useMemo(
    () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
    [placeId, tree.data],
  );
  const units = useMemo(
    () =>
      allPlaces.filter(
        (place) => scopeIds.has(place.id) && place.kind === "unit",
      ),
    [allPlaces, scopeIds],
  );
  const rows = useMemo<OccupancyRow[]>(
    () =>
      (relationships.data?.items || [])
        .filter(
          (relationship) =>
            scopeIds.has(relationship.place.id) &&
            occupancyRoles.includes(relationship.role as never),
        )
        .map((relationship) => ({
          id: relationship.id,
          relationship,
          unit_id: relationship.place.id,
          unit_name: relationship.place.name,
          person_name: relationship.party.display_name,
          email: relationship.party.email || "",
          role: relationship.role,
          status: relationship.status,
          lease_state: leaseState(relationship.effective_to),
          effective_from: relationship.effective_from || "",
          effective_to: relationship.effective_to || "",
        })),
    [relationships.data?.items, scopeIds],
  );

  const detail = rows.find((row) => row.id === detailId);
  const visibleRows =
    tab === "pending"
      ? rows.filter((row) => row.status === "pending")
      : tab === "households"
        ? rows.filter(
            (row, index) =>
              rows.findIndex((other) => other.unit_id === row.unit_id) ===
              index,
          )
        : rows;

  const update = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: "end" | "suspend" | "activate";
    }) =>
      Promise.all(
        ids.map((id) => {
          if (action === "end") {
            return residentialApi.updateRelationship(id, {
              status: "ended",
              effective_to: new Date().toISOString(),
            });
          }
          if (action === "suspend") {
            return residentialApi.updateRelationship(id, {
              status: "suspended",
            });
          }
          return residentialApi.updateRelationship(id, { status: "active" });
        }),
      ),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      await queryClient.invalidateQueries({
        queryKey: ["residential", contextKey],
      });
      toast.success(
        `${updated.length} relationship${updated.length === 1 ? "" : "s"} ${
          variables.action === "end"
            ? "ended"
            : variables.action === "suspend"
              ? "suspended"
              : "activated"
        }.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const columns: Column<OccupancyRow>[] = [
    {
      key: "person_name",
      header: "Name",
      sortable: true,
      accessor: (row) => (
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => setDetailId(row.id)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-200 font-semibold text-slate-600">
            {row.person_name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <span>
            <strong className="block truncate">{row.person_name}</strong>
            <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
              {row.email || "No email"}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "unit_name",
      header: "Unit",
      sortable: true,
      accessor: (row) => <span className="font-medium">{row.unit_name}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      accessor: (row) => (
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-900">
          {titleCase(row.role)}
        </span>
      ),
    },
    {
      key: "household",
      header: "Household",
      accessor: (row) => (
        <span>
          {row.unit_name}
          <span className="block text-xs text-[var(--vms-ink-muted)]">
            {
              rows.filter(
                (member) =>
                  member.unit_id === row.unit_id && member.status === "active",
              ).length
            }{" "}
            active members
          </span>
        </span>
      ),
    },
    {
      key: "effective_from",
      header: "Occupancy dates",
      accessor: (row) => (
        <span>
          {row.effective_from
            ? format(new Date(row.effective_from), "MMM d, yyyy")
            : "—"}{" "}
          –{" "}
          {row.effective_to
            ? format(new Date(row.effective_to), "MMM d, yyyy")
            : "Present"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Account status",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={relationshipTone(row.status)}>
          {titleCase(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      mobileHide: true,
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`View ${row.person_name} details`}
          onClick={() => setDetailId(row.id)}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </Button>
      ),
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "unit_id",
      label: "Unit",
      type: "select",
      isSearchable: true,
      options: units.map((unit) => ({ value: unit.id, label: unit.name })),
    },
    {
      field: "role",
      label: "Relationship",
      type: "select",
      options: occupancyRoles.map((role) => ({
        value: role,
        label: titleCase(role),
      })),
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["active", "pending", "suspended", "ended"].map((status) => ({
        value: status,
        label: titleCase(status),
      })),
    },
    {
      field: "lease_state",
      label: "Lease state",
      type: "select",
      options: ["current", "expiring", "expired", "open_ended"].map(
        (state) => ({ value: state, label: titleCase(state) }),
      ),
    },
  ];
  const bulkActions: BulkAction[] = canManagePeople
    ? [
        {
          label: "Suspend",
          icon: CircleSlash2,
          onClick: (ids) => update.mutate({ ids, action: "suspend" }),
        },
        {
          label: "End relationship",
          icon: CalendarClock,
          variant: "destructive",
          requiresConfirmation: true,
          confirmationMessage:
            "End the selected relationships now? Their access and charge responsibility history will remain auditable.",
          onClick: (ids) => update.mutate({ ids, action: "end" }),
        },
      ]
    : [];

  return (
    <ResidentialShell
      title="Residents & households"
      description="Manage occupancy relationships and household members."
      showWorkspace
      primaryAction={
        canManagePeople ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add resident
          </Button>
        ) : undefined
      }
    >
      <div
        className="flex gap-7 border-b border-[var(--vms-line)]"
        role="tablist"
        aria-label="Resident views"
      >
        {(
          [
            ["residents", "Residents"],
            ["households", "Households"],
            ["pending", "Pending move-ins"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${tab === value ? "border-orange-500 text-[var(--vms-ink)]" : "border-transparent text-[var(--vms-ink-muted)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`grid items-start gap-5 ${detail ? "xl:grid-cols-[minmax(0,1fr)_320px]" : ""}`}
      >
        <section className="min-w-0 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
          <DataTable
            data={visibleRows}
            columns={columns}
            availableFilters={filters}
            searchPlaceholder="Search residents (name, email, phone)"
            selectable={canManagePeople}
            selectedRows={selected}
            onSelectionChange={setSelected}
            bulkActions={bulkActions}
            isLoading={tree.isPending || relationships.isPending}
            errorMessage={
              tree.isError || relationships.isError
                ? parseApiError(tree.error || relationships.error).message
                : null
            }
            isStale={(tree.isError || relationships.isError) && rows.length > 0}
            onRetry={() => {
              void tree.refetch();
              void relationships.refetch();
            }}
            emptyMessage="No household relationships match this property yet."
            tableLabel="Households and lease relationships"
            scrollHint="Scroll horizontally to compare people, units, roles and lease dates."
            mobileSummary={(row) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      className="font-semibold text-left"
                      onClick={() => setDetailId(row.id)}
                    >
                      {row.person_name}
                    </button>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                      {row.unit_name} · {titleCase(row.role)}
                    </p>
                  </div>
                  <StatusBadge tone={leaseTone(row.lease_state)}>
                    {titleCase(row.lease_state)}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[var(--vms-ink-muted)]">
                  {row.effective_to
                    ? `Ends ${format(new Date(row.effective_to), "d MMM yyyy")}`
                    : "Open-ended relationship"}
                </p>
              </div>
            )}
          />
        </section>
        {detail && (
          <aside
            className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
            aria-label="Resident details"
          >
            <div className="flex items-center justify-between border-b border-[var(--vms-line)] pb-4">
              <h2 className="text-lg font-semibold">Resident details</h2>
              <button
                type="button"
                aria-label="Close resident details"
                onClick={() => setDetailId(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 border-b border-[var(--vms-line)] py-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-200 text-xl font-semibold text-slate-600">
                {detail.person_name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{detail.person_name}</h3>
                <p className="text-sm text-[var(--vms-ink-muted)]">
                  {detail.unit_name} · {titleCase(detail.role)}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={relationshipTone(detail.status)}>
                    {titleCase(detail.status)}
                  </StatusBadge>
                </div>
              </div>
            </div>
            <div className="border-b border-[var(--vms-line)] py-4">
              <h3 className="font-semibold">Contact information</h3>
              <p className="mt-2 break-all text-sm">
                {detail.email || "No email available"}
              </p>
            </div>
            <div className="border-b border-[var(--vms-line)] py-4">
              <h3 className="font-semibold">Occupancy</h3>
              <p className="mt-2 text-sm">
                {detail.effective_from
                  ? format(new Date(detail.effective_from), "MMM d, yyyy")
                  : "Start date unavailable"}{" "}
                –{" "}
                {detail.effective_to
                  ? format(new Date(detail.effective_to), "MMM d, yyyy")
                  : "Present"}
              </p>
              <p className="mt-2 text-sm">
                {detail.unit_name} · {titleCase(detail.role)}
              </p>
            </div>
            <div className="py-4">
              <h3 className="font-semibold">Household members</h3>
              {rows
                .filter(
                  (member) =>
                    member.unit_id === detail.unit_id &&
                    member.status === "active",
                )
                .map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setDetailId(member.id)}
                    className="flex w-full items-center justify-between border-b border-[var(--vms-line)] py-3 text-left text-sm"
                  >
                    <span>{member.person_name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {titleCase(member.role)}
                    </span>
                  </button>
                ))}
            </div>
            <Link
              href={`/admin/residential/occupancies/${encodeURIComponent(detail.id)}`}
              className="flex min-h-11 items-center justify-center rounded-md bg-[var(--vms-action)] px-4 text-sm font-semibold text-[var(--vms-on-action)]"
            >
              View full profile
            </Link>
            {canManagePeople &&
              ["pending", "active"].includes(detail.status) && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    if (
                      window.confirm(
                        `End ${detail.person_name}'s relationship with ${detail.unit_name}?`,
                      )
                    )
                      update.mutate({ ids: [detail.id], action: "end" });
                  }}
                >
                  End relationship
                </Button>
              )}
            {canManagePeople && detail.status === "ended" && (
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() =>
                  update.mutate({ ids: [detail.id], action: "activate" })
                }
              >
                Reactivate relationship
              </Button>
            )}
          </aside>
        )}
      </div>

      <PlaceAssignmentModal
        title="Assign a household relationship"
        placeLabel="Unit"
        key={`${createOpen}:${units[0]?.id || "none"}`}
        open={createOpen}
        siteId={placeId}
        places={units}
        contextKey={contextKey}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
    </ResidentialShell>
  );
}

function relationshipTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "suspended") return "warning" as const;
  if (status === "ended") return "neutral" as const;
  return "info" as const;
}
