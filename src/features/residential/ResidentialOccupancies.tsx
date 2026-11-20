"use client";

import type { QueryContext } from "@/lib/query-keys";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CircleSlash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Drawer } from "@/components/ui/Drawer";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { formatDate } from "@/lib/datetime";
import type { WorkspaceRelationship } from "@/types";
import { PlaceAssignmentModal } from "@/features/places/PlaceAssignmentModal";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { occupancyRoles, titleCase } from "./contracts";

type OccupancyRow = {
  id: string;
  relationship: WorkspaceRelationship;
  unit_id: string;
  unit_name: string;
  person_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
  effective_from: string;
  effective_to: string;
};

type HouseholdRow = {
  id: string;
  unit_name: string;
  member_names: string;
  members: OccupancyRow[];
  active_count: number;
  pending_count: number;
};

const residentTabs = ["residents", "households", "pending"] as const;
type ResidentTab = (typeof residentTabs)[number];

export default function ResidentialOccupancies() {
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const {
    contextKey,
    selectedSite,
    canManagePeople,
    canUpdateRelationships,
    canCreateUnits,
  } = useResidentialAccess();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [householdDetailId, setHouseholdDetailId] = useState<string | null>(
    null,
  );
  const [tab, setTab] = useState<ResidentTab>("residents");
  const tabButtons = useRef<Record<ResidentTab, HTMLButtonElement | null>>({
    residents: null,
    households: null,
    pending: null,
  });
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
          avatar_url: relationship.party.avatar_url ?? null,
          role: relationship.role,
          status: relationship.status,
          effective_from: relationship.effective_from || "",
          effective_to: relationship.effective_to || "",
        })),
    [relationships.data?.items, scopeIds],
  );

  const selectedDetail = rows.find((row) => row.id === detailId);
  const retainedDetail = useRef<{
    contextKey: QueryContext;
    row: OccupancyRow;
  }>();
  if (selectedDetail)
    retainedDetail.current = { contextKey, row: selectedDetail };
  // Keep the record visible during the drawer's exit, within this workspace only.
  const detail =
    selectedDetail ||
    (retainedDetail.current?.contextKey === contextKey
      ? retainedDetail.current.row
      : undefined);
  const pendingRows = rows.filter((row) => row.status === "pending");
  const householdRows = useMemo<HouseholdRow[]>(() => {
    const byUnit = new Map<string, HouseholdRow>();
    for (const row of rows) {
      if (row.status !== "active" && row.status !== "pending") continue;
      const household = byUnit.get(row.unit_id) ?? {
        id: row.unit_id,
        unit_name: row.unit_name,
        member_names: "",
        members: [],
        active_count: 0,
        pending_count: 0,
      };
      household.members.push(row);
      household.member_names = household.members
        .map((member) => member.person_name)
        .join(", ");
      if (row.status === "active") household.active_count += 1;
      if (row.status === "pending") household.pending_count += 1;
      byUnit.set(row.unit_id, household);
    }
    return [...byUnit.values()].sort((left, right) =>
      left.unit_name.localeCompare(right.unit_name),
    );
  }, [rows]);
  const selectedHousehold = householdRows.find(
    (household) => household.id === householdDetailId,
  );
  const selectTab = (next: ResidentTab, focus = false) => {
    setTab(next);
    setSelected(new Set());
    setDetailId(null);
    setHouseholdDetailId(null);
    if (focus) tabButtons.current[next]?.focus();
  };

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
      header: "Resident",
      sortable: true,
      minWidth: 175,
      accessor: (row) => (
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          aria-haspopup="dialog"
          onClick={() => setDetailId(row.id)}
        >
          <Avatar
            name={row.person_name}
            src={row.avatar_url}
            size="sm"
            className="h-9 w-9 rounded-[var(--vms-radius-control)]"
          />{" "}
          <span className="min-w-0">
            <strong className="block truncate text-sm">
              {row.person_name}
            </strong>
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
      minWidth: 115,
      accessor: (row) => <span className="font-medium">{row.unit_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      hiddenByDefault: true,
      accessor: (row) => row.email || "—",
    },
    {
      key: "role",
      header: "Relationship",
      sortable: true,
      minWidth: 115,
      accessor: (row) => (
        <span className="text-sm text-[var(--vms-ink)]">
          {titleCase(row.role)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Occupancy state",
      sortable: true,
      minWidth: 130,
      accessor: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge tone={relationshipTone(row.status)}>
            {titleCase(row.status)}
          </StatusBadge>
          {row.status === "pending" && row.effective_from ? (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              From {formatDate(row.effective_from)}
            </span>
          ) : row.effective_to ? (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              Until {formatDate(row.effective_to)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      minWidth: 100,
      mobileHide: true,
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`View ${row.person_name} details`}
          aria-haspopup="dialog"
          onClick={() => setDetailId(row.id)}
        >
          View details
        </Button>
      ),
    },
  ];
  const householdColumns: Column<HouseholdRow>[] = [
    {
      key: "unit_name",
      header: "Unit / household",
      minWidth: 200,
      accessor: (household) => (
        <button
          type="button"
          className="text-left font-semibold underline-offset-4 hover:underline"
          aria-haspopup="dialog"
          onClick={() => setHouseholdDetailId(household.id)}
        >
          {household.unit_name}
        </button>
      ),
    },
    {
      key: "active_count",
      header: "Active members",
      minWidth: 110,
      accessor: (household) => (
        <span className="tabular-nums">{household.active_count}</span>
      ),
    },
    {
      key: "pending_count",
      header: "Pending move-ins",
      minWidth: 130,
      accessor: (household) => (
        <span className="tabular-nums">{household.pending_count}</span>
      ),
    },
    {
      key: "member_names",
      header: "People",
      minWidth: 220,
      accessor: (household) => (
        <span className="text-sm">
          {household.members
            .slice(0, 2)
            .map((member) => member.person_name)
            .join(", ")}
          {household.members.length > 2
            ? ` +${household.members.length - 2} more`
            : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      minWidth: 115,
      mobileHide: true,
      accessor: (household) => (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={`View ${household.unit_name} household`}
          aria-haspopup="dialog"
          onClick={() => setHouseholdDetailId(household.id)}
        >
          View household
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
  ];
  const bulkActions: BulkAction[] = canUpdateRelationships
    ? [
        ...(tab === "pending"
          ? [
              {
                label: "Activate move-in",
                onClick: (ids: string[]) =>
                  update.mutate({ ids, action: "activate" }),
              },
            ]
          : []),
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
      
      primaryAction={
        canManagePeople && units.length > 0 ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add resident
          </Button>
        ) : undefined
      }
    >
      {tree.isSuccess && units.length === 0 ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Set up units first</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Resident and household relationships need a unit. Create the first
            unit, then assign its residents and pending move-ins here.
          </p>
          {canCreateUnits ? (
            <Button asChild className="mt-4">
              <Link href="/admin/residential/units?create=1">Add a unit</Link>
            </Button>
          ) : (
            <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
              Ask a Site administrator to create a unit before assigning
              residents.
            </p>
          )}
        </section>
      ) : (
        <>
          <div
            className="flex gap-5 overflow-x-auto border-b border-[var(--vms-line)] sm:gap-7"
            role="tablist"
            aria-label="Resident views"
          >
            {(
              [
                ["residents", "Residents", rows.length],
                ["households", "Households", householdRows.length],
                ["pending", "Pending move-ins", pendingRows.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                id={`residential-tab-${value}`}
                ref={(element) => {
                  tabButtons.current[value] = element;
                }}
                type="button"
                role="tab"
                aria-selected={tab === value}
                aria-controls="residential-relationship-panel"
                tabIndex={tab === value ? 0 : -1}
                onClick={() => selectTab(value)}
                onKeyDown={(event) => {
                  const index = residentTabs.indexOf(value);
                  const next =
                    event.key === "ArrowRight"
                      ? residentTabs[(index + 1) % residentTabs.length]
                      : event.key === "ArrowLeft"
                        ? residentTabs[
                            (index - 1 + residentTabs.length) %
                              residentTabs.length
                          ]
                        : event.key === "Home"
                          ? residentTabs[0]
                          : event.key === "End"
                            ? residentTabs[residentTabs.length - 1]
                            : null;
                  if (next) {
                    event.preventDefault();
                    selectTab(next, true);
                  }
                }}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-1 pb-2 pt-1 text-sm font-medium ${tab === value ? "border-[var(--vms-coral)] text-[var(--vms-ink)]" : "border-transparent text-[var(--vms-ink-muted)]"}`}
              >
                {label}
                <span className="min-w-5 rounded-full bg-[var(--vms-surface-subtle)] px-1.5 py-0.5 text-center text-xs tabular-nums">
                  {tree.isPending || relationships.isPending ? "…" : count}
                </span>
              </button>
            ))}
          </div>
          <div
            id="residential-relationship-panel"
            role="tabpanel"
            aria-labelledby={`residential-tab-${tab}`}
          >
            <section className="min-w-0 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
              <p className="mb-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
                {tab === "households"
                  ? "One row per unit with active members or pending move-ins. Open a household to see each relationship."
                  : tab === "pending"
                    ? "Pending relationships awaiting a move-in decision."
                    : "All residential relationships, including pending and ended records. Open a resident for occupancy dates and household context."}
              </p>
              {tab === "households" ? (
                <DataTable
                  key={tab}
                  data={householdRows}
                  columns={householdColumns}
                  tableLabel="Residential households by unit"
                  searchPlaceholder="Search units or household members"
                  isLoading={tree.isPending || relationships.isPending}
                  errorMessage={
                    tree.isError || relationships.isError
                      ? parseApiError(tree.error || relationships.error).message
                      : null
                  }
                  isStale={
                    (tree.isError || relationships.isError) &&
                    householdRows.length > 0
                  }
                  onRetry={() => {
                    void tree.refetch();
                    void relationships.refetch();
                  }}
                  emptyMessage="No active or pending households at this Site. Add a resident to start one."
                  mobileSummary={(household) => (
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      aria-label={`View ${household.unit_name} household`}
                      aria-haspopup="dialog"
                      onClick={() => setHouseholdDetailId(household.id)}
                    >
                      <span className="min-w-0">
                        <strong className="block text-sm">
                          {household.unit_name}
                        </strong>
                        <span className="mt-1 block text-xs text-[var(--vms-ink-muted)]">
                          {household.active_count} active ·{" "}
                          {household.pending_count} pending
                        </span>
                        <span className="mt-1 block truncate text-xs text-[var(--vms-ink-muted)]">
                          {household.members
                            .map((member) => member.person_name)
                            .join(", ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[var(--vms-action)]">
                        View
                      </span>
                    </button>
                  )}
                />
              ) : (
                <DataTable
                  key={tab}
                  data={tab === "pending" ? pendingRows : rows}
                  columns={columns}
                  availableFilters={
                    tab === "pending"
                      ? filters.filter((filter) => filter.field !== "status")
                      : filters
                  }
                  searchPlaceholder="Search residents (name, email, unit)"
                  selectable={canUpdateRelationships}
                  selectedRows={selected}
                  onSelectionChange={setSelected}
                  bulkActions={bulkActions}
                  isLoading={tree.isPending || relationships.isPending}
                  errorMessage={
                    tree.isError || relationships.isError
                      ? parseApiError(tree.error || relationships.error).message
                      : null
                  }
                  isStale={
                    (tree.isError || relationships.isError) && rows.length > 0
                  }
                  onRetry={() => {
                    void tree.refetch();
                    void relationships.refetch();
                  }}
                  emptyMessage={
                    tab === "pending"
                      ? "No pending move-ins at this Site."
                      : "No resident relationships match this view."
                  }
                  tableLabel={
                    tab === "pending"
                      ? "Pending residential move-ins"
                      : "Residential resident relationships"
                  }
                  rowClassName={(row) =>
                    row.id === detailId ? "bg-[var(--vms-coral-soft)]" : ""
                  }
                  mobileSummary={(row) => (
                    <button
                      type="button"
                      aria-label={`Open ${row.person_name} details`}
                      aria-haspopup="dialog"
                      className="w-full space-y-2 text-left"
                      onClick={() => setDetailId(row.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-semibold">
                            {row.person_name}
                          </span>
                          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                            {row.unit_name} · {titleCase(row.role)}
                          </p>
                        </div>
                        <StatusBadge tone={relationshipTone(row.status)}>
                          {titleCase(row.status)}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-[var(--vms-ink-muted)]">
                        {row.effective_from
                          ? `From ${formatDate(row.effective_from)}`
                          : "Start date unavailable"}
                        {row.effective_to
                          ? ` · Until ${formatDate(row.effective_to)}`
                          : " · Open-ended"}
                      </p>
                    </button>
                  )}
                />
              )}
            </section>
            <Drawer
              key={JSON.stringify(contextKey)}
              isOpen={!!selectedDetail}
              onClose={() => setDetailId(null)}
              title="Resident details"
              description={
                detail
                  ? `${detail.unit_name} · ${titleCase(detail.role)}`
                  : undefined
              }
              className="max-w-md"
            >
              {detail && (
                <>
                  <div className="flex items-center gap-4 border-b border-[var(--vms-line)] py-4">
                    <Avatar
                      name={detail.person_name}
                      src={detail.avatar_url}
                      size="lg"
                      className="h-20 w-20 rounded-xl text-xl"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">
                        {detail.person_name}
                      </h3>
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
                        ? formatDate(detail.effective_from)
                        : "Start date unavailable"}{" "}
                      –{" "}
                      {detail.effective_to
                        ? formatDate(detail.effective_to)
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
                  {canUpdateRelationships && detail.status === "pending" && (
                    <Button
                      className="mt-2 w-full"
                      onClick={() =>
                        update.mutate({ ids: [detail.id], action: "activate" })
                      }
                    >
                      Activate move-in
                    </Button>
                  )}
                  {canUpdateRelationships &&
                    ["pending", "active"].includes(detail.status) && (
                      <Button
                        variant="ghost"
                        className="mt-2 w-full"
                        onClick={() =>
                          confirmAction({
                            title: "End relationship?",
                            description: `End ${detail.person_name}'s relationship with ${detail.unit_name}? Their access through this relationship will end.`,
                            confirmLabel: "End relationship",
                            onConfirm: () =>
                              update.mutateAsync({
                                ids: [detail.id],
                                action: "end",
                              }),
                          })
                        }
                      >
                        End relationship
                      </Button>
                    )}
                  {canUpdateRelationships && detail.status === "ended" && (
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
                </>
              )}
            </Drawer>
            <Drawer
              key={`household:${contextKey}`}
              isOpen={!!selectedHousehold}
              onClose={() => setHouseholdDetailId(null)}
              title={
                selectedHousehold
                  ? `${selectedHousehold.unit_name} household`
                  : "Household"
              }
              description="Active members and pending move-ins at this unit."
              className="max-w-md"
            >
              {selectedHousehold ? (
                <div className="space-y-5 py-4">
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--vms-ink-muted)]">
                    <span className="rounded-full border border-[var(--vms-line)] px-2.5 py-1 tabular-nums">
                      {selectedHousehold.active_count} active
                    </span>
                    <span className="rounded-full border border-[var(--vms-line)] px-2.5 py-1 tabular-nums">
                      {selectedHousehold.pending_count} pending
                    </span>
                  </div>
                  <ul className="divide-y divide-[var(--vms-line)] border-y border-[var(--vms-line)]">
                    {selectedHousehold.members.map((member) => (
                      <li key={member.id}>
                        <Link
                          href={`/admin/residential/occupancies/${encodeURIComponent(member.id)}`}
                          className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                        >
                          <span className="min-w-0">
                            <strong className="block truncate text-sm">
                              {member.person_name}
                            </strong>
                            <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                              {titleCase(member.role)}
                              {member.effective_from
                                ? ` · From ${formatDate(member.effective_from)}`
                                : ""}
                            </span>
                          </span>
                          <StatusBadge tone={relationshipTone(member.status)}>
                            {titleCase(member.status)}
                          </StatusBadge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Drawer>
          </div>
        </>
      )}

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
      {confirmationDialog}
    </ResidentialShell>
  );
}

function relationshipTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "suspended") return "warning" as const;
  if (status === "ended") return "neutral" as const;
  return "info" as const;
}
