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
import { fieldControlClassName } from "@/components/ui/form/Field";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import { formatMoneyWithCode } from "@/lib/currency";
import {
  placeKinds,
  placesApi,
  type PlaceTreeNode,
} from "@/features/places/api";
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
    shares: [],
  };
}

function dateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function flattenTree(nodes: PlaceTreeNode[]): PlaceTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

function selectedTree(
  nodes: PlaceTreeNode[],
  selectedId: string,
): PlaceTreeNode | null {
  for (const node of nodes) {
    if (node.id === selectedId) return node;
    const child = selectedTree(node.children, selectedId);
    if (child) return child;
  }
  return null;
}

export function ExpenseAllocations() {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const context = useMixedUseAccess();
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AllocationForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [reviewAllocations, setReviewAllocations] = useState<
    ExpenseAllocation[]
  >([]);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["mixed-use-expense-allocations", selectedSite?.id],
    queryFn: () =>
      mixedUseApi.listAllocations(selectedSite!.id, {
        page: 1,
        page_size: 100,
      }),
    enabled: !!selectedSite?.id,
    retry: false,
  });
  const tree = useQuery({
    queryKey: ["property-tree", "mixed-use-expenses", selectedSite?.id],
    queryFn: () =>
      selectedSite?.id ? placesApi.tree(selectedSite.id) : Promise.resolve([]),
    enabled: !!selectedSite?.id,
    retry: false,
  });

  const rows = query.data?.items ?? [];
  const totalsByCurrency = (allocations: ExpenseAllocation[]) =>
    Object.entries(
      allocations.reduce<Record<string, number>>((totals, allocation) => {
        totals[allocation.currency] =
          (totals[allocation.currency] ?? 0) + Number(allocation.total_amount);
        return totals;
      }, {}),
    ).map(([currency, amount]) => formatMoneyWithCode(amount, currency));
  const totalAllocated = totalsByCurrency(rows);
  const approvedTotal = totalsByCurrency(
    rows.filter((allocation) => allocation.status === "approved"),
  );
  const draftCount = rows.filter(
    (allocation) => allocation.status === "draft",
  ).length;
  const percentageTotal = form.shares.reduce(
    (total, share) => total + (Number(share.percentage) || 0),
    0,
  );
  const percentageRemaining = 100 - percentageTotal;
  const sharesComplete =
    form.shares.length > 0 &&
    form.shares.every(
      (share) =>
        share.label.trim() &&
        share.percentage.trim() &&
        Number(share.percentage) > 0 &&
        Number(share.percentage) <= 100,
    ) &&
    Math.abs(percentageRemaining) <= 0.001;
  const allocationAmount = Number(form.total_amount) || 0;
  const targetOptions = useMemo(() => {
    if (!tree.data || !selectedSite) return [];
    const root = selectedTree(tree.data, selectedSite.id);
    if (!root) return [];
    return flattenTree(root.children).filter((place) => place.is_active);
  }, [selectedSite, tree.data]);

  const create = useMutation({
    mutationFn: (input: ExpenseAllocationInput) => {
      if (!selectedSite) throw new Error("Select a property first");
      return mixedUseApi.createAllocation(selectedSite.id, input);
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

  const archive = useMutation({
    mutationFn: async (allocation: ExpenseAllocation) => {
      if (!selectedSite) throw new Error("Select a property first");
      return mixedUseApi.archiveAllocation(selectedSite.id, allocation.id);
    },
    onSuccess: () => {
      toast.success("Allocation archived.");
      void client.invalidateQueries({
        queryKey: ["mixed-use-expense-allocations"],
      });
      void client.invalidateQueries({
        queryKey: ["mixed-use-overview-allocations"],
      });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const approve = useMutation({
    mutationFn: async (allocations: ExpenseAllocation[]) => {
      if (!selectedSite) throw new Error("Select a property first");
      const results = await Promise.allSettled(
        allocations.map((allocation) =>
          mixedUseApi.approveAllocation(selectedSite.id, allocation.id),
        ),
      );
      return {
        approved: results.filter((result) => result.status === "fulfilled")
          .length,
        failed: allocations.filter(
          (_, index) => results[index].status === "rejected",
        ),
        firstError: results.find((result) => result.status === "rejected"),
      };
    },
    onSuccess: ({ approved, failed, firstError }) => {
      if (approved)
        toast.success(
          `${approved} allocation${approved === 1 ? "" : "s"} approved.`,
        );
      if (failed.length) {
        setReviewAllocations(failed);
        setReviewError(
          firstError?.status === "rejected"
            ? parseApiError(firstError.reason).message
            : "Some allocations could not be approved. Review and retry.",
        );
      } else {
        setReviewAllocations([]);
        setReviewError(null);
        setSelectedRows(new Set());
      }
      void client.invalidateQueries({
        queryKey: ["mixed-use-expense-allocations"],
      });
      void client.invalidateQueries({
        queryKey: ["mixed-use-overview-allocations"],
      });
    },
    onError: (error) => setReviewError(parseApiError(error).message),
  });

  function openReview(allocations: ExpenseAllocation[]) {
    if (!allocations.length) return;
    setReviewError(null);
    setReviewAllocations(allocations);
  }

  const bulkActions: BulkAction[] = context.canManageExpenses
    ? [
        {
          label: "Review drafts",
          icon: CheckCircle2,
          onClick: (ids) => {
            openReview(
              rows.filter(
                (allocation) =>
                  ids.includes(allocation.id) && allocation.status === "draft",
              ),
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
              .forEach((allocation) => archive.mutate(allocation));
          },
        },
      ]
    : [];

  const columns: Column<ExpenseAllocation>[] = [
    {
      key: "title",
      header: "Shared expense",
      sortable: true,
      minWidth: 230,
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
      minWidth: 175,
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
      minWidth: 128,
      className: "text-right tabular-nums",
      accessor: (allocation) =>
        formatMoneyWithCode(allocation.total_amount, allocation.currency),
    },
    {
      key: "shares",
      header: "Allocation",
      sortable: false,
      minWidth: 220,
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
      minWidth: 100,
      accessor: (allocation) => <StatusLabel status={allocation.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      minWidth: 112,
      accessor: (allocation) =>
        context.canManageExpenses && allocation.status !== "archived" ? (
          <Button
            size="sm"
            variant={allocation.status === "draft" ? "primary" : "outline"}
            disabled={approve.isPending || archive.isPending}
            onClick={() =>
              allocation.status === "draft"
                ? openReview([allocation])
                : archive.mutate(allocation)
            }
          >
            {allocation.status === "draft" ? "Review" : "Archive"}
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
    if (!form.shares.length) {
      setFormError("Add at least one domain share before creating the draft.");
      return;
    }
    if (
      form.shares.some(
        (share) =>
          !share.percentage.trim() ||
          Number(share.percentage) <= 0 ||
          Number(share.percentage) > 100,
      )
    ) {
      setFormError("Enter a percentage above 0 and up to 100 for every share.");
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
          label="Recorded in view"
          values={totalAllocated}
          icon={Scale}
        />
        <Summary
          label="Approved"
          values={approvedTotal}
          icon={CircleDollarSign}
        />
        <Summary
          label="Drafts"
          values={[String(draftCount)]}
          icon={ReceiptText}
        />
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
                {formatMoneyWithCode(allocation.total_amount, allocation.currency)}
              </p>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {allocation.shares
                  .map(
                    (share) =>
                      `${share.label} ${Number(share.percentage).toFixed(0)}%`,
                  )
                  .join(" · ")}
              </p>
              {context.canManageExpenses && allocation.status !== "archived" ? (
                <Button
                  size="sm"
                  variant={
                    allocation.status === "draft" ? "primary" : "outline"
                  }
                  disabled={approve.isPending || archive.isPending}
                  onClick={() =>
                    allocation.status === "draft"
                      ? openReview([allocation])
                      : archive.mutate(allocation)
                  }
                >
                  {allocation.status === "draft"
                    ? "Review allocation"
                    : "Archive"}
                </Button>
              ) : null}
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
        size="lg"
        className="sm:max-w-[880px]"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={create.isPending}
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-shared-expense-form"
              disabled={!sharesComplete}
              isLoading={create.isPending}
              loadingLabel="Creating…"
            >
              Create draft
            </Button>
          </div>
        }
      >
        <form
          id="new-shared-expense-form"
          className="space-y-5"
          onSubmit={submit}
          noValidate
        >
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
                  Add the domains that share this cost. Choose a specific Place
                  only when the share applies to that Place.
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
                        use_case: "residential",
                        label: "Residential",
                        target_place_id: "",
                        percentage: "",
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add domain share
              </Button>
            </div>
            {form.shares.length === 0 ? (
              <div className="rounded-[var(--vms-radius-control)] border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface-subtle)] px-4 py-5 text-sm text-[var(--vms-ink-muted)]">
                No shares yet. Add a domain share, set its scope and percentage,
                then bring the total to 100%.
              </div>
            ) : null}
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
                      onChange={(event) => {
                        const nextUseCase = event.currentTarget
                          .value as AllocationUseCase;
                        const previousLabel = useCaseLabels.find(
                          (option) => option.value === share.use_case,
                        )?.label;
                        updateShare(index, {
                          use_case: nextUseCase,
                          label:
                            share.label === previousLabel
                              ? (useCaseLabels.find(
                                  (option) => option.value === nextUseCase,
                                )?.label ?? share.label)
                              : share.label,
                        });
                      }}
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
                    <span>Target scope</span>
                    <select
                      value={share.target_place_id}
                      onChange={(event) =>
                        updateShare(index, {
                          target_place_id: event.currentTarget.value,
                        })
                      }
                      className={fieldClass}
                    >
                      <option value="">Entire Site</option>
                      {targetOptions.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name} · {placeKinds[place.kind]}
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
                      {formatMoneyWithCode(
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
            <div
              role="status"
              className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--vms-radius-control)] border px-3 py-2 text-sm ${
                sharesComplete
                  ? "border-[var(--vms-success)] text-[var(--vms-success)]"
                  : "border-[var(--vms-line)] text-[var(--vms-ink)]"
              }`}
            >
              <span className="font-semibold">
                Allocated {percentageTotal.toFixed(2)}% of 100%
              </span>
              <span>
                {sharesComplete
                  ? "Ready to create draft"
                  : percentageRemaining >= 0
                    ? `${percentageRemaining.toFixed(2)}% remaining`
                    : `${Math.abs(percentageRemaining).toFixed(2)}% over`}
              </span>
            </div>
          </section>
        </form>
      </Modal>

      <Modal
        isOpen={reviewAllocations.length > 0}
        onClose={() => {
          if (!approve.isPending) setReviewAllocations([]);
        }}
        title={
          reviewAllocations.length <= 1
            ? "Review expense allocation"
            : `Review ${reviewAllocations.length} expense allocations`
        }
        description="Check each expense, period, currency, target scope and domain share before approval. Approval makes the allocation available for property charges."
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              disabled={approve.isPending}
              onClick={() => setReviewAllocations([])}
            >
              Keep as draft
            </Button>
            <Button
              disabled={reviewAllocations.some(
                (allocation) =>
                  !allocation.shares.length ||
                  allocation.shares.some(
                    (share) =>
                      !Number.isFinite(Number(share.percentage)) ||
                      Number(share.percentage) <= 0,
                  ) ||
                  Math.abs(
                    allocation.shares.reduce(
                      (total, share) => total + Number(share.percentage),
                      0,
                    ) - 100,
                  ) > 0.001,
              )}
              isLoading={approve.isPending}
              loadingLabel="Approving…"
              onClick={() => approve.mutate(reviewAllocations)}
            >
              Approve{" "}
              {reviewAllocations.length === 1
                ? "allocation"
                : `${reviewAllocations.length} allocations`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {reviewError ? (
            <InlineAlert tone="danger" title="Approval was not completed">
              {reviewError}
            </InlineAlert>
          ) : null}
          {reviewAllocations.map((allocation) => {
            const total = allocation.shares.reduce(
              (sum, share) => sum + Number(share.percentage),
              0,
            );
            return (
              <section
                key={allocation.id}
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{allocation.title}</h3>
                    {allocation.description ? (
                      <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                        {allocation.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                      {allocation.period_start} to {allocation.period_end} ·{" "}
                      {selectedSite?.name}
                    </p>
                  </div>
                  <p className="text-base font-semibold">
                    {formatMoneyWithCode(allocation.total_amount, allocation.currency)}
                  </p>
                </div>
                <div className="mt-4 divide-y divide-[var(--vms-line)] border-y border-[var(--vms-line)]">
                  {allocation.shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{share.label}</p>
                        <p className="text-xs text-[var(--vms-ink-muted)]">
                          {useCaseLabels.find(
                            (option) => option.value === share.use_case,
                          )?.label ?? share.use_case}
                          {" · "}
                          {share.target_place_id
                            ? (targetOptions.find(
                                (place) => place.id === share.target_place_id,
                              )?.name ?? "Specific Place")
                            : "Entire Site"}
                        </p>
                      </div>
                      <p className="font-medium tabular-nums">
                        {Number(share.percentage).toFixed(2)}% ·{" "}
                        {formatMoneyWithCode(share.amount, allocation.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <p
                  className={`mt-3 text-sm font-semibold ${Math.abs(total - 100) <= 0.001 ? "text-[var(--vms-success)]" : "text-[var(--vms-danger)]"}`}
                >
                  Total allocated: {total.toFixed(2)}% of 100%
                </p>
              </section>
            );
          })}
        </div>
      </Modal>
    </MixedUseShell>
  );
}

const fieldClass = fieldControlClassName;

function Summary({
  label,
  values,
  icon: Icon,
}: {
  label: string;
  values: string[];
  icon: typeof Scale;
}) {
  return (
    <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
      <Icon className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden="true" />
      <p className="mt-3 text-xs font-medium text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {values.length ? (
          values.map((value) => (
            <p key={value} className="text-xl font-semibold tracking-[-0.03em]">
              {value}
            </p>
          ))
        ) : (
          <p className="text-xl font-semibold tracking-[-0.03em]">—</p>
        )}
      </div>
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
