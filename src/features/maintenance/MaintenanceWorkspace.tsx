"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
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
  const [statusTarget, setStatusTarget] = useState<MaintenanceRequest | null>(
    null,
  );
  const tree = useQuery({
    queryKey: ["maintenance-property-tree"],
    queryFn: () => propertiesApi.tree(),
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
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: MaintenanceRequest["status"];
    }) => maintenanceApi.update(id, { status }),
    onSuccess: async () => {
      setStatusTarget(null);
      await client.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance status updated");
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
          disabled={item.status === "closed"}
          onClick={() => setStatusTarget(item)}
        >
          Update
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
      <StatusUpdateDialog
        request={statusTarget}
        workflow={experience.maintenance.workflow}
        pending={update.isPending}
        onClose={() => setStatusTarget(null)}
        onUpdate={(status) =>
          statusTarget && update.mutate({ id: statusTarget.id, status })
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

function StatusUpdateDialog({
  request,
  workflow,
  pending,
  onClose,
  onUpdate,
}: {
  request: MaintenanceRequest | null;
  workflow: string[];
  pending: boolean;
  onClose: () => void;
  onUpdate: (status: MaintenanceRequest["status"]) => void;
}) {
  const [status, setStatus] = useState<MaintenanceRequest["status"]>("open");
  if (!request) return null;
  return (
    <Modal isOpen onClose={onClose} title={`Update ${request.title}`}>
      <div className="space-y-4 p-5">
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
              {workflow.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="flex justify-end">
          <Button
            isLoading={pending}
            disabled={status === request.status}
            onClick={() => onUpdate(status)}
          >
            Save status
          </Button>
        </div>
      </div>
    </Modal>
  );
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
