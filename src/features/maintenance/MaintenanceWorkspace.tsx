"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { domainExperience, type DomainUseCase } from "@/config/domains";
import {
  propertiesApi,
  type PropertyTreeNode,
} from "@/features/properties/api";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import {
  maintenanceApi,
  type MaintenanceCreateInput,
  type MaintenanceRequest,
  type MaintenanceUpdateInput,
} from "./api";

const priorityTone = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
} as const;
const statusTone = {
  open: "warning",
  triaged: "info",
  assigned: "default",
  pending_approval: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "neutral",
} as const;

export function MaintenanceWorkspace({ domain }: { domain: DomainUseCase }) {
  const experience = domainExperience(domain)!;
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const client = useQueryClient();
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [activeRequest, setActiveRequest] =
    useState<MaintenanceRequest | null>(null);
  const tree = useQuery({
    queryKey: ["maintenance-property-tree"],
    queryFn: () =>
      selectedProperty?.id
        ? propertiesApi.tree(selectedProperty.id)
        : Promise.resolve([]),
    retry: false,
  });
  const spaces = useMemo(
    () => flatten(findProperty(tree.data ?? [], selectedProperty?.id)),
    [tree.data, selectedProperty?.id],
  );
  const query = useQuery({
    queryKey: [
      "maintenance",
      selectedProperty?.id,
      domain,
      filters,
      search,
      page,
    ],
    queryFn: () =>
      maintenanceApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        domain,
        status: filterValue(filters, "status"),
        priority: filterValue(filters, "priority"),
        category: filterValue(filters, "category"),
        place_id: filterValue(filters, "place"),
      }),
    enabled: !!selectedProperty?.id,
    retry: false,
  });
  const create = useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: async () => {
      setFormOpen(false);
      await client.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success(experience.terminology.maintenance + " created");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: MaintenanceUpdateInput }) =>
      maintenanceApi.update(id, body),
    onSuccess: async (updated) => {
      setActiveRequest(updated);
      await client.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance request updated");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: "Request",
      sortable: true,
      accessor: (item) => (
        <div className="min-w-44">
          <strong className="block text-sm">{item.title}</strong>
          <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
            {item.category.replaceAll("_", " ")}
          </span>
        </div>
      ),
    },
    {
      key: "place",
      header: "Space / zone",
      accessor: (item) => <span className="text-sm">{item.place.name}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (item) => (
        <Badge variant={priorityTone[item.priority]}>{item.priority}</Badge>
      ),
    },
    {
      key: "assigned_to",
      header: "Owner",
      accessor: (item) => (
        <span className="text-sm">{item.assigned_to?.display_name || "Unassigned"}</span>
      ),
      responsiveHide: "md",
    },
    {
      key: "status",
      header: "Status",
      accessor: (item) => (
        <Badge variant={statusTone[item.status]}>
          {item.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setActiveRequest(item)}
        >
          Review
        </Button>
      ),
    },
  ];

  if (!selectedProperty) {
    return (
      <main className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-6">
        Select a property workspace to manage maintenance.
      </main>
    );
  }

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow={`${experience.label} operations`}
        title={experience.terminology.maintenance}
        description="One shared maintenance lifecycle with domain-specific categories, priorities, assignments and operating rules."
        primaryAction={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New request
          </Button>
        }
      />
      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          tableLabel={`${experience.label} maintenance requests`}
          searchPlaceholder="Search request, space, category or status"
          initialSearch={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          serverSide
          total={query.data?.total ?? 0}
          currentPage={page}
          onPageChange={setPage}
          pageSize={20}
          availableFilters={[
            {
              field: "status",
              label: "Status",
              type: "select",
              options: experience.maintenance.workflow.map((status) => ({
                value: status,
                label: status.replaceAll("_", " "),
              })),
            },
            {
              field: "priority",
              label: "Priority",
              type: "select",
              options: ["low", "normal", "high", "urgent"].map((value) => ({
                value,
                label: value,
              })),
            },
            {
              field: "category",
              label: "Category",
              type: "select",
              options: experience.maintenance.categories.map((value) => ({
                value,
                label: value.replaceAll("_", " "),
              })),
            },
            {
              field: "place",
              label: "Space",
              type: "select",
              isSearchable: true,
              options: spaces.map((space) => ({
                value: space.id,
                label: space.name,
              })),
            },
          ]}
          initialFilters={filters}
          onFiltersChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          isLoading={query.isPending}
          errorMessage={
            query.isError ? parseApiError(query.error).message : undefined
          }
          onRetry={() => query.refetch()}
          emptyMessage="No maintenance requests match this property."
          mobileSummary={(item) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <strong>{item.title}</strong>
                <Badge variant={statusTone[item.status]}>
                  {item.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="text-sm">{item.place.name}</p>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {item.priority} priority ·{" "}
                {item.assigned_to?.display_name || "Unassigned"}
              </p>
            </div>
          )}
        />
      </section>

      <MaintenanceForm
        open={formOpen}
        domain={domain}
        propertyPlaceId={selectedProperty.id}
        spaces={spaces}
        pending={create.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(body) => create.mutate(body)}
      />
      <MaintenanceDetailDialog
        request={activeRequest}
        contextKey={selectedProperty.id}
        workflow={experience.maintenance.workflow}
        pending={update.isPending}
        onClose={() => setActiveRequest(null)}
        onUpdate={(body) =>
          activeRequest &&
          update.mutate({ id: activeRequest.id, body })
        }
      />
    </main>
  );
}

function MaintenanceForm({
  open,
  domain,
  propertyPlaceId,
  spaces,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  domain: DomainUseCase;
  propertyPlaceId: string;
  spaces: PropertyTreeNode[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (body: MaintenanceCreateInput) => void;
}) {
  const experience = domainExperience(domain)!;
  const [values, setValues] = useState({
    place_id: "",
    category: experience.maintenance.categories[0],
    title: "",
    description: "",
    priority: "normal" as MaintenanceRequest["priority"],
    request_type: "request" as MaintenanceRequest["request_type"],
  });
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.place_id || values.title.trim().length < 3) {
      setError("Choose a space and enter a request title.");
      return;
    }
    if (values.description.trim().length < 10) {
      setError("Describe the maintenance issue in at least 10 characters.");
      return;
    }
    setError("");
    onSubmit({
      property_place_id: propertyPlaceId,
      place_id: values.place_id,
      domain,
      request_type: values.request_type,
      category: values.category,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      requires_access_authorization:
        !!experience.maintenance.requires_access_authorization,
      affects_room_availability:
        !!experience.maintenance.affects_room_availability,
      expense_allocation_required:
        !!experience.maintenance.requires_expense_allocation,
    });
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`New ${experience.terminology.maintenance.toLowerCase()}`}
      description="This creates a record in the shared maintenance service."
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        {error ? (
          <p role="alert" className="text-sm text-[var(--vms-danger)]">
            {error}
          </p>
        ) : null}
        <Field id="maintenance-space" label="Space / zone" required>
          {(control) => (
            <select
              {...control}
              value={values.place_id}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  place_id: event.target.value,
                }))
              }
              className={fieldControlClassName}
            >
              <option value="">Select space</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="maintenance-category" label="Category">
            {(control) => (
              <select
                {...control}
                value={values.category}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className={fieldControlClassName}
              >
                {experience.maintenance.categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="maintenance-priority" label="Priority">
            {(control) => (
              <select
                {...control}
                value={values.priority}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    priority: event.target.value as MaintenanceRequest["priority"],
                  }))
                }
                className={fieldControlClassName}
              >
                {["low", "normal", "high", "urgent"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field id="maintenance-title" label="Title" required>
          {(control) => (
            <input
              {...control}
              value={values.title}
              maxLength={180}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className={fieldControlClassName}
            />
          )}
        </Field>
        <Field id="maintenance-description" label="Description" required>
          {(control) => (
            <textarea
              {...control}
              value={values.description}
              maxLength={10000}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={fieldControlClassName}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" isLoading={pending}>
            <Wrench className="h-4 w-4" />
            Create request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MaintenanceDetailDialog({
  request,
  contextKey,
  workflow,
  pending,
  onClose,
  onUpdate,
}: {
  request: MaintenanceRequest | null;
  contextKey: string;
  workflow: string[];
  pending: boolean;
  onClose: () => void;
  onUpdate: (body: MaintenanceUpdateInput) => void;
}) {
  const detail = useQuery({
    queryKey: ["maintenance", "detail", request?.id],
    queryFn: () => maintenanceApi.get(request!.id),
    enabled: !!request,
  });
  const current = detail.data ?? request;
  const [status, setStatus] = useState<MaintenanceRequest["status"]>("open");
  const [priority, setPriority] =
    useState<MaintenanceRequest["priority"]>("normal");
  const [approvalStatus, setApprovalStatus] =
    useState<MaintenanceRequest["approval_status"]>("not_required");
  const [assignee, setAssignee] = useState<FacetItem | null>(null);
  const [contractor, setContractor] = useState<FacetItem | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [costEstimate, setCostEstimate] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!current) return;
    setStatus(current.status);
    setPriority(current.priority);
    setApprovalStatus(current.approval_status);
    setAssignee(
      current.assigned_to
        ? {
            value: current.assigned_to.id,
            label: current.assigned_to.display_name,
            disabled: false,
            meta: { kind: "person", user_linked: false },
          }
        : null,
    );
    setContractor(
      current.contractor
        ? {
            value: current.contractor.id,
            label: current.contractor.display_name,
            disabled: false,
            meta: { kind: "person", user_linked: false },
          }
        : null,
    );
    setScheduledFor(toDateTimeInput(current.scheduled_for));
    setDueAt(toDateTimeInput(current.due_at));
    setCostEstimate(current.cost_estimate ?? "");
    setActualCost(current.actual_cost ?? "");
    setResolutionNotes(current.resolution_notes ?? "");
    setComment("");
    setError("");
  }, [current?.id, current?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!request) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!current) return;
    if (status === "assigned" && !assignee) {
      setError("Assigned work requires an assignee.");
      return;
    }
    if (
      ["resolved", "closed"].includes(status) &&
      resolutionNotes.trim().length < 3
    ) {
      setError("Record the resolution before resolving or closing the request.");
      return;
    }

    const body: MaintenanceUpdateInput = {};
    if (status !== current.status) body.status = status;
    if (priority !== current.priority) body.priority = priority;
    if (approvalStatus !== current.approval_status) {
      body.approval_status = approvalStatus;
    }
    if ((assignee?.value || null) !== (current.assigned_to?.id || null)) {
      body.assigned_to_party_id = assignee?.value || null;
    }
    if ((contractor?.value || null) !== (current.contractor?.id || null)) {
      body.contractor_party_id = contractor?.value || null;
    }
    if (scheduledFor !== toDateTimeInput(current.scheduled_for)) {
      body.scheduled_for = scheduledFor
        ? new Date(scheduledFor).toISOString()
        : null;
    }
    if (dueAt !== toDateTimeInput(current.due_at)) {
      body.due_at = dueAt ? new Date(dueAt).toISOString() : null;
    }
    if (costEstimate !== (current.cost_estimate ?? "")) {
      body.cost_estimate = costEstimate || null;
    }
    if (actualCost !== (current.actual_cost ?? "")) {
      body.actual_cost = actualCost || null;
    }
    if (resolutionNotes.trim() !== (current.resolution_notes ?? "")) {
      body.resolution_notes = resolutionNotes.trim() || null;
    }
    if (comment.trim()) body.comment = comment.trim();
    if (!Object.keys(body).length) {
      setError("Change a field or add a comment before saving.");
      return;
    }
    setError("");
    onUpdate(body);
  }

  const activities = current?.activities ?? [];
  const availableStatuses = workflow.filter(
    (candidate) =>
      candidate === current?.status ||
      (current ? transitionAllows(current.status, candidate) : true),
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={request.title}
      description={`${request.place.name} · ${request.category.replaceAll("_", " ")}`}
      size="lg"
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--vms-ink-muted)]">
            {request.description}
          </p>
          {detail.isPending ? (
            <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
              Loading assignment and activity…
            </p>
          ) : null}
          {detail.isError ? (
            <div
              role="alert"
              className="rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
            >
              Activity could not be loaded.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => detail.refetch()}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field id="maintenance-status" label="Workflow status">
            {(control) => (
              <select
                {...control}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as MaintenanceRequest["status"])
                }
                className={fieldControlClassName}
              >
                {availableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="maintenance-priority" label="Priority">
            {(control) => (
              <select
                {...control}
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as MaintenanceRequest["priority"],
                  )
                }
                className={fieldControlClassName}
              >
                {["low", "normal", "high", "urgent"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="maintenance-scheduled" label="Scheduled visit">
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field id="maintenance-due" label="Respond by">
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
        </section>

        <section className="grid gap-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-4 sm:grid-cols-2">
          <FacetPicker
            facet="parties"
            kind="person"
            label="Assigned operator"
            value={assignee}
            onChange={setAssignee}
            contextKey={contextKey}
            description="The staff member accountable for progressing the work."
          />
          <FacetPicker
            facet="parties"
            kind="person"
            label="Contractor or vendor"
            value={contractor}
            onChange={setContractor}
            contextKey={contextKey}
            description="The external Party performing work, when applicable."
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Field id="maintenance-estimate" label="Cost estimate">
            {(control) => (
              <input
                {...control}
                type="number"
                min="0"
                step="0.01"
                value={costEstimate}
                onChange={(event) => setCostEstimate(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field id="maintenance-actual" label="Actual cost">
            {(control) => (
              <input
                {...control}
                type="number"
                min="0"
                step="0.01"
                value={actualCost}
                onChange={(event) => setActualCost(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field id="maintenance-approval" label="Cost approval">
            {(control) => (
              <select
                {...control}
                value={approvalStatus}
                onChange={(event) =>
                  setApprovalStatus(
                    event.target
                      .value as MaintenanceRequest["approval_status"],
                  )
                }
                className={fieldControlClassName}
              >
                {["not_required", "pending", "approved", "rejected"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ),
                )}
              </select>
            )}
          </Field>
        </section>

        <Field id="maintenance-resolution" label="Resolution notes">
          {(control) => (
            <textarea
              {...control}
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              className={`${fieldControlClassName} min-h-24 py-2`}
              placeholder="Record the completed work, parts used and resident confirmation."
            />
          )}
        </Field>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Activity
          </h3>
          {activities.length ? (
            <ol className="mt-3 space-y-3">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-xs uppercase tracking-[0.08em]">
                      {activity.event_type.replaceAll("_", " ")}
                    </strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      {formatTimestamp(activity.occurred_at)}
                    </span>
                  </div>
                  {activity.message ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {activity.message}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {activity.actor_site_admin?.display_name ||
                      activity.actor_site_admin?.email ||
                      activity.actor?.display_name ||
                      "System"}
                  </p>
                </li>
              ))}
            </ol>
          ) : detail.isSuccess ? (
            <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
              No activity has been recorded yet.
            </p>
          ) : null}
        </section>

        <Field id="maintenance-comment" label="Add a comment">
          {(control) => (
            <textarea
              {...control}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className={`${fieldControlClassName} min-h-20 py-2`}
              placeholder="Share an update with the operations team."
            />
          )}
        </Field>

        {error ? (
          <p role="alert" className="text-sm text-[var(--vms-danger)]">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" isLoading={pending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const allowedTransitions: Record<
  MaintenanceRequest["status"],
  MaintenanceRequest["status"][]
> = {
  open: [
    "triaged",
    "assigned",
    "pending_approval",
    "in_progress",
    "resolved",
    "closed",
  ],
  triaged: ["assigned", "pending_approval", "in_progress", "resolved", "closed"],
  assigned: ["pending_approval", "in_progress", "resolved", "closed"],
  pending_approval: ["assigned", "in_progress", "resolved", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

function transitionAllows(
  current: MaintenanceRequest["status"],
  candidate: string,
) {
  return allowedTransitions[current].includes(
    candidate as MaintenanceRequest["status"],
  );
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function findProperty(
  nodes: PropertyTreeNode[],
  id?: string,
): PropertyTreeNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findProperty(node.children, id);
    if (child) return child;
  }
  return null;
}

function flatten(node: PropertyTreeNode | null): PropertyTreeNode[] {
  if (!node) return [];
  return [node, ...node.children.flatMap(flatten)];
}

function filterValue(filters: FilterConfig[], field: string) {
  return filters.find((filter) => filter.field === field)?.value as
    | string
    | undefined;
}
