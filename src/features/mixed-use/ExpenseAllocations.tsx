"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Scale,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import {
  propertiesApi,
  type PropertyTreeNode,
} from "@/features/properties/api";
import { useAppStore } from "@/store/app-store";
import {
  mixedUseApi,
  type AllocationStatus,
  type AllocationUseCase,
  type ExpenseAllocation,
  type ExpenseAllocationInput,
} from "./api";
import { MixedUseShell, useMixedUseAccess } from "./MixedUseShell";

const useCaseLabels: Array<{ value: AllocationUseCase; label: string }> = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "hospitality", label: "Hospitality" },
  { value: "shared", label: "Shared" },
];

type ShareDraft = {
  use_case: AllocationUseCase;
  label: string;
  target_place_id: string;
  percentage: string;
};

type AllocationForm = {
  title: string;
  description: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  shares: ShareDraft[];
};

function initialForm(): AllocationForm {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + 3);
  return {
    title: "",
    description: "",
    period_start: dateInput(today),
    period_end: dateInput(end),
    total_amount: "",
    currency: "NGN",
    shares: [
      {
        use_case: "residential",
        label: "Residential",
        target_place_id: "",
        percentage: "50",
      },
      {
        use_case: "commercial",
        label: "Commercial",
        target_place_id: "",
        percentage: "50",
      },
    ],
  };
}

function dateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function flattenTree(nodes: PropertyTreeNode[]): PropertyTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

function selectedTree(
  nodes: PropertyTreeNode[],
  selectedId: string,
): PropertyTreeNode | null {
  for (const node of nodes) {
    if (node.id === selectedId) return node;
    const child = selectedTree(node.children, selectedId);
    if (child) return child;
  }
  return null;
}

function money(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function ExpenseAllocations() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const context = useMixedUseAccess();
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AllocationForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ["mixed-use-expense-allocations", selectedProperty?.id],
    queryFn: () =>
      mixedUseApi.listAllocations(selectedProperty!.id, {
        page: 1,
        page_size: 100,
      }),
    enabled: !!selectedProperty?.id,
    retry: false,
  });
  const tree = useQuery({
    queryKey: ["property-tree", "mixed-use-expenses"],
    queryFn: () => propertiesApi.tree(),
    enabled: !!selectedProperty?.id,
    retry: false,
  });

  const rows = query.data?.items ?? [];
  const totalAllocated = rows.reduce(
    (total, allocation) => total + Number(allocation.total_amount),
    0,
  );
  const approvedTotal = rows
    .filter((allocation) => allocation.status === "approved")
    .reduce((total, allocation) => total + Number(allocation.total_amount), 0);
  const draftCount = rows.filter(
    (allocation) => allocation.status === "draft",
  ).length;
  const percentageTotal = form.shares.reduce(
    (total, share) => total + (Number(share.percentage) || 0),
    0,
  );
  const allocationAmount = Number(form.total_amount) || 0;
  const targetOptions = useMemo(() => {
    if (!tree.data || !selectedProperty) return [];
    const root = selectedTree(tree.data, selectedProperty.id);
    if (!root) return [];
    return flattenTree(root.children).filter((place) => place.is_active);
  }, [selectedProperty, tree.data]);

  const create = useMutation({
    mutationFn: (input: ExpenseAllocationInput) => {
      if (!selectedProperty) throw new Error("Select a property first");
      return mixedUseApi.createAllocation(selectedProperty.id, input);
    },
    onSuccess: () => {
      toast.success("Expense allocation created as a draft.");
      setFormOpen(false);
      setForm(initialForm());
      setFormError(null);
      void client.invalidateQueries({
        queryKey: ["mixed-use-expense-allocations"],
      });
    },
    onError: (error) => setFormError(parseApiError(error).message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({
      allocation,
      action,
    }: {
      allocation: ExpenseAllocation;
      action: "approve" | "archive";
    }) => {
      if (!selectedProperty) throw new Error("Select a property first");
      return action === "approve"
        ? mixedUseApi.approveAllocation(selectedProperty.id, allocation.id)
        : mixedUseApi.archiveAllocation(selectedProperty.id, allocation.id);
    },
    onSuccess: () => {
      toast.success("Allocation status updated.");
      void client.invalidateQueries({
        queryKey: ["mixed-use-expense-allocations"],
      });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const bulkActions: BulkAction[] = context.canManageExpenses
    ? [
        {
          label: "Approve drafts",
          icon: CheckCircle2,
          onClick: (ids) => {
            rows
              .filter(
                (allocation) =>
                  ids.includes(allocation.id) && allocation.status === "draft",
              )
              .forEach((allocation) =>
                changeStatus.mutate({ allocation, action: "approve" }),
              );
          },
        },
        {
          label: "Archive approved",
          variant: "outline",
          onClick: (ids) => {
            rows
              .filter(
                (allocation) =>
                  ids.includes(allocation.id) &&
                  allocation.status === "approved",
              )
              .forEach((allocation) =>
                changeStatus.mutate({ allocation, action: "archive" }),
              );
          },
        },
      ]
    : [];

  const columns: Column<ExpenseAllocation>[] = [
    {
      key: "title",
      header: "Shared expense",
      sortable: true,
      accessor: (allocation) => (
        <div className="min-w-56">
          <p className="font-semibold">{allocation.title}</p>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
            {allocation.description || "No allocation note."}
          </p>
        </div>
      ),
    },
    {
      key: "period_start",
      header: "Period",
      sortable: true,
      accessor: (allocation) => (
        <span className="whitespace-nowrap text-xs">
          {new Date(`${allocation.period_start}T12:00:00`).toLocaleDateString()}
          {" – "}
          {new Date(`${allocation.period_end}T12:00:00`).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      sortable: true,
      accessor: (allocation) =>
        money(allocation.total_amount, allocation.currency),
    },
    {
      key: "shares",
      header: "Allocation",
      sortable: false,
      accessor: (allocation) => (
        <div className="flex max-w-sm flex-wrap gap-1.5">
          {allocation.shares.map((share) => (
            <span
              key={share.id}
              className="rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-2 py-1 text-[11px] font-medium"
            >
              {share.label} · {Number(share.percentage).toFixed(0)}%
            </span>
          ))}
        </div>
      ),
      responsiveHide: "lg",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (allocation) => <StatusLabel status={allocation.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      accessor: (allocation) =>
        context.canManageExpenses && allocation.status !== "archived" ? (
          <Button
            size="sm"
            variant={allocation.status === "draft" ? "primary" : "outline"}
            disabled={changeStatus.isPending}
            onClick={() =>
              changeStatus.mutate({
                allocation,
                action: allocation.status === "draft" ? "approve" : "archive",
              })
            }
          >
            {allocation.status === "draft" ? "Approve" : "Archive"}
          </Button>
        ) : null,
    },
  ];

  function openForm() {
    setForm(initialForm());
    setFormError(null);
    setFormOpen(true);
  }

  function updateShare(index: number, changes: Partial<ShareDraft>) {
    setForm((current) => ({
      ...current,
      shares: current.shares.map((share, shareIndex) =>
        shareIndex === index ? { ...share, ...changes } : share,
      ),
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setFormError("Enter an expense title.");
      return;
    }
    if (!form.period_start || !form.period_end) {
      setFormError("Choose the expense period.");
      return;
    }
    if (form.period_end < form.period_start) {
      setFormError("The period end must be on or after its start.");
      return;
    }
    if (!allocationAmount || allocationAmount <= 0) {
      setFormError("Enter a total amount greater than zero.");
      return;
    }
    if (Math.abs(percentageTotal - 100) > 0.001) {
      setFormError("Allocation percentages must total exactly 100.");
      return;
    }
    if (form.shares.some((share) => !share.label.trim())) {
      setFormError("Give every allocation share a label.");
      return;
    }
    setFormError(null);
    create.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      period_start: form.period_start,
      period_end: form.period_end,
      total_amount: allocationAmount.toFixed(2),
      currency: form.currency,
      shares: form.shares.map((share) => ({
        use_case: share.use_case,
        label: share.label.trim(),
        target_place_id: share.target_place_id || null,
        percentage: Number(share.percentage).toFixed(2),
      })),
    });
  }

  return (
    <MixedUseShell
      title="Expense allocation"
      description="Allocate shared operating costs across residential, commercial, hospitality and common areas before consolidation into property charges."
      primaryAction={
        context.canManageExpenses ? (
          <Button onClick={openForm}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New allocation
          </Button>
        ) : undefined
      }
    >
      <section
        aria-label="Expense allocation summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        <Summary
          label="Allocated in view"
          value={money(totalAllocated.toFixed(2), "NGN")}
          icon={Scale}
        />
        <Summary
          label="Approved"
          value={money(approvedTotal.toFixed(2), "NGN")}
          icon={CircleDollarSign}
        />
        <Summary label="Drafts" value={String(draftCount)} icon={ReceiptText} />
      </section>

      {query.isError && query.data ? (
        <InlineAlert
          tone="warning"
          title="Showing the last available allocation register"
          action={
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          }
        >
          {parseApiError(query.error).message}
        </InlineAlert>
      ) : null}

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(allocation) => allocation.id}
          selectable={context.canManageExpenses}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          bulkActions={bulkActions}
          availableFilters={[
            {
              field: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "draft", label: "Draft" },
                { value: "approved", label: "Approved" },
                { value: "archived", label: "Archived" },
              ],
            },
          ]}
          initialSort="period_start"
          searchPlaceholder="Search shared expenses"
          emptyMessage="No shared expense allocations have been recorded."
          isLoading={query.isPending}
          isStale={query.isError && !!query.data}
          onRetry={() => query.refetch()}
          tableLabel="Shared expense allocations"
          scrollHint="Scroll horizontally to compare allocation periods and shares."
          mobileSummary={(allocation) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{allocation.title}</p>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {allocation.period_start} to {allocation.period_end}
                  </p>
                </div>
                <StatusLabel status={allocation.status} />
              </div>
              <p className="text-sm font-semibold">
                {money(allocation.total_amount, allocation.currency)}
              </p>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {allocation.shares
                  .map(
                    (share) =>
                      `${share.label} ${Number(share.percentage).toFixed(0)}%`,
                  )
                  .join(" · ")}
              </p>
            </div>
          )}
        />
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!create.isPending) setFormOpen(false);
        }}
        title="New shared expense allocation"
        description="Create a draft allocation, review domain shares, then approve it for the property."
        size="xl"
      >
        <form className="space-y-5" onSubmit={submit} noValidate>
          {formError ? (
            <InlineAlert tone="danger" title="Allocation was not created">
              {formError}
            </InlineAlert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Expense title</span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
                placeholder="Shared security and landscaping"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Period start</span>
              <input
                type="date"
                value={form.period_start}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    period_start: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Period end</span>
              <input
                type="date"
                min={form.period_start}
                value={form.period_end}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    period_end: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Total amount</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.total_amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    total_amount: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
                placeholder="120000.00"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Currency</span>
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.currentTarget.value,
                  }))
                }
                className={fieldClass}
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.currentTarget.value,
                  }))
                }
                className={`${fieldClass} min-h-20 py-3`}
                placeholder="What the shared expense covers."
              />
            </label>
          </div>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-semibold">Allocation shares</h3>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                  Percentages must total 100. Targets must belong to this
                  property.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    shares: [
                      ...current.shares,
                      {
                        use_case: "shared",
                        label: "Shared area",
                        target_place_id: "",
                        percentage: "0",
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add share
              </Button>
            </div>
            <div className="space-y-3">
              {form.shares.map((share, index) => (
                <div
                  key={`${index}:${share.use_case}`}
                  className="grid gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3 sm:grid-cols-[1fr_1fr_1fr_110px_auto]"
                >
                  <label className="space-y-1 text-xs font-medium">
                    <span>Domain</span>
                    <select
                      value={share.use_case}
                      onChange={(event) =>
                        updateShare(index, {
                          use_case: event.currentTarget
                            .value as AllocationUseCase,
                        })
                      }
                      className={fieldClass}
                    >
                      {useCaseLabels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium">
                    <span>Share label</span>
                    <input
                      value={share.label}
                      onChange={(event) =>
                        updateShare(index, {
                          label: event.currentTarget.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium">
                    <span>Target property</span>
                    <select
                      value={share.target_place_id}
                      onChange={(event) =>
                        updateShare(index, {
                          target_place_id: event.currentTarget.value,
                        })
                      }
                      className={fieldClass}
                    >
                      <option value="">No specific property</option>
                      {targetOptions.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium">
                    <span>Percent</span>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      value={share.percentage}
                      onChange={(event) =>
                        updateShare(index, {
                          percentage: event.currentTarget.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <div className="flex items-end justify-between gap-2 sm:block">
                    <p className="pb-2 text-xs font-semibold sm:pb-0">
                      {money(
                        (
                          allocationAmount *
                          ((Number(share.percentage) || 0) / 100)
                        ).toFixed(2),
                        form.currency,
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${share.label || "share"}`}
                      disabled={form.shares.length === 1}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          shares: current.shares.filter(
                            (_, shareIndex) => shareIndex !== index,
                          ),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p
              className={
                Math.abs(percentageTotal - 100) > 0.001
                  ? "mt-3 text-sm font-semibold text-[var(--vms-danger)]"
                  : "mt-3 text-sm font-semibold text-[var(--vms-success)]"
              }
            >
              Allocated: {percentageTotal.toFixed(2)}%
            </p>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--vms-line)] pt-4">
            <Button
              variant="secondary"
              disabled={create.isPending}
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={create.isPending}
              loadingLabel="Creating…"
            >
              Create draft
            </Button>
          </div>
        </form>
      </Modal>
    </MixedUseShell>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base outline-none focus:border-[var(--vms-ink)] focus:ring-2 focus:ring-[var(--vms-focus)] sm:text-sm";

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Scale;
}) {
  return (
    <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
      <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden="true" />
      <p className="mt-3 text-xs font-medium text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function StatusLabel({ status }: { status: AllocationStatus }) {
  const tone =
    status === "approved"
      ? "text-[var(--vms-success)]"
      : status === "archived"
        ? "text-[var(--vms-ink-muted)]"
        : "text-[var(--vms-warning)]";
  return (
    <span className={`text-xs font-semibold capitalize ${tone}`}>{status}</span>
  );
}
