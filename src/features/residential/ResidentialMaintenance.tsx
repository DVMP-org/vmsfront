"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Plus,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";

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
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import {
  maintenancePriorities,
  maintenanceStatuses,
  titleCase,
  type MaintenancePriority,
  type MaintenanceRequest,
  type MaintenanceStatus,
} from "./contracts";
import { maintenanceTone, priorityTone } from "./ResidentialOverview";

const categories = [
  "plumbing",
  "electrical",
  "appliance",
  "structure",
  "hvac",
  "pest_control",
  "common_area",
  "other",
];

export default function ResidentialMaintenance() {
  const { contextKey, selectedProperty, canManageMaintenance } =
    useResidentialAccess();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<MaintenanceRequest | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const placeId = selectedProperty?.id || "";
  const tree = useQuery({
    queryKey: ["residential", contextKey, "tree"],
    queryFn: residentialApi.tree,
    enabled: !!placeId,
  });
  const requests = useQuery({
    queryKey: ["residential", contextKey, "maintenance", placeId],
    queryFn: () => residentialApi.maintenance({}),
    enabled: !!placeId,
  });
  const scopeIds = useMemo(
    () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
    [placeId, tree.data],
  );
  const units = useMemo(
    () =>
      tree.data
        ? flattenPlaces(tree.data).filter(
            (place) => scopeIds.has(place.id) && place.kind === "unit",
          )
        : [],
    [scopeIds, tree.data],
  );
  const rows = useMemo(
    () =>
      (requests.data?.items || []).filter((request) =>
        scopeIds.has(request.place_id),
      ),
    [requests.data?.items, scopeIds],
  );
  const update = useMutation({
    mutationFn: ({
      ids,
      body,
    }: {
      ids: string[];
      body: Parameters<typeof residentialApi.updateMaintenance>[1];
    }) =>
      Promise.all(ids.map((id) => residentialApi.updateMaintenance(id, body))),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      setActive((current) =>
        current
          ? updated.find((request) => request.id === current.id) || current
          : current,
      );
      await queryClient.invalidateQueries({
        queryKey: ["residential", contextKey],
      });
      toast.success(
        `${updated.length} request${updated.length === 1 ? "" : "s"} ${
          variables.body.status
            ? `marked ${titleCase(variables.body.status)}`
            : "updated"
        }.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: "Request",
      sortable: true,
      accessor: (request) => (
        <span>
          <button
            type="button"
            onClick={() => setActive(request)}
            className="block text-left font-semibold underline-offset-4 hover:underline"
          >
            {request.title}
          </button>
          <span className="mt-0.5 block max-w-xl truncate text-xs text-[var(--vms-ink-muted)]">
            {request.place.name} · {titleCase(request.category)}
          </span>
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      accessor: (request) => (
        <StatusBadge tone={priorityTone(request.priority)}>
          {titleCase(request.priority)}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (request) => (
        <StatusBadge tone={maintenanceTone(request.status)}>
          {titleCase(request.status)}
        </StatusBadge>
      ),
    },
    {
      key: "assignee",
      header: "Assigned to",
      sortable: true,
      accessor: (request) => request.assigned_to?.display_name || "Unassigned",
    },
    {
      key: "due_at",
      header: "Due",
      sortable: true,
      accessor: (request) =>
        request.due_at ? format(new Date(request.due_at), "d MMM yyyy") : "—",
    },
    {
      key: "created_at",
      header: "Raised",
      sortable: true,
      accessor: (request) => format(new Date(request.created_at), "d MMM yyyy"),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      mobileHide: true,
      accessor: (request) => (
        <Button variant="ghost" size="sm" onClick={() => setActive(request)}>
          Review
        </Button>
      ),
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "place_id",
      label: "Unit",
      type: "select",
      isSearchable: true,
      options: units.map((unit) => ({ value: unit.id, label: unit.name })),
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: maintenanceStatuses.map((status) => ({
        value: status,
        label: titleCase(status),
      })),
    },
    {
      field: "priority",
      label: "Priority",
      type: "select",
      options: maintenancePriorities.map((priority) => ({
        value: priority,
        label: titleCase(priority),
      })),
    },
    {
      field: "category",
      label: "Category",
      type: "select",
      isSearchable: true,
      options: categories.map((category) => ({
        value: category,
        label: titleCase(category),
      })),
    },
  ];
  const bulkActions: BulkAction[] = canManageMaintenance
    ? [
        {
          label: "Start work",
          icon: Wrench,
          onClick: (ids) =>
            update.mutate({ ids, body: { status: "in_progress" } }),
        },
        {
          label: "Mark resolved",
          icon: CheckCircle2,
          onClick: (ids) =>
            update.mutate({ ids, body: { status: "resolved" } }),
        },
      ]
    : [];
  const openCount = rows.filter(
    (request) => !["resolved", "closed"].includes(request.status),
  ).length;
  const urgentCount = rows.filter(
    (request) =>
      request.priority === "urgent" &&
      !["resolved", "closed"].includes(request.status),
  ).length;

  return (
    <ResidentialShell
      title="Maintenance"
      description="Unit-linked resident issues from intake through triage, assignment, work and resolution."
      primaryAction={
        canManageMaintenance ? (
          <Button onClick={() => setCreateOpen(true)} disabled={!units.length}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Raise request
          </Button>
        ) : undefined
      }
    >
      <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
        <Summary
          icon={ClipboardList}
          label="Open"
          value={openCount}
          detail="Not yet resolved or closed"
        />
        <Summary
          icon={TriangleAlert}
          label="Urgent"
          value={urgentCount}
          detail="Requires immediate triage"
        />
        <Summary
          icon={ClipboardCheck}
          label="Resolved"
          value={rows.filter((request) => request.status === "resolved").length}
          detail="Completed in the current register"
        />
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search requests, units or categories"
          selectable={canManageMaintenance}
          selectedRows={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
          isLoading={tree.isPending || requests.isPending}
          errorMessage={
            tree.isError || requests.isError
              ? parseApiError(tree.error || requests.error).message
              : null
          }
          isStale={(tree.isError || requests.isError) && rows.length > 0}
          onRetry={() => {
            void tree.refetch();
            void requests.refetch();
          }}
          emptyMessage="No maintenance requests match this property."
          tableLabel="Residential maintenance requests"
          scrollHint="Scroll horizontally to compare priority, assignment, status and due dates."
          mobileSummary={(request) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{request.title}</strong>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {request.place.name} · {titleCase(request.category)}
                  </p>
                </div>
                <StatusBadge tone={priorityTone(request.priority)}>
                  {titleCase(request.priority)}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {titleCase(request.status)} ·{" "}
                {request.assigned_to?.display_name || "Unassigned"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActive(request)}
              >
                Review request
              </Button>
            </div>
          )}
        />
      </section>

      <CreateMaintenanceModal
        key={`${createOpen}:${units[0]?.id || "none"}`}
        open={createOpen}
        units={units}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
      <MaintenanceDetail
        request={active}
        contextKey={contextKey}
        canManage={canManageMaintenance}
        onClose={() => setActive(null)}
        onUpdate={(body) => active && update.mutate({ ids: [active.id], body })}
        saving={update.isPending}
      />
    </ResidentialShell>
  );
}

function CreateMaintenanceModal({
  open,
  units,
  onClose,
  onSaved,
}: {
  open: boolean;
  units: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [placeId, setPlaceId] = useState(units[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("plumbing");
  const [priority, setPriority] = useState<MaintenancePriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () =>
      residentialApi.createMaintenance({
        place_id: placeId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success("Maintenance request raised.");
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!placeId) next.place_id = "Choose the affected unit.";
    if (title.trim().length < 3) next.title = "Enter a concise issue title.";
    if (description.trim().length < 10)
      next.description = "Describe the issue and where it occurs.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Raise a maintenance request"
      description="Capture the affected unit, priority and expected response deadline."
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field id="request-unit" label="Unit" required error={errors.place_id}>
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="request-title" label="Issue" required error={errors.title}>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoComplete="off"
              placeholder="e.g. Kitchen tap is leaking"
            />
          )}
        </Field>
        <Field
          id="request-description"
          label="Description"
          required
          error={errors.description}
        >
          {(control) => (
            <textarea
              {...control}
              className={`${fieldControlClassName} min-h-28 py-2`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="request-category" label="Category">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="request-priority" label="Priority">
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as MaintenancePriority)
                }
              >
                {maintenancePriorities.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field id="request-due" label="Respond by">
          {(control) => (
            <input
              {...control}
              type="datetime-local"
              className={fieldControlClassName}
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Raising…" : "Raise request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MaintenanceDetail({
  request,
  contextKey,
  canManage,
  onClose,
  onUpdate,
  saving,
}: {
  request: MaintenanceRequest | null;
  contextKey: string;
  canManage: boolean;
  onClose: () => void;
  onUpdate: (body: {
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    assigned_to_party_id?: string | null;
  }) => void;
  saving: boolean;
}) {
  const [assignee, setAssignee] = useState<FacetItem | null>(null);
  if (!request) return null;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={request.title}
      description={`${request.place.name} · ${titleCase(request.category)}`}
      size="md"
    >
      <div className="space-y-5">
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--vms-ink-muted)]">
          {request.description}
        </p>
        <dl className="grid gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-4 text-sm sm:grid-cols-2">
          <Detail label="Status" value={titleCase(request.status)} />
          <Detail label="Priority" value={titleCase(request.priority)} />
          <Detail
            label="Reported by"
            value={request.reported_by?.display_name || "Not recorded"}
          />
          <Detail
            label="Assigned to"
            value={request.assigned_to?.display_name || "Unassigned"}
          />
          <Detail
            label="Raised"
            value={format(new Date(request.created_at), "d MMM yyyy, HH:mm")}
          />
          <Detail
            label="Respond by"
            value={
              request.due_at
                ? format(new Date(request.due_at), "d MMM yyyy, HH:mm")
                : "Not set"
            }
          />
        </dl>
        {canManage ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="detail-status" label="Move request to">
                {(control) => (
                  <select
                    {...control}
                    className={fieldControlClassName}
                    value={request.status}
                    onChange={(event) =>
                      onUpdate({
                        status: event.target.value as MaintenanceStatus,
                      })
                    }
                    disabled={saving}
                  >
                    {maintenanceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="detail-priority" label="Priority">
                {(control) => (
                  <select
                    {...control}
                    className={fieldControlClassName}
                    value={request.priority}
                    onChange={(event) =>
                      onUpdate({
                        priority: event.target.value as MaintenancePriority,
                      })
                    }
                    disabled={saving}
                  >
                    {maintenancePriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {titleCase(priority)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <FacetPicker
              facet="parties"
              kind="person"
              label="Assign responsible person"
              value={assignee}
              onChange={(item) => {
                setAssignee(item);
                onUpdate({ assigned_to_party_id: item?.value || null });
              }}
              contextKey={contextKey}
              description="Choose a staff or contractor Party with operational responsibility."
            />
          </>
        ) : null}
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
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
