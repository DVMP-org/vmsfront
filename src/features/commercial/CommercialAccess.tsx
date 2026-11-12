"use client";

import type { QueryContext } from "@/lib/query-keys";
import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DoorOpen,
  KeyRound,
  Plus,
  ShieldCheck,
  UserRoundX,
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
import { invitationApprovalsApi } from "@/features/invitation-approvals/api";
import type { WorkspaceRelationship } from "@/types";
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import { accessRoles, titleCase } from "./contracts";

type AccessRow = {
  relationship: WorkspaceRelationship;
  id: string;
  person: string;
  email: string;
  role: string;
  space_id: string;
  space: string;
  starts: string;
  ends: string;
  state: "current" | "expiring" | "expired" | "open_ended";
  status: string;
};

export default function CommercialAccess() {
  const { selectedSite, contextKey, canManageAccess } =
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
    queryKey: ["commercial", contextKey, "relationships", placeId, "access"],
    queryFn: () => commercialApi.relationships(),
    enabled: !!placeId,
  });
  const invitations = useQuery({
    queryKey: ["commercial", contextKey, "invitations", placeId],
    queryFn: () =>
      invitationApprovalsApi.list({
        status: "all",
        page: 1,
        pageSize: 100,
        destinationPlaceId: placeId,
      }),
    enabled: !!placeId,
    retry: false,
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
  const rows = useMemo<AccessRow[]>(
    () =>
      (relationships.data?.items || [])
        .filter(
          (relationship) =>
            scopeIds.has(relationship.place.id) &&
            accessRoles.includes(relationship.role as never),
        )
        .map((relationship) => ({
          relationship,
          id: relationship.id,
          person: relationship.party.display_name,
          email: relationship.party.email || "",
          role: relationship.role,
          space_id: relationship.place.id,
          space: relationship.place.name,
          starts: relationship.effective_from || "",
          ends: relationship.effective_to || "",
          state: accessState(relationship.effective_to),
          status: relationship.status,
        })),
    [relationships.data?.items, scopeIds],
  );
  const pendingInvitations = (invitations.data?.items || []).filter(
    (invitation) => invitation.status === "requested",
  ).length;
  const update = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      Promise.all(
        ids.map((id) =>
          commercialApi.updateRelationship(id, {
            status: active ? "active" : "ended",
            ...(active ? {} : { effective_to: new Date().toISOString() }),
          }),
        ),
      ),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      await client.invalidateQueries({
        queryKey: ["commercial", contextKey],
      });
      toast.success(
        `${updated.length} access relationship${updated.length === 1 ? "" : "s"} ${
          variables.active ? "activated" : "ended"
        }.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const columns: Column<AccessRow>[] = [
    {
      key: "person",
      header: "Person",
      sortable: true,
      accessor: (row) => (
        <span>
          <strong className="block truncate">{row.person}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.email || "No contact email"}
          </span>
        </span>
      ),
    },
    {
      key: "space",
      header: "Commercial space",
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
      header: "Access role",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={row.role === "contractor" ? "warning" : "info"}>
          {titleCase(row.role)}
        </StatusBadge>
      ),
    },
    {
      key: "ends",
      header: "Access window",
      sortable: true,
      accessor: (row) =>
        row.ends
          ? `${format(new Date(row.ends), "d MMM yyyy")} · ${titleCase(
              row.state,
            )}`
          : "Open ended",
    },
    {
      key: "status",
      header: "Relationship",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={accessTone(row.status)}>
          {titleCase(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      className: "text-right",
      accessor: (row) =>
        canManageAccess && ["active", "pending"].includes(row.status) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update.mutate({ ids: [row.id], active: false })}
          >
            End access
          </Button>
        ) : row.status === "ended" && canManageAccess ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update.mutate({ ids: [row.id], active: true })}
          >
            Restore
          </Button>
        ) : null,
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "space_id",
      label: "Commercial space",
      type: "select",
      isSearchable: true,
      options: spaces.map((space) => ({
        value: space.id,
        label: space.name,
      })),
    },
    {
      field: "role",
      label: "Access role",
      type: "select",
      options: accessRoles.map((role) => ({
        value: role,
        label: titleCase(role),
      })),
    },
    {
      field: "state",
      label: "Access window",
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
  const bulkActions: BulkAction[] = canManageAccess
    ? [
        {
          label: "End access",
          icon: UserRoundX,
          variant: "destructive",
          requiresConfirmation: true,
          confirmationMessage:
            "End access for the selected employees and contractors? Their historical access record remains auditable.",
          onClick: (ids) => update.mutate({ ids, active: false }),
        },
      ]
    : [];

  return (
    <CommercialShell
      title="Staff & contractor access"
      description="Time-bounded operating access for employees and contractors, kept separate from business tenancy and visitor invitations."
      primaryAction={
        canManageAccess ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Assign access
          </Button>
        ) : undefined
      }
    >
      <SummaryStrip
        items={[
          {
            icon: KeyRound,
            label: "Access relationships",
            value: rows.length,
            detail: "Employees and contractors",
          },
          {
            icon: ShieldCheck,
            label: "Active",
            value: rows.filter((row) => row.status === "active").length,
            detail: "Currently valid operating access",
          },
          {
            icon: DoorOpen,
            label: "Visitor approvals",
            value: pendingInvitations,
            detail: invitations.isError
              ? "Invitation queue unavailable"
              : "Requests awaiting approval",
          },
        ]}
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Operational access</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Employee and contractor access uses Party-to-Place relationships
              and the same access-control policy as shared checkpoints.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/invitations">
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Visitor invitation queue
            </Link>
          </Button>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search people, roles or spaces"
          selectable={canManageAccess}
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
          emptyMessage="No employee or contractor access relationships match this property."
          tableLabel="Commercial staff and contractor access"
          mobileSummary={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{row.person}</strong>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {row.space} · {titleCase(row.role)}
                  </p>
                </div>
                <StatusBadge tone={accessTone(row.status)}>
                  {titleCase(row.status)}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {row.ends
                  ? `Access ends ${format(new Date(row.ends), "d MMM yyyy")}`
                  : "Open-ended access relationship"}
              </p>
              {canManageAccess && ["active", "pending"].includes(row.status) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update.mutate({ ids: [row.id], active: false })
                  }
                >
                  End access
                </Button>
              ) : null}
            </div>
          )}
        />
      </section>
      <AssignAccessModal
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
    </CommercialShell>
  );
}

function AssignAccessModal({
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
  const [person, setPerson] = useState<FacetItem | null>(null);
  const [role, setRole] = useState<string>("employee");
  const [starts, setStarts] = useState(new Date().toISOString().slice(0, 10));
  const [ends, setEnds] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () =>
      commercialApi.createRelationship({
        party_id: person!.value,
        place_id: spaceId,
        role,
        status: "active",
        effective_from: starts
          ? new Date(`${starts}T00:00:00`).toISOString()
          : null,
        effective_to: ends ? new Date(`${ends}T23:59:59`).toISOString() : null,
      }),
    onSuccess: async () => {
      toast.success("Commercial access assigned.");
      await onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!spaceId) next.space = "Choose a commercial space.";
    if (!person) next.person = "Choose the person receiving access.";
    if (ends && starts && new Date(ends) <= new Date(starts)) {
      next.ends = "Access end must follow the start date.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Assign commercial access"
      description="Create a time-bounded employee or contractor relationship for a commercial space."
      size="md"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field
          id="access-space"
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
          kind="person"
          label="Person"
          value={person}
          contextKey={contextKey}
          onChange={setPerson}
          error={errors.person}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="access-role" label="Role">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {accessRoles.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="access-start" label="Start">
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
          <Field id="access-end" label="End" error={errors.ends}>
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
            Assign access
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function accessState(value: string | null): AccessRow["state"] {
  if (!value) return "open_ended";
  const days = differenceInCalendarDays(new Date(value), new Date());
  return days < 0 ? "expired" : days <= 30 ? "expiring" : "current";
}

function accessTone(status: string): StatusTone {
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
