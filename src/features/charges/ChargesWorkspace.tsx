"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  MapPin,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import { loadFacets } from "@/components/facets/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { parseApiError } from "@/lib/error-utils";
import { useSiteAccess } from "@/features/context/use-site-access";
import { placeGroupsApi, type PlaceGroup } from "@/features/place-groups/api";
import { useAppStore } from "@/store/app-store";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  chargesApi,
  type AssignTargetsResult,
  type Assignment,
  type Definition,
  type Schedule,
} from "./api";

type ChargeAction = "new" | "definition" | "assignment";

const recurrenceLabels: Record<string, string> = {
  one_time: "One time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Twice yearly",
  yearly: "Yearly",
};

/** Cadences ordered from finest to coarsest, matching the server allow-list. */
const cadenceOrder = [
  "one_time",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "biannual",
  "yearly",
];

/** A payer may only acknowledge the same cadence or a coarser one. */
function allowedCadences(baseline?: string | null) {
  const index = cadenceOrder.indexOf(baseline ?? "");
  if (index < 0 || baseline === "one_time") return ["one_time"];
  return cadenceOrder.slice(index).filter((item) => item !== "one_time");
}

export default function ChargesWorkspace({
  id,
  action,
}: {
  id?: string;
  action?: ChargeAction;
}) {
  const router = useRouter();
  const selectedSite = useAppStore((state) => state.selectedProperty);
  const access = useSiteAccess();
  const [createOpen, setCreateOpen] = useState(action === "new");
  const contextKey = access.contextKey;
  const profile = access.workspace;
  const allow = (permission: string) =>
    !profile.isError && access.allowed(`charges.${permission}`);

  if (profile.isPending) {
    return <PageSkeleton label="Loading charge permissions" />;
  }
  if (profile.isError) {
    return (
      <PageState
        title="Charge permissions are unavailable"
        detail={parseApiError(profile.error).message}
        onRetry={() => profile.refetch()}
      />
    );
  }

  const required =
    action === "new" ? "create" : action ? "show" : "list";
  if (!allow(required)) {
    return (
      <PageState
        title="Charge access is restricted"
        detail="You do not have permission to use this charge page. Ask an organization administrator to review your role."
      />
    );
  }

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <ChargeHeader action={action === "new" ? undefined : action} />
      {action === "new" ? (
        <Directory
          contextKey={contextKey}
          siteId={selectedSite?.id}
          allow={allow}
          onCreate={() => setCreateOpen(true)}
        />
      ) : action === "definition" ? (
        <DefinitionDetail id={id!} contextKey={contextKey} allow={allow} />
      ) : action === "assignment" ? (
        <AssignmentDetail id={id!} contextKey={contextKey} allow={allow} />
      ) : (
        <Directory
          contextKey={contextKey}
          siteId={selectedSite?.id}
          allow={allow}
          onCreate={() => setCreateOpen(true)}
        />
      )}
      <NewDefinition
        open={createOpen}
        siteId={selectedSite?.id}
        onClose={() => {
          setCreateOpen(false);
          if (action === "new") router.push("/admin/charges");
        }}
        onCreated={(definition) => {
          setCreateOpen(false);
          router.push(`/admin/charges/definitions/${definition.id}`);
        }}
      />
    </main>
  );
}

function ChargeHeader({ action }: { action?: ChargeAction }) {
  return (
    <header className="border-b border-[var(--vms-line)] pb-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
        <ReceiptText className="h-3.5 w-3.5 text-[var(--vms-action)]" />
        <span>Finance</span>
        <span className="text-[var(--vms-line-strong)]">/</span>
        <span>Charges</span>
        {action ? (
          <>
            <span className="text-[var(--vms-line-strong)]">/</span>
            <span className="capitalize">{action}</span>
          </>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] sm:text-[36px]">
            Charges
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--vms-ink-muted)]">
            Define what is billed, assign it to a property, and keep the
            responsible Party and every schedule visible.
          </p>
        </div>

      </div>
    </header>
  );
}

function Directory({
  contextKey,
  siteId,
  allow,
  onCreate,
}: {
  contextKey: string;
  siteId?: string;
  allow: (permission: string) => boolean;
  onCreate: () => void;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["charges", contextKey, "definitions", page, siteId],
    queryFn: () => chargesApi.definitions(page, siteId),
    enabled: !!siteId,
    placeholderData: (previous) => previous,
  });
  const activeOnPage =
    query.data?.items.filter((definition) => definition.is_active).length || 0;
  const columns: Column<Definition>[] = [
    {
      key: "name",
      header: "Charge",
      sortable: false,
      accessor: (definition) => (
        <span className="min-w-0">
          <Link
            href={`/admin/charges/definitions/${definition.id}`}
            className="block truncate font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            {definition.name}
          </Link>
          <span className="mt-1 block max-w-md truncate text-xs text-[var(--vms-ink-muted)]">
            {definition.description || "No description"}
          </span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessor: (definition) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(definition.amount, definition.currency)}
        </span>
      ),
    },
    {
      key: "recurrence",
      header: "Schedule",
      accessor: (definition) => recurrenceLabel(definition.recurrence),
    },
    {
      key: "is_active",
      header: "Status",
      accessor: (definition) => <StatusBadge active={definition.is_active} />,
    },
    {
      key: "open",
      header: "Action",
      className: "text-right",
      accessor: (definition) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/charges/definitions/${definition.id}`}>Open</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
        <SummaryMetric
          label="Definitions"
          value={query.data?.total ?? "—"}
          detail="All charge definitions"
          icon={FileText}
        />
        <SummaryMetric
          label="Active on this page"
          value={query.data ? activeOnPage : "—"}
          detail="Ready for future assignments"
          icon={CheckCircle2}
        />
        <SummaryMetric
          label="Schedule source"
          value="Place → Party"
          detail="Each assignment names its payer"
          icon={Landmark}
        />
      </section>

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--vms-line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Charge definitions</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Reusable amounts and schedules. Assignments connect a definition
              to a property and payer.
            </p>
          </div>
          {allow("create") ? (
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create charge
            </Button>
          ) : null}
        </div>

        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError && !query.data ? (
          <InlineFailure
            title="Charges could not be loaded"
            error={query.error}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            {query.isError ? (
              <div
                role="status"
                className="flex flex-col gap-2 border-b border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-sm text-[var(--vms-warning)] sm:flex-row sm:items-center sm:justify-between"
              >
                <span>Showing the last successful charge snapshot.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => query.refetch()}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : null}
            <DataTable
              data={query.data?.items || []}
              columns={columns}
              searchable={false}
              serverSide
              pageSize={20}
              total={query.data?.total || 0}
              currentPage={page}
              onPageChange={setPage}
              isLoading={false}
              emptyMessage="No charges yet."
              tableLabel="Charge definitions"
              scrollHint="Scroll horizontally to compare charge details."
              mobileSummary={(definition) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/charges/definitions/${definition.id}`}
                        className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                      >
                        {definition.name}
                      </Link>
                      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                        {definition.description || "No description"}
                      </p>
                    </div>
                    <StatusBadge active={definition.is_active} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[var(--vms-ink-muted)]">Amount</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {formatMoney(definition.amount, definition.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--vms-ink-muted)]">Schedule</dt>
                      <dd className="mt-1 font-semibold">
                        {recurrenceLabel(definition.recurrence)}
                      </dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/charges/definitions/${definition.id}`}>
                      Open charge
                    </Link>
                  </Button>
                </div>
              )}
            />
          </>
        )}
      </section>
    </div>
  );
}

function NewDefinition({
  open,
  siteId,
  onClose,
  onCreated,
}: {
  open: boolean;
  siteId?: string;
  onClose: () => void;
  onCreated: (definition: Definition) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [recurrence, setRecurrence] = useState("one_time");
  const [showDates, setShowDates] = useState(false);
  const [startDate, setStartDate] = useState(todayInputValue);
  const [endDate, setEndDate] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDirty =
    !!name ||
    !!description ||
    !!amount ||
    currency !== "NGN" ||
    recurrence !== "one_time" ||
    isFlexible ||
    showDates ||
    !!endDate;
  const canLeave = useUnsavedChanges(isDirty);
  const mutation = useMutation({
    mutationFn: () =>
      chargesApi.create({
        site_id: siteId!,
        name: name.trim(),
        description: description.trim() || null,
        amount,
        currency,
        recurrence,
        ...(showDates
          ? {
              start_date: isoFromDateInput(startDate),
              end_date: isoFromDateInput(endDate),
            }
          : {}),
        is_flexible: isFlexible,
      }),
    onSuccess: onCreated,
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors["charge-name"] = "Enter a charge name.";
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      nextErrors["charge-amount"] = "Enter an amount greater than zero.";
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      nextErrors["charge-currency"] = "Use a three-letter currency code.";
    }
    if (showDates && startDate && endDate && endDate < startDate) {
      nextErrors["charge-end-date"] =
        "End date must be after the start date.";
    }
    if (!siteId) nextErrors["charge-site"] = "Select a Site first.";
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) mutation.mutate();
  }

  function closeDrawer() {
    if (canLeave()) onClose();
  }

  return (
    <Drawer
      isOpen={open}
      onClose={closeDrawer}
      title="Create a charge"
      description="Define the reusable amount and recurrence. Assign it to Places or a Place group after creation."
    >
      <form className="mt-5 space-y-5" onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <fieldset className="space-y-4" disabled={mutation.isPending}>
          <Field
            id="charge-name"
            label="Name"
            description="A short name operators will recognise."
            error={errors["charge-name"]}
            required
          >
            {(control) => (
              <input
                {...control}
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Monthly service charge"
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field
            id="charge-description"
            label="Description"
            description="Optional context shown on the definition."
          >
            {(control) => (
              <textarea
                {...control}
                maxLength={500}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this charge covers"
                className={fieldControlClassName}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="charge-amount"
              label="Amount"
              error={errors["charge-amount"]}
              required
            >
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="25000.00"
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Field
              id="charge-currency"
              label="Currency"
              error={errors["charge-currency"]}
              required
            >
              {(control) => (
                <input
                  {...control}
                  inputMode="text"
                  autoCapitalize="characters"
                  pattern="[A-Z]{3}"
                  minLength={3}
                  maxLength={3}
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
          </div>
          <Field id="charge-recurrence" label="Recurrence" required>
            {(control) => (
              <select
                {...control}
                value={recurrence}
                onChange={(event) => setRecurrence(event.target.value)}
                className={fieldControlClassName}
              >
                {Object.entries(recurrenceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex items-start gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3">
            <input
              type="checkbox"
              checked={showDates}
              onChange={(event) => setShowDates(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="min-w-0 text-sm">
              <span className="block font-medium">Set a schedule window</span>
              <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
                Off by default: the charge starts today and runs until it is
                deactivated.
              </span>
            </span>
          </label>
          {showDates ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="charge-start-date"
                label="Start date"
                description="First day a schedule may fall on."
              >
                {(control) => (
                  <input
                    {...control}
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={fieldControlClassName}
                  />
                )}
              </Field>
              <Field
                id="charge-end-date"
                label="End date"
                description="No schedules are generated after this date."
                error={errors["charge-end-date"]}
              >
                {(control) => (
                  <input
                    {...control}
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className={fieldControlClassName}
                  />
                )}
              </Field>
            </div>
          ) : null}
          <label className="flex items-start gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3">
            <input
              type="checkbox"
              checked={isFlexible}
              onChange={(event) => setIsFlexible(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="min-w-0 text-sm">
              <span className="block font-medium">
                Flexible frequency
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
                Let the payer acknowledge the same or a longer cycle than the
                recurrence above.
              </span>
            </span>
          </label>
        </fieldset>
        {mutation.isError ? <InlineError error={mutation.error} /> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={closeDrawer}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="min-h-11"
          >
            {mutation.isPending ? "Creating charge…" : "Create charge"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

function DefinitionDetail({
  id,
  contextKey,
  allow,
}: {
  id: string;
  contextKey: string;
  allow: (permission: string) => boolean;
}) {
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["charges", contextKey, "definition", id],
    queryFn: () => chargesApi.definition(id),
  });
  const assignments = useQuery({
    queryKey: ["charges", contextKey, "assignments", id, page],
    queryFn: () => chargesApi.assignments(id, page),
    enabled: allow("list"),
  });
  const toggle = useMutation({
    mutationFn: () =>
      chargesApi.update(id, { is_active: !query.data?.is_active }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["charges", contextKey] }),
  });

  if (query.isPending) return <PageSkeleton label="Loading charge" />;
  if (query.isError) {
    return (
      <InlineFailure
        title="Charge unavailable"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  const definition = query.data;
  const assignmentColumns: Column<Assignment>[] = [
    {
      key: "place",
      header: "Property",
      accessor: (assignment) => (
        <Link
          href={`/admin/charges/assignments/${assignment.id}`}
          className="font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
        >
          {assignment.target_place.name}
        </Link>
      ),
    },
    {
      key: "responsible",
      header: "Responsible Party",
      accessor: (assignment) =>
        assignment.current_responsibility?.responsible_party.display_name ||
        "No responsible person",
    },
    {
      key: "outstanding",
      header: "Outstanding",
      accessor: (assignment) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(
            assignment.outstanding_amount,
            assignment.charge_definition.currency,
          )}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      accessor: (assignment) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/charges/assignments/${assignment.id}`}>
            Open assignment
          </Link>
        </Button>
      ),
    },
  ];
  return (
    <>
      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold">
                  {definition.name}
                </h2>
                <StatusBadge active={definition.is_active} />
              </div>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                {definition.description || "No description provided."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {allow("create") && definition.is_active ? (
              <Button onClick={() => setAssignOpen(true)}>
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Assign charge
              </Button>
            ) : null}
            {allow("update") ? (
              <Button
                variant="secondary"
                isLoading={toggle.isPending}
                onClick={() => toggle.mutate()}
              >
                {definition.is_active
                  ? "Deactivate future assignments"
                  : "Activate charge"}
              </Button>
            ) : null}
          </div>
        </div>
        <div
          className={
            definition.end_date
              ? "grid border-t border-[var(--vms-line)] sm:grid-cols-2 lg:grid-cols-4"
              : "grid border-t border-[var(--vms-line)] sm:grid-cols-3"
          }
        >
          <Fact
            label="Amount"
            value={formatMoney(definition.amount, definition.currency)}
          />
          <Fact
            label="Recurrence"
            value={
              definition.is_flexible
                ? `${recurrenceLabel(definition.recurrence)} · flexible`
                : recurrenceLabel(definition.recurrence)
            }
          />
          <Fact
            label="Assignments"
            value={
              assignments.data
                ? String(assignments.data.total)
                : allow("list")
                  ? "Loading…"
                  : "Restricted"
            }
          />
          {definition.end_date ? (
            <Fact
              label="Runs until"
              value={formatDate(definition.end_date)}
            />
          ) : null}
        </div>
        {toggle.isError ? (
          <div className="border-t border-[var(--vms-line)] p-4">
            <InlineError error={toggle.error} />
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="border-b border-[var(--vms-line)] px-4 py-4">
          <h2 className="text-base font-semibold">Property assignments</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            The property receiving the charge and the Party responsible for
            payment.
          </p>
        </div>
        {!allow("list") ? (
          <RestrictedState detail="You can view the definition, but not its property assignments." />
        ) : assignments.isPending ? (
          <TableSkeleton rows={3} />
        ) : assignments.isError && !assignments.data ? (
          <InlineFailure
            title="Assignments could not be loaded"
            error={assignments.error}
            onRetry={() => assignments.refetch()}
          />
        ) : (
          <DataTable
            data={assignments.data?.items || []}
            columns={assignmentColumns}
            searchable={false}
            serverSide
            pageSize={20}
            total={assignments.data?.total || 0}
            currentPage={page}
            onPageChange={setPage}
            isLoading={assignments.isFetching && !assignments.data}
            emptyMessage="No assignments yet. Assign this charge to a property and responsible Party."
            tableLabel="Charge property assignments"
            scrollHint="Scroll horizontally to compare assignment details."
            isStale={assignments.isError && !!assignments.data}
            onRetry={() => assignments.refetch()}
            mobileSummary={(assignment) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/charges/assignments/${assignment.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {assignment.target_place.name}
                  </Link>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/charges/assignments/${assignment.id}`}>
                      Open
                    </Link>
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[var(--vms-ink-muted)]">Responsible</dt>
                    <dd className="mt-1 font-semibold">
                      {assignment.current_responsibility?.responsible_party
                        .display_name || "No responsible person"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--vms-ink-muted)]">Outstanding</dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {formatMoney(
                        assignment.outstanding_amount,
                        assignment.charge_definition.currency,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          />
        )}
      </section>

      {assignOpen ? (
        <AssignCharge
          id={id}
          contextKey={contextKey}
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          onAssigned={(result) => {
            setAssignOpen(false);
            queryClient.invalidateQueries({ queryKey: ["charges", contextKey] });
            if (result.created.length === 1) {
              router.push(`/admin/charges/assignments/${result.created[0].id}`);
            }
          }}
        />
      ) : null}
    </>
  );
}

function AssignCharge({
  id,
  contextKey,
  open,
  onClose,
  onAssigned,
}: {
  id: string;
  contextKey: string;
  open: boolean;
  onClose: () => void;
  onAssigned: (result: AssignTargetsResult) => void;
}) {
  const [places, setPlaces] = useState<FacetItem[]>([]);
  const [placeGroup, setPlaceGroup] = useState<PlaceGroup | null>(null);
  const [party, setParty] = useState<FacetItem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const definition = useQuery({
    queryKey: ["charges", contextKey, "definition", id],
    queryFn: () => chargesApi.definition(id),
    enabled: open,
  });
  const groups = useQuery({
    queryKey: ["place-groups", contextKey],
    queryFn: placeGroupsApi.list,
    enabled: open,
  });
  const mutation = useMutation({
    mutationFn: () =>
      chargesApi.assignTargets({
        charge_definition_id: id,
        target_place_ids: places.map((item) => item.value),
        ...(placeGroup ? { place_group_id: placeGroup.id } : {}),
        ...(party ? { responsible_party_id: party.value } : {}),
      }),
    onSuccess: onAssigned,
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!places.length && !placeGroup) {
      nextErrors["charge-target"] =
        "Choose at least one Place or a Place group.";
    }
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) mutation.mutate();
  }

  return (
    <FormDrawer
      isOpen={open}
      onClose={onClose}
      size="lg"
      title={`Assign ${definition.data?.name || "charge"}`}
      description="Pick every Place that should start carrying this charge. A Place group is added to the same selection."
      onSubmit={submit}
      submitLabel="Assign charge"
      isSubmitting={mutation.isPending}
      canSubmit={places.length > 0 || !!placeGroup}
      error={mutation.isError ? parseApiError(mutation.error).message : null}
      footerNote={
        definition.data
          ? `${formatMoney(definition.data.amount, definition.data.currency)} · ${recurrenceLabel(definition.data.recurrence)} · schedules open automatically`
          : "Schedules open automatically for every target Place."
      }
    >
      <FormErrorSummary errors={errors} />
      <FormSection
        title="Places"
        description="Search and add as many Places as you need. Selected Places are charged individually."
      >
        <PlaceTargetPicker
          contextKey={contextKey}
          selected={places}
          onChange={setPlaces}
          error={errors["charge-target"]}
        />
      </FormSection>
      <FormSection
        title="Place group"
        description="Optional. Every Place in the group joins the selection when you assign."
      >
        <Field id="charge-place-group" label="Place group">
          {(control) => (
            <select
              {...control}
              value={placeGroup?.id || ""}
              onChange={(event) =>
                setPlaceGroup(
                  groups.data?.find(
                    (group) => group.id === event.target.value,
                  ) || null,
                )
              }
              className={fieldControlClassName}
            >
              <option value="">No group</option>
              {(groups.data ?? []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} · {group.places.length} Places
                </option>
              ))}
            </select>
          )}
        </Field>
      </FormSection>
      <FormSection
        title="Responsibility"
        description="Leave this empty to let any Party at the Place pay the fee."
      >
        <FacetPicker
          facet="parties"
          label="Responsible person or organization (optional)"
          value={party}
          onChange={setParty}
          contextKey={contextKey}
          placeId={places.length === 1 ? places[0].value : undefined}
          description={
            places.length === 1
              ? "Scoped to Parties linked to the selected Place."
              : "Nobody named means every Party at each Place can pay."
          }
          error={errors["charge-responsible"]}
        />
      </FormSection>
    </FormDrawer>
  );
}

function PlaceTargetPicker({
  contextKey,
  selected,
  onChange,
  error,
}: {
  contextKey: string;
  selected: FacetItem[];
  onChange: (items: FacetItem[]) => void;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(true);
  const query = useQuery({
    queryKey: ["facets", contextKey, "places", "assign", search],
    queryFn: ({ signal }) =>
      loadFacets("places", { filters: { is_active: true }, search, signal }),
    staleTime: 0,
  });
  const selectedIds = new Set(selected.map((item) => item.value));
  function toggle(item: FacetItem) {
    onChange(
      selectedIds.has(item.value)
        ? selected.filter((entry) => entry.value !== item.value)
        : [...selected, item],
    );
  }

  return (
    <div className="space-y-3">
      {selected.length ? (
        <ul className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <li key={item.value}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] py-1 pl-2.5 pr-1.5 text-xs font-medium">
                <MapPin
                  className="h-3.5 w-3.5 text-[var(--vms-action)]"
                  aria-hidden="true"
                />
                {item.label}
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-label={`Remove ${item.label}`}
                  className="grid h-5 w-5 place-items-center rounded-full text-[var(--vms-ink-muted)] hover:bg-[var(--vms-line)] hover:text-[var(--vms-ink)]"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--vms-ink-muted)]">
          No Places selected yet.
        </p>
      )}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          aria-label="Search Places"
          placeholder="Search Places"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          className={`${fieldControlClassName} pl-9`}
        />
      </div>
      {open ? (
        <div className="max-h-64 overflow-y-auto rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          {query.isPending ? (
            <p className="px-3 py-3 text-xs text-[var(--vms-ink-muted)]">
              Loading Places…
            </p>
          ) : query.isError ? (
            <p className="px-3 py-3 text-xs text-[var(--vms-danger)]">
              {parseApiError(query.error).message}
            </p>
          ) : !query.data.items.length ? (
            <p className="px-3 py-3 text-xs text-[var(--vms-ink-muted)]">
              No Places match that search.
            </p>
          ) : (
            <ul
              role="listbox"
              aria-multiselectable="true"
              aria-label="Places"
              className="divide-y divide-[var(--vms-line)]"
            >
              {query.data.items.map((item) => {
                const isSelected = selectedIds.has(item.value);
                return (
                  <li key={item.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={item.disabled}
                      onClick={() => toggle(item)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--vms-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-[var(--vms-action)]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-[var(--vms-danger)]">{error}</p>
      ) : null}
    </div>
  );
}

function AssignmentDetail({
  id,
  contextKey,
  allow,
}: {
  id: string;
  contextKey: string;
  allow: (permission: string) => boolean;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [newParty, setNewParty] = useState<FacetItem | null>(null);
  const [reason, setReason] = useState("");
  const [scheduleCount, setScheduleCount] = useState(1);
  const [scheduleCadence, setScheduleCadence] = useState<string | null>(null);
  const [cadenceOpen, setCadenceOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const canLeave = useUnsavedChanges(!!newParty || !!reason);
  const query = useQuery({
    queryKey: ["charges", contextKey, "assignment", id],
    queryFn: () => chargesApi.assignment(id),
  });
  const schedules = useQuery({
    queryKey: ["charges", contextKey, "schedules", id, page],
    queryFn: () => chargesApi.schedules(id, page),
    enabled: allow("list"),
    placeholderData: (previous) => previous,
  });
  const mutation = useMutation({
    mutationFn: (operation: "transfer" | "schedule" | "assign") => {
      if (operation === "assign") {
        return chargesApi.assignResponsibility(id, {
          responsible_party_id: newParty!.value,
        });
      }
      return operation === "transfer"
        ? chargesApi.transfer(id, {
            responsible_party_id: newParty!.value,
            expected_responsibility_id: query.data!.current_responsibility!.id,
            reason: reason.trim(),
          })
        : chargesApi.generate(id, {
            schedule_count: scheduleCount,
            ...(query.data?.charge_definition.is_flexible
              ? {
                  cadence:
                    scheduleCadence ??
                    query.data.acknowledged_cadence ??
                    query.data.charge_definition.recurrence,
                }
              : {}),
          });
    },
    onSuccess: () => {
      setNewParty(null);
      setReason("");
      setScheduleCadence(null);
      setCadenceOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["charges", contextKey],
      });
    },
  });

  if (query.isPending) return <PageSkeleton label="Loading assignment" />;
  if (query.isError) {
    return (
      <InlineFailure
        title="Assignment unavailable"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  const assignment = query.data;
  const definition = assignment.charge_definition;
  const isFlexible = Boolean(definition.is_flexible);
  const acknowledgedCadence = assignment.acknowledged_cadence ?? null;
  const billingCadence =
    scheduleCadence ?? acknowledgedCadence ?? definition.recurrence;
  const cadenceOptions = allowedCadences(definition.recurrence);
  const awaitingCadence =
    isFlexible && (schedules.data?.total ?? 0) === 0;
  const scheduleColumns: Column<Schedule>[] = [
    {
      key: "due_date",
      header: "Due date",
      accessor: (schedule) => (
        <time dateTime={schedule.due_date}>
          {formatDate(schedule.due_date)}
        </time>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessor: (schedule) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatMoney(schedule.amount, schedule.currency)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      accessor: (schedule) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(schedule.balance, schedule.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (schedule) => (
        <Badge
          variant={
            schedule.status === "paid"
              ? "success"
              : schedule.status === "void"
                ? "danger"
                : "neutral"
          }
        >
          {schedule.status}
        </Badge>
      ),
    },
  ];
  return (
    <>
      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vms-action)]">
              Charge assignment
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {assignment.charge_definition.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              {assignment.target_place.name} · Responsible:{" "}
              {assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned"}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link
              href={`/admin/charges/definitions/${assignment.charge_definition_id}`}
            >
              View definition
            </Link>
          </Button>
        </div>
        <div className="grid border-t border-[var(--vms-line)] sm:grid-cols-3">
          <Fact
            label="Outstanding"
            value={formatMoney(
              assignment.outstanding_amount,
              assignment.charge_definition.currency,
            )}
          />
          <Fact
            label="Responsible Party"
            value={
              assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned"
            }
          />
          <Fact
            label="Schedules"
            value={
              schedules.data
                ? String(schedules.data.total)
                : allow("list")
                  ? "Loading…"
                  : "Restricted"
            }
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.65fr)]">
        <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <div className="border-b border-[var(--vms-line)] px-4 py-4">
            <h2 className="text-base font-semibold">Schedules and balances</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              Amount, due date and remaining balance for this assignment.
            </p>
          </div>
          {!allow("list") ? (
            <RestrictedState detail="You can view the assignment, but not its schedules." />
          ) : schedules.isPending ? (
            <TableSkeleton rows={4} />
          ) : schedules.isError && !schedules.data ? (
            <InlineFailure
              title="Schedules could not be loaded"
              error={schedules.error}
              onRetry={() => schedules.refetch()}
            />
          ) : awaitingCadence ? (
            <div className="space-y-4 px-4 py-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--vms-surface-muted)] text-[var(--vms-ink-muted)]">
                  <ReceiptText className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">No schedule yet</p>
                  <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                    This fee is acknowledged rather than billed on a fixed
                    rhythm, so nothing is scheduled when it is assigned. The
                    payer chooses how often to pay when they acknowledge it, and
                    the schedule is created at that point.
                  </p>
                </div>
              </div>
              {allow("schedule") ? (
                <Button
                  variant="secondary"
                  onClick={() => setCadenceOpen(true)}
                  className="min-h-11"
                >
                  Schedule cadence
                </Button>
              ) : null}
            </div>
          ) : (
            <DataTable
              data={schedules.data?.items || []}
              columns={scheduleColumns}
              searchable={false}
              serverSide
              pageSize={20}
              total={schedules.data?.total || 0}
              currentPage={page}
              onPageChange={setPage}
              isLoading={schedules.isFetching && !schedules.data}
              emptyMessage="No schedules yet. Generate a schedule when the assignment is ready to bill."
              tableLabel="Charge schedules"
              scrollHint="Scroll horizontally to compare due dates and balances."
              isStale={schedules.isError && !!schedules.data}
              onRetry={() => schedules.refetch()}
              mobileSummary={(schedule) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--vms-ink-muted)]">
                        Due date
                      </p>
                      <time
                        dateTime={schedule.due_date}
                        className="mt-1 block text-sm font-semibold"
                      >
                        {formatDate(schedule.due_date)}
                      </time>
                    </div>
                    <Badge
                      variant={
                        schedule.status === "paid"
                          ? "success"
                          : schedule.status === "void"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {schedule.status}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[var(--vms-ink-muted)]">Amount</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {formatMoney(schedule.amount, schedule.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--vms-ink-muted)]">Balance</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {formatMoney(schedule.balance, schedule.currency)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            />
          )}
        </section>

        <section className="space-y-4">
          {allow("schedule") ? (
            <ActionPanel
              title={isFlexible ? "Schedule this fee" : "Generate schedules"}
              description={
                isFlexible
                  ? "Nothing is billed until a cadence is set. Use the cadence the payer acknowledged, or the definition cadence."
                  : "Add more due dates for this assignment."
              }
            >
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate("schedule");
                }}
              >
                {isFlexible ? (
                  <Field id="charge-generate-cadence" label="Cadence" required>
                    {(control) => (
                      <select
                        {...control}
                        value={billingCadence}
                        onChange={(event) =>
                          setScheduleCadence(event.target.value)
                        }
                        className={fieldControlClassName}
                      >
                        {cadenceOptions.map((value) => (
                          <option key={value} value={value}>
                            {recurrenceLabel(value)}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                ) : null}
                <Field
                  id="charge-generate-count"
                  label="Schedules"
                  description="Add between 1 and 120 due dates."
                  required
                >
                  {(control) => (
                    <input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={120}
                      value={scheduleCount}
                      onChange={(event) =>
                        setScheduleCount(Number(event.target.value))
                      }
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
                <Button
                  type="submit"
                  isLoading={mutation.isPending}
                  className="min-h-11 w-full"
                >
                  {isFlexible ? "Create schedule" : "Generate schedules"}
                </Button>
              </form>
            </ActionPanel>
          ) : null}

          {allow("transfer") && !assignment.current_responsibility ? (
            <ActionPanel
              title="Responsible party"
              description="Nobody is named, so any Party living at this Place can pay. Add a Party to make one payer accountable."
            >
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextErrors: Record<string, string> = {};
                  if (!newParty) {
                    nextErrors["charge-new-responsible"] =
                      "Choose the responsible Party.";
                  }
                  setErrors(nextErrors);
                  if (!Object.keys(nextErrors).length) mutation.mutate("assign");
                }}
              >
                <FormErrorSummary errors={errors} />
                <FacetPicker
                  facet="parties"
                  label="Responsible person or organization (optional)"
                  value={newParty}
                  onChange={setNewParty}
                  contextKey={contextKey}
                  placeId={assignment.target_place.id}
                  error={errors["charge-new-responsible"]}
                />
                <p className="text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                  Leaving this empty keeps the charge payable by everyone at{" "}
                  {assignment.target_place.name}.
                </p>
                <Button
                  type="submit"
                  disabled={!newParty || mutation.isPending}
                  className="min-h-11 w-full"
                >
                  {mutation.isPending ? "Assigning…" : "Assign responsible party"}
                </Button>
              </form>
            </ActionPanel>
          ) : null}

          {allow("transfer") && assignment.current_responsibility ? (
            <ActionPanel
              title="Responsibility"
              description="Unpaid schedules follow the new responsible Party. Paid schedules retain their existing payer."
            >
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextErrors: Record<string, string> = {};
                  if (!newParty) {
                    nextErrors["charge-new-responsible"] =
                      "Choose the new responsible Party.";
                  }
                  if (!reason.trim()) {
                    nextErrors["charge-transfer-reason"] =
                      "Explain why responsibility is changing.";
                  }
                  setErrors(nextErrors);
                  if (!Object.keys(nextErrors).length) {
                    setConfirmTransfer(true);
                  }
                }}
              >
                <FormErrorSummary errors={errors} />
                <FacetPicker
                  facet="parties"
                  label="New responsible person or organization"
                  value={newParty}
                  onChange={setNewParty}
                  contextKey={contextKey}
                  error={errors["charge-new-responsible"]}
                />
                <Field
                  id="charge-transfer-reason"
                  label="Reason"
                  error={errors["charge-transfer-reason"]}
                  required
                >
                  {(control) => (
                    <input
                      {...control}
                      maxLength={255}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Why responsibility is changing"
                      className={fieldControlClassName}
                    />
                  )}
                </Field>
                <Button
                  type="submit"
                  disabled={!newParty || !reason.trim() || mutation.isPending}
                  className="min-h-11 w-full"
                >
                  Review and transfer
                </Button>
              </form>
            </ActionPanel>
          ) : null}
          {mutation.isError ? <InlineError error={mutation.error} /> : null}
          {mutation.isSuccess ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Assignment updated.
            </div>
          ) : null}
        </section>
      </div>
      <Modal
        isOpen={confirmTransfer}
        onClose={() => setConfirmTransfer(false)}
        title="Transfer charge responsibility?"
        description="Unpaid schedules will follow the new responsible Party. Paid schedules keep their current payer and history."
      >
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--vms-line)] pb-3">
            <dt className="text-[var(--vms-ink-muted)]">Current Party</dt>
            <dd className="text-right font-semibold">
              {assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--vms-line)] pb-3">
            <dt className="text-[var(--vms-ink-muted)]">New Party</dt>
            <dd className="text-right font-semibold">{newParty?.label}</dd>
          </div>
          <div>
            <dt className="text-[var(--vms-ink-muted)]">Reason</dt>
            <dd className="mt-1">{reason}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirmTransfer(false)}>
            Keep current Party
          </Button>
          <Button
            isLoading={mutation.isPending}
            onClick={() => {
              mutation.mutate("transfer");
              setConfirmTransfer(false);
            }}
          >
            Transfer responsibility
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={cadenceOpen}
        onClose={() => setCadenceOpen(false)}
        title="Schedule this fee"
        description="This fee is billed against an acknowledged cadence. Creating the schedule here bills the payer on the rhythm you choose."
        size="sm"
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-muted)] px-3 py-2 text-sm">
            <p className="text-[var(--vms-ink-muted)]">
              Definition cadence:{" "}
              <span className="font-semibold text-[var(--vms-ink)]">
                {recurrenceLabel(definition.recurrence)}
              </span>
            </p>
            <p className="mt-1 text-[var(--vms-ink-muted)]">
              Acknowledged:{" "}
              <span className="font-semibold text-[var(--vms-ink)]">
                {acknowledgedCadence
                  ? recurrenceLabel(acknowledgedCadence)
                  : "Not yet"}
              </span>
            </p>
          </div>
          <Field id="charge-modal-cadence" label="Billing cadence" required>
            {(control) => (
              <select
                {...control}
                value={billingCadence}
                onChange={(event) => setScheduleCadence(event.target.value)}
                className={fieldControlClassName}
              >
                {cadenceOptions.map((value) => (
                  <option key={value} value={value}>
                    {recurrenceLabel(value)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="charge-modal-count"
            label="Schedules"
            description="Add between 1 and 120 due dates."
            required
          >
            {(control) => (
              <input
                {...control}
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={scheduleCount}
                onChange={(event) =>
                  setScheduleCount(Number(event.target.value))
                }
                className={fieldControlClassName}
              />
            )}
          </Field>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setCadenceOpen(false)}>
            Cancel
          </Button>
          <Button
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate("schedule")}
          >
            Create schedule
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ActionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--vms-line)] bg-white p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-xs text-[var(--vms-ink-muted)]">
            {label}
          </span>
          <strong className="mt-2 block text-[24px] font-semibold leading-none tracking-[-0.035em]">
            {value}
          </strong>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--vms-line)] px-4 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function ReviewFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--vms-line)] pb-3 last:border-0 last:pb-0">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vms-action)]" />
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          {label}
        </dt>
        <dd className="mt-0.5 font-medium text-[var(--vms-ink)]">
          {value || "Not selected"}
        </dd>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "w-fit rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"
          : "w-fit rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RestrictedState({ detail }: { detail: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-6 text-sm text-[var(--vms-ink-muted)]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {detail}
    </div>
  );
}

function InlineError({ error }: { error: unknown }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2 text-xs text-[var(--vms-danger)]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {parseApiError(error).message}
    </p>
  );
}

function InlineFailure({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="px-5 py-8 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-red-600" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
        {parseApiError(error).message}
      </p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

function PageState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <section
      role={onRetry ? "alert" : "alert"}
      className="rounded-lg border border-[var(--vms-line)] bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,27,49,0.04)]"
    >
      <AlertCircle className="mx-auto h-6 w-6 text-[var(--vms-ink-muted)]" />
      <h1 className="mt-3 text-base font-semibold">{title}</h1>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </section>
  );
}

function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)]"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)]" />
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--vms-line)] px-4" role="status">
      <span className="sr-only">Loading charge rows</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse py-3">
          <div className="h-full rounded bg-[var(--vms-surface-subtle)]" />
        </div>
      ))}
    </div>
  );
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function recurrenceLabel(value: string) {
  return recurrenceLabels[value] || value.replaceAll("_", " ");
}

/** Today as a `YYYY-MM-DD` value for `<input type="date">` in the local zone. */
function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Convert a date-only input to an offset-aware timestamp.
 *
 * The API stores timestamps and rejects nothing now, but an anchor at local noon
 * keeps the calendar day stable for every client offset.
 */
function isoFromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

