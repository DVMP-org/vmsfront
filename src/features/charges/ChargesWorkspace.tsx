"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  Plus,
  ReceiptText,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { parseApiError } from "@/lib/error-utils";
import { useSiteAccess } from "@/features/context/use-site-access";
import { placeGroupsApi, type PlaceGroup } from "@/features/place-groups/api";
import { useAppStore } from "@/store/app-store";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  chargesApi,
  type Assignment,
  type Definition,
  type Schedule,
} from "./api";

type ChargeAction = "new" | "definition" | "assign" | "assignment";

const recurrenceLabels: Record<string, string> = {
  one_time: "One time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Twice yearly",
  yearly: "Yearly",
};

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
    !profile.isError &&
    profile.isFetchedAfterMount &&
    access.allowed(`charges.${permission}`);

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
    action === "new" || action === "assign"
      ? "create"
      : action
        ? "show"
        : "list";
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
      ) : action === "assign" ? (
        <AssignCharge id={id!} contextKey={contextKey} />
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
        <Link
          href="/admin/charges"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vms-action)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Charge directory
        </Link>
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDirty =
    !!name ||
    !!description ||
    !!amount ||
    currency !== "NGN" ||
    recurrence !== "one_time";
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
              <Button asChild>
                <Link href={`/admin/charges/definitions/${id}/assign`}>
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Assign to a property
                </Link>
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
        <div className="grid border-t border-[var(--vms-line)] sm:grid-cols-3">
          <Fact
            label="Amount"
            value={formatMoney(definition.amount, definition.currency)}
          />
          <Fact
            label="Recurrence"
            value={recurrenceLabel(definition.recurrence)}
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
    </>
  );
}

function AssignCharge({ id, contextKey }: { id: string; contextKey: string }) {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const [place, setPlace] = useState<FacetItem | null>(null);
  const [targetMode, setTargetMode] = useState<"place" | "group">("place");
  const [placeGroup, setPlaceGroup] = useState<PlaceGroup | null>(null);
  const [party, setParty] = useState<FacetItem | null>(null);
  const [scheduleCount, setScheduleCount] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canLeave = useUnsavedChanges(!!place || !!party || !!firstDueDate);
  const definition = useQuery({
    queryKey: ["charges", contextKey, "definition", id],
    queryFn: () => chargesApi.definition(id),
  });
  const groups = useQuery({
    queryKey: ["place-groups", contextKey],
    queryFn: placeGroupsApi.list,
    enabled: targetMode === "group",
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const common = {
        charge_definition_id: id,
        responsible_party_id: party!.value,
        schedule_count: scheduleCount,
        ...(firstDueDate ? { first_due_date: firstDueDate } : {}),
      };
      if (targetMode === "group") {
        const assignments = await chargesApi.assignGroup({
          ...common,
          place_group_id: placeGroup!.id,
        });
        return { assignments, isGroup: true };
      }
      const assignment = await chargesApi.assign({
        ...common,
        target_place_id: place!.value,
      });
      return { assignments: [assignment], isGroup: false };
    },
    onSuccess: ({ assignments, isGroup }) => {
      if (isGroup) {
        router.push(
          organization?.use_case === "residential"
            ? "/admin/residential/finance"
            : "/admin/charges",
        );
        return;
      }
      router.push(`/admin/charges/assignments/${assignments[0].id}`);
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (targetMode === "place" && !place) {
      nextErrors["charge-target"] = "Choose the target Place.";
    }
    if (targetMode === "group" && !placeGroup) {
      nextErrors["charge-target"] = "Choose the target Place group.";
    }
    if (!party) {
      nextErrors["charge-responsible"] = "Choose the responsible person.";
    }
    if (
      !Number.isFinite(scheduleCount) ||
      scheduleCount < 1 ||
      scheduleCount > 120
    ) {
      nextErrors["charge-schedule-count"] =
        "Enter between 1 and 120 schedules.";
    }
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) mutation.mutate();
  }

  return (
    <div className="grid gap-4 pb-20 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] xl:pb-0">
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
        <h2 className="text-base font-semibold">
          Assign {definition.data?.name || "charge"}
        </h2>
        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
          Choose where the charge applies and who is currently responsible for
          paying it.
        </p>
        <form className="mt-5 space-y-5" onSubmit={submit} noValidate>
          <FormErrorSummary errors={errors} />
          <fieldset className="space-y-5" disabled={mutation.isPending}>
            <fieldset>
              <legend className="text-sm font-semibold">Assign to</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ["place", "One Place"],
                    ["group", "Place group"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-sm font-medium"
                  >
                    <input
                      type="radio"
                      name="charge-target-mode"
                      value={value}
                      checked={targetMode === value}
                      onChange={() => {
                        setTargetMode(value);
                        setPlace(null);
                        setPlaceGroup(null);
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {targetMode === "place" ? (
              <FacetPicker
                facet="places"
                label="Target Place"
                value={place}
                onChange={setPlace}
                contextKey={contextKey}
                error={errors["charge-target"]}
              />
            ) : (
              <Field
                id="charge-place-group"
                label="Target Place group"
                error={errors["charge-target"]}
                required
              >
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
                    <option value="">Choose a group</option>
                    {(groups.data ?? []).map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} · {group.places.length} Places
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}
            <FacetPicker
              facet="parties"
              label="Responsible person or organization"
              value={party}
              onChange={setParty}
              contextKey={contextKey}
              error={errors["charge-responsible"]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="charge-schedule-count"
                label="Initial schedules"
                description="Between 1 and 120 schedules."
                error={errors["charge-schedule-count"]}
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
              <Field
                id="charge-first-due-date"
                label="First due date"
                description="Optional; the server supplies its normal schedule date."
              >
                {(control) => (
                  <input
                    {...control}
                    type="date"
                    value={firstDueDate}
                    onChange={(event) => setFirstDueDate(event.target.value)}
                    className={fieldControlClassName}
                  />
                )}
              </Field>
            </div>
          </fieldset>
          {mutation.isError ? <InlineError error={mutation.error} /> : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button
              asChild
              variant="secondary"
              onClick={(event) => {
                if (!canLeave()) event.preventDefault();
              }}
            >
              <Link href={`/admin/charges/definitions/${id}`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !party ||
                (targetMode === "place" ? !place : !placeGroup)
              }
              className="min-h-11"
            >
              {mutation.isPending
                ? "Creating assignment…"
                : "Create assignment"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vms-action)]">
          Review before commit
        </p>
        <h2 className="mt-1 text-base font-semibold">
          {definition.data
            ? formatMoney(definition.data.amount, definition.data.currency)
            : "Charge amount"}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
          {definition.data
            ? recurrenceLabel(definition.data.recurrence)
            : "Loading recurrence"}
        </p>
        <dl className="mt-5 space-y-3 text-xs">
          <ReviewFact
            icon={Landmark}
            label={targetMode === "group" ? "Place group" : "Place"}
            value={targetMode === "group" ? placeGroup?.name : place?.label}
          />
          <ReviewFact
            icon={UserRound}
            label="Responsible Party"
            value={party?.label}
          />
          <ReviewFact
            icon={CalendarDays}
            label="Schedules"
            value={`${scheduleCount} scheduled charge${scheduleCount === 1 ? "" : "s"}`}
          />
        </dl>
        <div className="mt-5 flex gap-2 rounded-md bg-white p-3 text-xs leading-5 text-[var(--vms-ink)] ring-1 ring-[var(--vms-line)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-action)]" />
          The assignment creates schedules in one operation. Confirm the place
          and payer; a later change must use responsibility transfer.
        </div>
      </section>
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
    mutationFn: (operation: "transfer" | "schedule") =>
      operation === "transfer"
        ? chargesApi.transfer(id, {
            responsible_party_id: newParty!.value,
            expected_responsibility_id: query.data!.current_responsibility!.id,
            reason: reason.trim(),
          })
        : chargesApi.generate(id, { schedule_count: scheduleCount }),
    onSuccess: () => {
      setNewParty(null);
      setReason("");
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
              title="Generate schedules"
              description="Add more due dates for this assignment."
            >
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate("schedule");
                }}
              >
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
                  Generate schedules
                </Button>
              </form>
            </ActionPanel>
          ) : null}

          {allow("transfer") && assignment.current_responsibility ? (
            <ActionPanel
              title="Transfer responsibility"
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

function GuidePanel({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 sm:p-5">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-[var(--vms-action)] ring-1 ring-[var(--vms-line)]">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <ol className="mt-3 space-y-3">
        {items.map((item, index) => (
          <li
            key={item}
            className="flex gap-3 text-xs leading-5 text-[var(--vms-ink)]"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-[var(--vms-action)] ring-1 ring-[var(--vms-line)]">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </section>
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

function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
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
