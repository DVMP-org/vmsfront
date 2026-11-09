"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  CircleSlash2,
  Plus,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";

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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import type { WorkspaceRelationship } from "@/types";
import { peopleApi } from "@/features/people/api";
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
  role: string;
  status: string;
  lease_state: string;
  effective_from: string;
  effective_to: string;
};

export default function ResidentialOccupancies() {
  const { contextKey, selectedProperty, canManagePeople } =
    useResidentialAccess();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const placeId = selectedProperty?.id || "";
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
      header: "Person",
      sortable: true,
      accessor: (row) => (
        <span>
          <strong className="block truncate">{row.person_name}</strong>
          <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
            {row.email || "No email"}
          </span>
        </span>
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
      accessor: (row) => titleCase(row.role),
    },
    {
      key: "lease_state",
      header: "Lease / occupancy",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={leaseTone(row.lease_state)}>
          {titleCase(row.lease_state)}
        </StatusBadge>
      ),
    },
    {
      key: "effective_to",
      header: "Ends",
      sortable: true,
      accessor: (row) =>
        row.effective_to
          ? format(new Date(row.effective_to), "d MMM yyyy")
          : "Open ended",
    },
    {
      key: "status",
      header: "Status",
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
            onClick={() => {
              if (
                window.confirm(
                  `End ${row.person_name}'s relationship with ${row.unit_name}?`,
                )
              ) {
                update.mutate({ ids: [row.id], action: "end" });
              }
            }}
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
      title="Households & leases"
      description="Unit-level residents, owners and tenants with an explicit relationship period. Lease renewal and expiry are derived from these dates."
      primaryAction={
        canManagePeople ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Assign household
          </Button>
        ) : undefined
      }
    >
      <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
        <Summary
          icon={UsersRound}
          label="Active people"
          value={rows.filter((row) => row.status === "active").length}
          detail="Relationships currently active"
        />
        <Summary
          icon={CalendarClock}
          label="Expiring soon"
          value={rows.filter((row) => row.lease_state === "expiring").length}
          detail="Within the next 60 days"
        />
        <Summary
          icon={CheckCircle2}
          label="Units represented"
          value={new Set(rows.map((row) => row.unit_id)).size}
          detail="At least one current or historical relationship"
        />
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              People and lease periods
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              This register uses canonical Place relationships. Charges and
              access can follow the same Party and unit.
            </p>
          </div>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search people, emails or units"
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
                  <strong>{row.person_name}</strong>
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

      <AssignHouseholdModal
        key={`${createOpen}:${units[0]?.id || "none"}`}
        open={createOpen}
        siteId={placeId}
        units={units}
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

function AssignHouseholdModal({
  open,
  siteId,
  units,
  contextKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  siteId: string;
  units: Array<{ id: string; name: string }>;
  contextKey: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [personMode, setPersonMode] = useState<"existing" | "new">("existing");
  const [party, setParty] = useState<FacetItem | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("resident");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async () => {
      const effective = {
        effective_from: effectiveFrom
          ? new Date(effectiveFrom).toISOString()
          : null,
        effective_to: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      };
      if (personMode === "new") {
        return peopleApi.add(siteId, {
          place_id: unitId,
          display_name: displayName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          kind: "person",
          role,
          ...effective,
        });
      }
      return residentialApi.createRelationship({
        party_id: party!.value,
        place_id: unitId,
        role,
        status: "active",
        ...effective,
      });
    },
    onSuccess: () => {
      toast.success("Household relationship created.");
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!unitId) next["household-unit"] = "Choose a unit.";
    if (personMode === "existing" && !party) {
      next.party = "Choose the person joining this unit.";
    }
    if (personMode === "new" && !displayName.trim()) {
      next["resident-name"] = "Enter the resident's full name.";
    }
    if (
      personMode === "new" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      next["resident-email"] = "Enter a valid email address.";
    }
    if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
      next.effective_to = "The end date must be after the start date.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Assign a household relationship"
      description="Attach an existing Party or onboard a new resident directly to this unit."
      size="md"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {!units.length ? (
          <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm">
            <p className="font-semibold">Create a unit first.</p>
            <p className="mt-1 text-[var(--vms-ink-muted)]">
              A household relationship must be attached to a residential unit.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link href="/admin/residential/units">Open units</Link>
            </Button>
          </div>
        ) : null}
        <FormErrorSummary errors={errors} />
        <Field
          id="household-unit"
          label="Unit"
          required
          error={errors["household-unit"]}
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">Resident</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["existing", "Existing Party"],
                ["new", "New resident"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-sm font-medium"
              >
                <input
                  type="radio"
                  name="resident-mode"
                  value={value}
                  checked={personMode === value}
                  onChange={() => {
                    setPersonMode(value);
                    setErrors({});
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {personMode === "existing" ? (
          <FacetPicker
            facet="parties"
            kind="person"
            label="Person"
            value={party}
            onChange={setParty}
            contextKey={contextKey}
            error={errors.party}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="resident-name"
              label="Full name"
              required
              error={errors["resident-name"]}
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                />
              )}
            </Field>
            <Field
              id="resident-email"
              label="Email address"
              required
              error={errors["resident-email"]}
            >
              {(control) => (
                <input
                  {...control}
                  type="email"
                  inputMode="email"
                  className={fieldControlClassName}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              )}
            </Field>
            <Field id="resident-phone" label="Phone number">
              {(control) => (
                <input
                  {...control}
                  type="tel"
                  inputMode="tel"
                  className={fieldControlClassName}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              )}
            </Field>
          </div>
        )}
        <Field id="household-role" label="Relationship" required>
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {occupancyRoles.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="effective-from" label="Starts">
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            )}
          </Field>
          <Field
            id="effective-to"
            label="Lease / occupancy ends"
            error={errors.effective_to}
            description="Required for fixed-term leases; leave blank for open-ended occupancy."
          >
            {(control) => (
              <input
                {...control}
                type="date"
                className={fieldControlClassName}
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Assigning…" : "Assign relationship"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}

function leaseState(effectiveTo: string | null) {
  if (!effectiveTo) return "open_ended";
  const remaining = differenceInCalendarDays(new Date(effectiveTo), new Date());
  if (remaining < 0) return "expired";
  if (remaining <= 60) return "expiring";
  return "current";
}

function leaseTone(state: string) {
  if (state === "expired") return "danger" as const;
  if (state === "expiring") return "warning" as const;
  if (state === "open_ended") return "neutral" as const;
  return "success" as const;
}

function relationshipTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "suspended") return "warning" as const;
  if (status === "ended") return "neutral" as const;
  return "info" as const;
}
