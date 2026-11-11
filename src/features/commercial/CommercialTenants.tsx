"use client";

import type { QueryContext } from "@/lib/query-keys";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleSlash2,
  Plus,
  UserRoundPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { format } from "date-fns/format";
import { toast } from "sonner";

import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import type { WorkspaceRelationship } from "@/types";
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import { tenantRoles, titleCase } from "./contracts";

type TenantRow = {
  relationship: WorkspaceRelationship;
  id: string;
  tenant: string;
  email: string;
  role: string;
  space_id: string;
  space: string;
  starts: string;
  ends: string;
  lease_state: "current" | "expiring" | "expired" | "open_ended";
  status: string;
};

export default function CommercialTenants() {
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const { selectedSite, contextKey, canManagePeople } =
    useCommercialAccess();
  const client = useQueryClient();
  const placeId = selectedSite?.id || "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const tree = useQuery({
    queryKey: ["commercial", contextKey, "tree"],
    queryFn: commercialApi.tree,
    enabled: !!placeId,
  });
  const relationships = useQuery({
    queryKey: ["commercial", contextKey, "relationships", placeId, "tenants"],
    queryFn: () => commercialApi.relationships(),
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
  const spaces = useMemo(
    () =>
      allPlaces.filter(
        (place) => scopeIds.has(place.id) && isCommercialInventory(place),
      ),
    [allPlaces, scopeIds],
  );
  const rows = useMemo<TenantRow[]>(
    () =>
      (relationships.data?.items || [])
        .filter(
          (relationship) =>
            scopeIds.has(relationship.place.id) &&
            tenantRoles.includes(relationship.role as never),
        )
        .map((relationship) => ({
          relationship,
          id: relationship.id,
          tenant: relationship.party.display_name,
          email: relationship.party.email || "",
          role: relationship.role,
          space_id: relationship.place.id,
          space: relationship.place.name,
          starts: relationship.effective_from || "",
          ends: relationship.effective_to || "",
          lease_state: leaseState(relationship.effective_to),
          status: relationship.status,
        })),
    [relationships.data?.items, scopeIds],
  );
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
            return commercialApi.updateRelationship(id, {
              status: "ended",
              effective_to: new Date().toISOString(),
            });
          }
          return commercialApi.updateRelationship(id, {
            status: action === "suspend" ? "suspended" : "active",
          });
        }),
      ),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      await client.invalidateQueries({
        queryKey: ["commercial", contextKey],
      });
      toast.success(
        `${updated.length} tenant relationship${updated.length === 1 ? "" : "s"} ${
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
  const columns: Column<TenantRow>[] = [
    {
      key: "tenant",
      header: "Business tenant",
      sortable: true,
      accessor: (row) => (
        <span>
          <strong className="block truncate">{row.tenant}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.email || "No contact email"}
          </span>
        </span>
      ),
    },
    {
      key: "space",
      header: "Space",
      sortable: true,
      accessor: (row) => (
        <Link
          href={`/admin/places/${row.space_id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.space}
        </Link>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      accessor: (row) => titleCase(row.role),
    },
    {
      key: "lease_state",
      header: "Lease",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={leaseTone(row.lease_state)}>
          {titleCase(row.lease_state)}
        </StatusBadge>
      ),
    },
    {
      key: "ends",
      header: "Ends",
      sortable: true,
      accessor: (row) =>
        row.ends ? format(new Date(row.ends), "d MMM yyyy") : "Open ended",
    },
    {
      key: "status",
      header: "Relationship",
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
      accessor: (row) =>
        canManagePeople && ["pending", "active"].includes(row.status) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmAction({title: "End tenancy?", description: `End ${row.tenant}'s relationship with ${row.space}? Their access through this relationship will end.`, confirmLabel: "End tenancy", onConfirm: () => update.mutateAsync({ ids: [row.id], action: "end" })})}
          >
            End
          </Button>
        ) : row.status === "ended" && canManagePeople ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update.mutate({ ids: [row.id], action: "activate" })}
          >
            Reactivate
          </Button>
        ) : null,
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "space_id",
      label: "Space",
      type: "select",
      isSearchable: true,
      options: spaces.map((space) => ({
        value: space.id,
        label: space.name,
      })),
    },
    {
      field: "role",
      label: "Role",
      type: "select",
      options: tenantRoles.map((role) => ({
        value: role,
        label: titleCase(role),
      })),
    },
    {
      field: "lease_state",
      label: "Lease state",
      type: "select",
      options: ["current", "expiring", "expired", "open_ended"].map(
        (value) => ({ value, label: titleCase(value) }),
      ),
    },
    {
      field: "status",
      label: "Relationship",
      type: "select",
      options: ["active", "pending", "suspended", "ended"].map((value) => ({
        value,
        label: titleCase(value),
      })),
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
          label: "End lease",
          icon: CalendarClock,
          variant: "destructive",
          requiresConfirmation: true,
          confirmationMessage:
            "End the selected commercial relationships now? Historical access and charge responsibility remain auditable.",
          onClick: (ids) => update.mutate({ ids, action: "end" }),
        },
      ]
    : [];
  const expiring = rows.filter(
    (row) => row.lease_state === "expiring" || row.lease_state === "expired",
  ).length;

  return (
    <CommercialShell
      title="Business tenants & leases"
      description="Organization and member relationships attached to commercial spaces, with explicit lease periods and expiry attention."
      primaryAction={
        canManagePeople ? (
          <Button onClick={() => setCreateOpen(true)} disabled={!spaces.length}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Assign business tenant
          </Button>
        ) : undefined
      }
    >
      <SummaryStrip
        items={[
          {
            icon: BriefcaseBusiness,
            label: "Tenant relationships",
            value: rows.length,
            detail: "Current and historical records",
          },
          {
            icon: CheckCircle2,
            label: "Active",
            value: rows.filter((row) => row.status === "active").length,
            detail: "Currently active relationships",
          },
          {
            icon: CalendarClock,
            label: "Expiry attention",
            value: expiring,
            detail: "Expired or ending within 60 days",
          },
        ]}
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Tenancy and lease periods
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Lease expiry is derived from the canonical Place relationship.
              Access and charges can follow the same organization Party.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/people">
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Add a business party
            </Link>
          </Button>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search tenants, emails or spaces"
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
          emptyMessage="No business tenant relationships match this property."
          tableLabel="Commercial business tenants and leases"
          mobileSummary={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{row.tenant}</strong>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {row.space} · {titleCase(row.role)}
                  </p>
                </div>
                <StatusBadge tone={leaseTone(row.lease_state)}>
                  {titleCase(row.lease_state)}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {row.ends
                  ? `Ends ${format(new Date(row.ends), "d MMM yyyy")}`
                  : "Open-ended relationship"}
              </p>
            </div>
          )}
        />
      </section>
      <AssignTenantModal
        key={`${createOpen}:${spaces[0]?.id || "none"}`}
        open={createOpen}
        spaces={spaces}
        contextKey={contextKey}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false);
          await client.invalidateQueries({
            queryKey: ["commercial", contextKey],
          });
        }}
      />
      {confirmationDialog}
    </CommercialShell>
  );
}

function AssignTenantModal({
  open,
  spaces,
  contextKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  spaces: Array<{ id: string; name: string }>;
  contextKey: QueryContext;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [spaceId, setSpaceId] = useState(spaces[0]?.id || "");
  const [party, setParty] = useState<FacetItem | null>(null);
  const [role, setRole] = useState<string>("tenant");
  const [starts, setStarts] = useState(new Date().toISOString().slice(0, 10));
  const [ends, setEnds] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () =>
      commercialApi.createRelationship({
        party_id: party!.value,
        place_id: spaceId,
        role,
        status: "active",
        effective_from: starts
          ? new Date(`${starts}T00:00:00`).toISOString()
          : null,
        effective_to: ends ? new Date(`${ends}T23:59:59`).toISOString() : null,
      }),
    onSuccess: async () => {
      toast.success("Business tenant relationship created.");
      await onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!spaceId) next.space = "Choose a commercial space.";
    if (!party) next.party = "Choose the business organization or member.";
    if (ends && starts && new Date(ends) <= new Date(starts)) {
      next.ends = "Lease end must follow the start date.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Assign business tenant"
      description="Attach a business Party to a commercial space with an explicit lease period."
      size="md"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field
          id="tenant-space"
          label="Commercial space"
          required
          error={errors.space}
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={spaceId}
              onChange={(event) => setSpaceId(event.target.value)}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <FacetPicker
          facet="parties"
          kind="organization"
          label="Business organization"
          value={party}
          contextKey={contextKey}
          onChange={setParty}
          error={errors.party}
          description="Choose an active organization Party already visible in this tenant."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="tenant-role" label="Role">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {tenantRoles.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="tenant-start" label="Lease start">
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={starts}
                onChange={(event) => setStarts(event.target.value)}
              />
            )}
          </Field>
          <Field
            id="tenant-end"
            label="Lease end"
            error={errors.ends}
            description="Required for expiry tracking."
          >
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={ends}
                min={starts}
                onChange={(event) => setEnds(event.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            Assign tenant
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function leaseState(value: string | null): TenantRow["lease_state"] {
  if (!value) return "open_ended";
  const days = differenceInCalendarDays(new Date(value), new Date());
  return days < 0 ? "expired" : days <= 60 ? "expiring" : "current";
}

function leaseTone(state: TenantRow["lease_state"]): StatusTone {
  return state === "expired"
    ? "danger"
    : state === "expiring"
      ? "warning"
      : "success";
}

function relationshipTone(status: string): StatusTone {
  return status === "active"
    ? "success"
    : status === "pending"
      ? "warning"
      : status === "suspended"
        ? "danger"
        : "neutral";
}

function SummaryStrip({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: number;
    detail: string;
  }>;
}) {
  return (
    <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value, detail }) => (
        <div
          key={label}
          className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
        </div>
      ))}
    </section>
  );
}
