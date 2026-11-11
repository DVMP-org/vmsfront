"use client";

import type { QueryContext } from "@/lib/query-keys";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Plus,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { CommercialShell, useCommercialAccess } from "./CommercialShell";
import {
  commercialApi,
  descendantIds,
  flattenPlaces,
  isCommercialInventory,
} from "./api";
import {
  maintenancePriorities,
  maintenanceStatuses,
  titleCase,
  type CommercialMaintenanceRequest,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "./contracts";

const categories = [
  "hvac",
  "electrical",
  "plumbing",
  "structure",
  "elevator",
  "security",
  "cleaning",
  "common_area",
  "other",
];

export default function CommercialMaintenance() {
  const { selectedSite, contextKey, canManageMaintenance } =
    useCommercialAccess();
  const client = useQueryClient();
  const placeId = selectedSite?.id || "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<CommercialMaintenanceRequest | null>(
    null,
  );
  const tree = useQuery({
    queryKey: ["commercial", contextKey, "tree"],
    queryFn: commercialApi.tree,
    enabled: !!placeId,
  });
  const requests = useQuery({
    queryKey: ["commercial", contextKey, "maintenance", placeId],
    queryFn: () => commercialApi.maintenance({}),
    enabled: !!placeId,
    retry: false,
  });
  const scopeIds = useMemo(
    () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
    [placeId, tree.data],
  );
  const spaces = useMemo(
    () =>
      tree.data
        ? flattenPlaces(tree.data).filter(
            (place) => scopeIds.has(place.id) && isCommercialInventory(place),
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
      body: Parameters<typeof commercialApi.updateMaintenance>[1];
    }) =>
      Promise.all(ids.map((id) => commercialApi.updateMaintenance(id, body))),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      setActive((current) =>
        current
          ? updated.find((request) => request.id === current.id) || current
          : current,
      );
      await client.invalidateQueries({
        queryKey: ["commercial", contextKey],
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
  const columns: Column<CommercialMaintenanceRequest>[] = [
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
      label: "Commercial space",
      type: "select",
      isSearchable: true,
      options: spaces.map((space) => ({
        value: space.id,
        label: space.name,
      })),
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
  const open = rows.filter(
    (request) => !["resolved", "closed"].includes(request.status),
  ).length;
  const urgent = rows.filter(
    (request) =>
      request.priority === "urgent" &&
      !["resolved", "closed"].includes(request.status),
  ).length;

  return (
    <CommercialShell
      title="Commercial maintenance"
      description="Space-linked commercial issues from intake through assignment, work and resolution."
      primaryAction={
        canManageMaintenance ? (
          <Button onClick={() => setCreateOpen(true)} disabled={!spaces.length}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Raise request
          </Button>
        ) : undefined
      }
    >
      {requests.isError ? (
        <section
          role="status"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)]"
        >
          <p className="font-semibold">
            Commercial maintenance is unavailable.
          </p>
          <p className="mt-1">
            The register is wired to the typed commercial maintenance API but
            the endpoint is not yet available:{" "}
            {parseApiError(requests.error).message}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() => requests.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : null}
      <SummaryStrip
        items={[
          {
            icon: ClipboardList,
            label: "Open",
            value: requests.isError ? "—" : String(open),
            detail: "Not resolved or closed",
          },
          {
            icon: TriangleAlert,
            label: "Urgent",
            value: requests.isError ? "—" : String(urgent),
            detail: "Requires immediate triage",
          },
          {
            icon: ClipboardCheck,
            label: "Resolved",
            value: requests.isError
              ? "—"
              : String(
                  rows.filter((request) => request.status === "resolved")
                    .length,
                ),
            detail: "Completed in the current register",
          },
        ]}
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search requests, spaces or categories"
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
          emptyMessage={
            requests.isError
              ? "Maintenance data is temporarily unavailable."
              : "No commercial maintenance requests match this property."
          }
          tableLabel="Commercial maintenance requests"
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
        key={`${createOpen}:${spaces[0]?.id || "none"}`}
        open={createOpen}
        spaces={spaces}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false);
          await client.invalidateQueries({
            queryKey: ["commercial", contextKey],
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
    </CommercialShell>
  );
}

function CreateMaintenanceModal({
  open,
  spaces,
  onClose,
  onSaved,
}: {
  open: boolean;
  spaces: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [placeId, setPlaceId] = useState(spaces[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("hvac");
  const [priority, setPriority] = useState<MaintenancePriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () =>
      commercialApi.createMaintenance({
        place_id: placeId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      }),
    onSuccess: async () => {
      toast.success("Commercial maintenance request raised.");
      await onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!placeId) next.place = "Choose the affected commercial space.";
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
      title="Raise commercial maintenance"
      description="Capture the affected space, priority and expected response deadline."
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <Field
          id="commercial-request-space"
          label="Commercial space"
          required
          error={errors.place}
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          id="commercial-request-title"
          label="Issue"
          required
          error={errors.title}
        >
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Suite 4A cooling failure"
            />
          )}
        </Field>
        <Field
          id="commercial-request-description"
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="commercial-request-category" label="Category">
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
          <Field id="commercial-request-priority" label="Priority">
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
          <Field id="commercial-request-due" label="Respond by">
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
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            Raise request
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
  request: CommercialMaintenanceRequest | null;
  contextKey: QueryContext;
  canManage: boolean;
  onClose: () => void;
  onUpdate: (
    body: Partial<
      Pick<
        CommercialMaintenanceRequest,
        "status" | "priority" | "assigned_to_party_id"
      >
    >,
  ) => void;
  saving: boolean;
}) {
  const [assignee, setAssignee] = useState<FacetItem | null>(null);
  if (!request) return null;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={request.title}
      description={`${request.place.name} · opened ${format(
        new Date(request.created_at),
        "d MMM yyyy",
      )}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={priorityTone(request.priority)}>
            {titleCase(request.priority)} priority
          </StatusBadge>
          <StatusBadge tone={maintenanceTone(request.status)}>
            {titleCase(request.status)}
          </StatusBadge>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">
          {request.description}
        </p>
        <dl className="grid grid-cols-2 gap-3 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-3 text-sm">
          <div>
            <dt className="text-xs text-[var(--vms-ink-muted)]">Raised by</dt>
            <dd className="mt-1 font-medium">
              {request.reported_by?.display_name || "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--vms-ink-muted)]">Assigned to</dt>
            <dd className="mt-1 font-medium">
              {request.assigned_to?.display_name || "Unassigned"}
            </dd>
          </div>
        </dl>
        {canManage && !["resolved", "closed"].includes(request.status) ? (
          <div className="space-y-4 border-t border-[var(--vms-line)] pt-4">
            <FacetPicker
              facet="parties"
              kind="person"
              label="Assign maintenance owner"
              value={assignee}
              contextKey={contextKey}
              onChange={setAssignee}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={saving || !assignee}
                onClick={() =>
                  assignee &&
                  onUpdate({
                    assigned_to_party_id: assignee.value,
                    status: "assigned",
                  })
                }
                isLoading={saving}
              >
                Assign
              </Button>
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => onUpdate({ status: "in_progress" })}
              >
                Start work
              </Button>
              <Button
                disabled={saving}
                onClick={() => onUpdate({ status: "resolved" })}
              >
                Mark resolved
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function priorityTone(priority: MaintenancePriority): StatusTone {
  return priority === "urgent"
    ? "danger"
    : priority === "high"
      ? "warning"
      : "neutral";
}

function maintenanceTone(status: MaintenanceStatus): StatusTone {
  return status === "resolved" || status === "closed"
    ? "success"
    : status === "in_progress"
      ? "info"
      : status === "assigned" || status === "triaged"
        ? "warning"
        : "neutral";
}

function SummaryStrip({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
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
