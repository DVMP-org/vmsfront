"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
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
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { adminService } from "@/services/admin-service";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import {
  chargesApi,
  type Assignment,
  type Definition,
  type Schedule,
} from "./api";
import "./charges.css";

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
  const organization = useAppStore((state) => state.organization);
  const user = useAuthStore((state) => state.user);
  const contextKey = `${organization?.id}:${user?.id}`;
  const profile = useQuery({
    queryKey: ["charges-profile", contextKey],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: !!organization && !!user,
    staleTime: 0,
  });
  const allow = (permission: string) =>
    !profile.isError &&
    profile.isFetchedAfterMount &&
    hasAdminPermission(profile.data, `charges.${permission}`);

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
    action === "new" || action === "assign" ? "create" : action ? "show" : "list";
  if (!allow(required)) {
    return (
      <PageState
        title="Charge access is restricted"
        detail="You do not have permission to use this charge page. Ask an organization administrator to review your role."
      />
    );
  }

  return (
    <main className="space-y-5 pb-10 text-[#0f1b31]">
      <ChargeHeader action={action} />
      {action === "new" ? (
        <NewDefinition />
      ) : action === "assign" ? (
        <AssignCharge id={id!} contextKey={contextKey} />
      ) : action === "definition" ? (
        <DefinitionDetail
          id={id!}
          contextKey={contextKey}
          allow={allow}
        />
      ) : action === "assignment" ? (
        <AssignmentDetail
          id={id!}
          contextKey={contextKey}
          allow={allow}
        />
      ) : (
        <Directory contextKey={contextKey} allow={allow} />
      )}
    </main>
  );
}

function ChargeHeader({ action }: { action?: ChargeAction }) {
  return (
    <header className="border-b border-[#dce3ee] pb-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
        <ReceiptText className="h-3.5 w-3.5 text-[#2563eb]" />
        <span>Finance</span>
        <span className="text-[#c3cad6]">/</span>
        <span>Charges</span>
        {action ? (
          <>
            <span className="text-[#c3cad6]">/</span>
            <span className="capitalize">{action}</span>
          </>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] sm:text-[36px]">
            Charges
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#667085]">
            Define what is billed, assign it to a property, and keep the
            responsible Party and every schedule visible.
          </p>
        </div>
        <Link
          href="/admin/charges"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] hover:underline"
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
  allow,
}: {
  contextKey: string;
  allow: (permission: string) => boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["charges", contextKey, "definitions", page],
    queryFn: () => chargesApi.definitions(page),
  });
  const activeOnPage =
    query.data?.items.filter((definition) => definition.is_active).length || 0;

  return (
    <>
      <section className="grid overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:grid-cols-3">
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

      <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#dce3ee] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Charge definitions</h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Reusable amounts and schedules. Assignments connect a definition
              to a property and payer.
            </p>
          </div>
          {allow("create") ? (
            <Link
              href="/admin/charges/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create charge
            </Link>
          ) : null}
        </div>

        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <InlineFailure
            title="Charges could not be loaded"
            error={query.error}
            onRetry={() => query.refetch()}
          />
        ) : query.data.items.length ? (
          <div className="overflow-x-auto">
            <div
              className="charge-directory-header border-b border-[#edf0f5] bg-[#f8faff] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]"
              style={directoryGridStyle}
            >
              <span>Charge</span>
              <span>Amount</span>
              <span>Schedule</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y divide-[#edf0f5]">
              {query.data.items.map((definition) => (
                <li key={definition.id}>
                  <Link
                    href={`/admin/charges/definitions/${definition.id}`}
                    className="charge-directory-row px-4 py-3.5 transition hover:bg-[#f8faff]"
                    style={directoryGridStyle}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-semibold">
                        {definition.name}
                      </strong>
                      <span className="mt-0.5 block truncate text-xs text-[#667085]">
                        {definition.description || "No description"}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(
                        definition.amount,
                        definition.currency,
                      )}
                    </span>
                    <span className="text-sm capitalize text-[#475467]">
                      {recurrenceLabel(definition.recurrence)}
                    </span>
                    <span>
                      <StatusBadge active={definition.is_active} />
                    </span>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 justify-self-end text-[#98a2b3] md:block" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="No charges yet."
            detail="Create a definition first, then assign it to a property and responsible person."
            action={
              allow("create") ? (
                <Link
                  href="/admin/charges/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create the first charge
                </Link>
              ) : null
            }
          />
        )}

        <Pagination
          page={page}
          totalPages={query.data?.total_pages || 0}
          busy={query.isFetching}
          onPage={setPage}
        />
      </section>
    </>
  );
}

function NewDefinition() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [recurrence, setRecurrence] = useState("one_time");
  const mutation = useMutation({
    mutationFn: () =>
      chargesApi.create({
        name: name.trim(),
        description: description.trim() || null,
        amount,
        currency,
        recurrence,
      }),
    onSuccess: (definition) =>
      router.push(`/admin/charges/definitions/${definition.id}`),
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <section className="rounded-lg border border-[#dce3ee] bg-white p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Create a charge</h2>
          <p className="mt-1 text-xs text-[#667085]">
            Start with the reusable amount and recurrence. Property and payer
            are selected during assignment.
          </p>
        </div>
        <form className="mt-5 space-y-4" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}>
          <fieldset className="space-y-4" disabled={mutation.isPending}>
            <FormField label="Name" hint="A short name operators will recognise.">
              <input
                aria-label="Name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Monthly service charge"
                className={inputClass}
              />
            </FormField>
            <FormField
              label="Description"
              hint="Optional context shown on the definition."
            >
              <textarea
                aria-label="Description"
                maxLength={500}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this charge covers"
                className={inputClass}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Amount">
                <input
                  aria-label="Amount"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="25000.00"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Currency">
                <input
                  aria-label="Currency"
                  required
                  pattern="[A-Z]{3}"
                  minLength={3}
                  maxLength={3}
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  className={inputClass}
                />
              </FormField>
            </div>
            <FormField label="Recurrence">
              <select
                aria-label="Recurrence"
                value={recurrence}
                onChange={(event) => setRecurrence(event.target.value)}
                className={inputClass}
              >
                {Object.entries(recurrenceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </fieldset>
          {mutation.isError ? (
            <InlineError error={mutation.error} />
          ) : null}
          <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4">
            <Link href="/admin/charges" className={secondaryButtonClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={primaryButtonClass}
            >
              {mutation.isPending ? "Creating charge…" : "Create charge"}
            </button>
          </div>
        </form>
      </section>

      <GuidePanel
        icon={CircleDollarSign}
        title="How charging works"
        items={[
          "A definition describes the amount and recurrence.",
          "An assignment connects it to a property and responsible Party.",
          "Schedules carry the due date and outstanding balance.",
          "Changing responsibility affects unpaid schedules after review.",
        ]}
      />
    </div>
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
  return (
    <>
      <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#edf3ff] text-[#2563eb]">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold">
                  {definition.name}
                </h2>
                <StatusBadge active={definition.is_active} />
              </div>
              <p className="mt-1 text-sm text-[#667085]">
                {definition.description || "No description provided."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {allow("create") && definition.is_active ? (
              <Link
                href={`/admin/charges/definitions/${id}/assign`}
                className={primaryButtonClass}
              >
                <UserRound className="h-3.5 w-3.5" />
                Assign to a property
              </Link>
            ) : null}
            {allow("update") ? (
              <button
                type="button"
                disabled={toggle.isPending}
                onClick={() => toggle.mutate()}
                className={secondaryButtonClass}
              >
                {definition.is_active
                  ? "Deactivate future assignments"
                  : "Activate charge"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid border-t border-[#edf0f5] sm:grid-cols-3">
          <Fact label="Amount" value={formatMoney(definition.amount, definition.currency)} />
          <Fact label="Recurrence" value={recurrenceLabel(definition.recurrence)} />
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
          <div className="border-t border-[#edf0f5] p-4">
            <InlineError error={toggle.error} />
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
        <div className="border-b border-[#dce3ee] px-4 py-3.5">
          <h2 className="text-sm font-semibold">Property assignments</h2>
          <p className="mt-0.5 text-xs text-[#667085]">
            The property receiving the charge and the Party responsible for
            payment.
          </p>
        </div>
        {!allow("list") ? (
          <RestrictedState detail="You can view the definition, but not its property assignments." />
        ) : assignments.isPending ? (
          <TableSkeleton rows={3} />
        ) : assignments.isError ? (
          <InlineFailure
            title="Assignments could not be loaded"
            error={assignments.error}
            onRetry={() => assignments.refetch()}
          />
        ) : assignments.data.items.length ? (
          <ul className="divide-y divide-[#edf0f5]">
            {assignments.data.items.map((assignment) => (
              <li key={assignment.id}>
                <Link
                  href={`/admin/charges/assignments/${assignment.id}`}
                  className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-[#f8faff] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">
                      {assignment.target_place.name}
                    </strong>
                    <span className="mt-0.5 block truncate text-xs text-[#667085]">
                      Responsible:{" "}
                      {assignment.current_responsibility?.responsible_party
                        .display_name || "No responsible person"}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 text-xs">
                    <span>
                      Outstanding{" "}
                      <strong className="tabular-nums">
                        {formatMoney(
                          assignment.outstanding_amount,
                          assignment.charge_definition.currency,
                        )}
                      </strong>
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#98a2b3]" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Landmark}
            title="No assignments yet."
            detail="Assign this charge to a property and responsible Party to generate schedules."
          />
        )}
        <Pagination
          page={page}
          totalPages={assignments.data?.total_pages || 0}
          busy={assignments.isFetching}
          onPage={setPage}
        />
      </section>
    </>
  );
}

function AssignCharge({
  id,
  contextKey,
}: {
  id: string;
  contextKey: string;
}) {
  const router = useRouter();
  const [place, setPlace] = useState<FacetItem | null>(null);
  const [party, setParty] = useState<FacetItem | null>(null);
  const [scheduleCount, setScheduleCount] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState("");
  const definition = useQuery({
    queryKey: ["charges", contextKey, "definition", id],
    queryFn: () => chargesApi.definition(id),
  });
  const mutation = useMutation({
    mutationFn: () =>
      chargesApi.assign({
        charge_definition_id: id,
        target_place_id: place!.value,
        responsible_party_id: party!.value,
        schedule_count: scheduleCount,
        ...(firstDueDate ? { first_due_date: firstDueDate } : {}),
      }),
    onSuccess: (assignment) =>
      router.push(`/admin/charges/assignments/${assignment.id}`),
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <section className="rounded-lg border border-[#dce3ee] bg-white p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:p-5">
        <h2 className="text-base font-semibold">
          Assign {definition.data?.name || "charge"}
        </h2>
        <p className="mt-1 text-xs text-[#667085]">
          Choose where the charge applies and who is currently responsible for
          paying it.
        </p>
        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <fieldset className="space-y-5" disabled={mutation.isPending}>
            <FacetPicker
              facet="places"
              label="Target property or space"
              value={place}
              onChange={setPlace}
              contextKey={contextKey}
            />
            <FacetPicker
              facet="parties"
              label="Responsible person or organization"
              value={party}
              onChange={setParty}
              contextKey={contextKey}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Initial schedules"
                hint="Between 1 and 120 schedules."
              >
                <input
                  aria-label="Initial schedules"
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={scheduleCount}
                  onChange={(event) =>
                    setScheduleCount(Number(event.target.value))
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField
                label="First due date"
                hint="Optional; the server supplies its normal schedule date."
              >
                <input
                  aria-label="First due date"
                  type="date"
                  value={firstDueDate}
                  onChange={(event) => setFirstDueDate(event.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
          </fieldset>
          {mutation.isError ? <InlineError error={mutation.error} /> : null}
          <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4">
            <Link href={`/admin/charges/definitions/${id}`} className={secondaryButtonClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || !place || !party}
              className={primaryButtonClass}
            >
              {mutation.isPending ? "Creating assignment…" : "Create assignment"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-[#cddbf5] bg-[#f1f6ff] p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
          Review before commit
        </p>
        <h2 className="mt-1 text-base font-semibold">
          {definition.data
            ? formatMoney(definition.data.amount, definition.data.currency)
            : "Charge amount"}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#667085]">
          {definition.data
            ? recurrenceLabel(definition.data.recurrence)
            : "Loading recurrence"}
        </p>
        <dl className="mt-5 space-y-3 text-xs">
          <ReviewFact icon={Landmark} label="Property" value={place?.label} />
          <ReviewFact icon={UserRound} label="Responsible Party" value={party?.label} />
          <ReviewFact
            icon={CalendarDays}
            label="Schedules"
            value={`${scheduleCount} scheduled charge${scheduleCount === 1 ? "" : "s"}`}
          />
        </dl>
        <div className="mt-5 flex gap-2 rounded-md bg-white p-3 text-xs leading-5 text-[#475467] ring-1 ring-[#d6e2f8]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />
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
  const query = useQuery({
    queryKey: ["charges", contextKey, "assignment", id],
    queryFn: () => chargesApi.assignment(id),
  });
  const schedules = useQuery({
    queryKey: ["charges", contextKey, "schedules", id, page],
    queryFn: () => chargesApi.schedules(id, page),
    enabled: allow("list"),
  });
  const mutation = useMutation({
    mutationFn: (operation: "transfer" | "schedule") =>
      operation === "transfer"
        ? chargesApi.transfer(id, {
            responsible_party_id: newParty!.value,
            expected_responsibility_id:
              query.data!.current_responsibility!.id,
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
  return (
    <>
      <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
              Charge assignment
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {assignment.charge_definition.name}
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              {assignment.target_place.name} · Responsible:{" "}
              {assignment.current_responsibility?.responsible_party
                .display_name || "Unassigned"}
            </p>
          </div>
          <Link
            href={`/admin/charges/definitions/${assignment.charge_definition_id}`}
            className={secondaryButtonClass}
          >
            View definition
          </Link>
        </div>
        <div className="grid border-t border-[#edf0f5] sm:grid-cols-3">
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
        <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
          <div className="border-b border-[#dce3ee] px-4 py-3.5">
            <h2 className="text-sm font-semibold">Schedules and balances</h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Amount, due date and remaining balance for this assignment.
            </p>
          </div>
          {!allow("list") ? (
            <RestrictedState detail="You can view the assignment, but not its schedules." />
          ) : schedules.isPending ? (
            <TableSkeleton rows={4} />
          ) : schedules.isError ? (
            <InlineFailure
              title="Schedules could not be loaded"
              error={schedules.error}
              onRetry={() => schedules.refetch()}
            />
          ) : schedules.data.items.length ? (
            <>
              <div className="overflow-x-auto">
                <div
                  className="charge-schedule-header border-b border-[#edf0f5] bg-[#f8faff] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]"
                  style={scheduleGridStyle}
                >
                  <span>Due date</span>
                  <span>Amount</span>
                  <span>Balance</span>
                  <span>Status</span>
                </div>
                <ul className="divide-y divide-[#edf0f5]">
                  {schedules.data.items.map((schedule) => (
                    <ScheduleRow key={schedule.id} schedule={schedule} />
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No schedules yet."
              detail="Generate a schedule when the assignment is ready to bill."
            />
          )}
          <Pagination
            page={page}
            totalPages={schedules.data?.total_pages || 0}
            busy={schedules.isFetching}
            onPage={setPage}
          />
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
                <FormField label="Schedules">
                  <input
                    aria-label="Schedules"
                    type="number"
                    min={1}
                    max={120}
                    value={scheduleCount}
                    onChange={(event) =>
                      setScheduleCount(Number(event.target.value))
                    }
                    className={inputClass}
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={primaryButtonClass}
                >
                  Generate schedules
                </button>
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
                  if (
                    window.confirm(
                      "Transfer responsibility for unpaid charges?",
                    )
                  ) {
                    mutation.mutate("transfer");
                  }
                }}
              >
                <FacetPicker
                  facet="parties"
                  label="New responsible person or organization"
                  value={newParty}
                  onChange={setNewParty}
                  contextKey={contextKey}
                />
                <FormField label="Reason">
                  <input
                    aria-label="Reason"
                    required
                    maxLength={255}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why responsibility is changing"
                    className={inputClass}
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={
                    !newParty || !reason.trim() || mutation.isPending
                  }
                  className={primaryButtonClass}
                >
                  Review and transfer
                </button>
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
    </>
  );
}

function ScheduleRow({ schedule }: { schedule: Schedule }) {
  return (
    <li
      className="charge-schedule-row px-4 py-3 text-sm"
      style={scheduleGridStyle}
    >
      <span className="font-medium">
        {formatDate(schedule.due_date)}
      </span>
      <span className="tabular-nums">
        {formatMoney(schedule.amount, schedule.currency)}
      </span>
      <span className="tabular-nums text-[#475467]">
        {formatMoney(schedule.balance, schedule.currency)}
      </span>
      <span className="w-fit rounded-full bg-[#f1f6ff] px-2 py-1 text-[10px] font-semibold capitalize text-[#1d4ed8]">
        {schedule.status}
      </span>
    </li>
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
    <section className="rounded-lg border border-[#dce3ee] bg-white p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-[#344054]">
      {label}
      <span className="mt-1.5 block">{children}</span>
      {hint ? (
        <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#98a2b3]">
          {hint}
        </span>
      ) : null}
    </label>
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
    <div className="border-b border-[#edf0f5] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-xs text-[#667085]">{label}</span>
          <strong className="mt-2 block text-[24px] font-semibold leading-none tracking-[-0.035em]">
            {value}
          </strong>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[#f1f6ff] text-[#2563eb]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[#98a2b3]">{detail}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#edf0f5] px-4 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
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
    <section className="rounded-lg border border-[#cddbf5] bg-[#f1f6ff] p-4 sm:p-5">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-[#2563eb] ring-1 ring-[#d6e2f8]">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <ol className="mt-3 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-xs leading-5 text-[#475467]">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-[#2563eb] ring-1 ring-[#d6e2f8]">
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
    <div className="flex items-start gap-3 border-b border-[#d6e2f8] pb-3 last:border-0 last:pb-0">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
          {label}
        </dt>
        <dd className="mt-0.5 font-medium text-[#0f1b31]">
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

function Pagination({
  page,
  totalPages,
  busy,
  onPage,
}: {
  page: number;
  totalPages: number;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Charge pagination"
      className="flex items-center justify-between border-t border-[#edf0f5] px-4 py-3 text-xs"
    >
      <span className="text-[#667085]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPage(page - 1)}
          className={secondaryButtonClass}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages || busy}
          onClick={() => onPage(page + 1)}
          className={secondaryButtonClass}
        >
          Next
        </button>
      </div>
    </nav>
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
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-[#f1f6ff] text-[#2563eb]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#667085]">
        {detail}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function RestrictedState({ detail }: { detail: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-6 text-sm text-[#667085]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {detail}
    </div>
  );
}

function InlineError({ error }: { error: unknown }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
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
      <p className="mt-1 text-xs text-[#667085]">
        {parseApiError(error).message}
      </p>
      <button type="button" onClick={onRetry} className={`${secondaryButtonClass} mt-4`}>
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
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
      className="rounded-lg border border-[#dce3ee] bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,27,49,0.04)]"
    >
      <AlertCircle className="mx-auto h-6 w-6 text-[#667085]" />
      <h1 className="mt-3 text-base font-semibold">{title}</h1>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[#667085]">
        {detail}
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`${secondaryButtonClass} mt-4`}>
          Retry
        </button>
      ) : null}
    </section>
  );
}

function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-lg bg-[#e8edf5]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg bg-[#e8edf5]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-[#e8edf5]" />
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#edf0f5] px-4" role="status">
      <span className="sr-only">Loading charge rows</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse py-3">
          <div className="h-full rounded bg-[#eef2f7]" />
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

const inputClass =
  "w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm text-[#0f1b31] outline-none transition placeholder:text-[#98a2b3] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff] disabled:cursor-not-allowed disabled:bg-[#f8fafc]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#2563eb] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-semibold text-[#475467] transition hover:border-[#94a3b8] hover:bg-[#f8faff] hover:text-[#0f1b31] disabled:cursor-not-allowed disabled:opacity-50";
const directoryGridStyle: CSSProperties = {
  display: "grid",
  minWidth: "760px",
  gridTemplateColumns:
    "minmax(0, 2fr) minmax(9rem, 1fr) minmax(8rem, 1fr) 6rem 1.5rem",
  alignItems: "center",
  gap: "1rem",
};
const scheduleGridStyle: CSSProperties = {
  display: "grid",
  minWidth: "560px",
  gridTemplateColumns: "minmax(0, 1.2fr) repeat(2, minmax(8rem, 1fr)) 7rem",
  alignItems: "center",
  gap: "1rem",
};
