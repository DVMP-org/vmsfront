"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FacetPicker, type FacetItem } from "@/components/facets/FacetPicker";
import {
  DataTable,
  type Column,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Drawer } from "@/components/ui/Drawer";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  VisitAuthorization,
  VisitAuthorizationStatus,
} from "@/features/access-journey/api";
import { parseApiError } from "@/lib/error-utils";
import { useSiteAccess } from "@/features/context/use-site-access";
import { invitationApprovalsApi, type ApprovalFilter } from "./api";

const PAGE_SIZE = 25;
const MAX_GROUP_GUESTS = 20;
const statusFilters: Array<{ value: ApprovalFilter; label: string }> = [
  { value: "all", label: "All invitations" },
  { value: "requested", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

function validStatus(value: string | null): ApprovalFilter {
  return statusFilters.some((item) => item.value === value)
    ? (value as ApprovalFilter)
    : "all";
}

function validPage(value: string | null) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function InvitationApprovals() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const queryString = searchParams?.toString() || "";
  const initial = useMemo(
    () => new URLSearchParams(queryString),
    [queryString],
  );
  const status = validStatus(initial.get("status"));
  const page = validPage(initial.get("page"));
  const search = (initial.get("search") || "").slice(0, 100);
  const access = useSiteAccess();
  const profile = access.workspace;
  const [createOpen, setCreateOpen] = useState(false);
  const allowed = (permission: string) =>
    profile.isSuccess &&
    !profile.isError &&
    access.allowed(`visit_authorizations.${permission}`);
  const canList =
    profile.data?.management?.is_administrator === true || allowed("list");
  const canCreate = allowed("create");

  const invitations = useQuery({
    queryKey: ["admin-invitation-approvals", status, page, search],
    queryFn: () =>
      invitationApprovalsApi.list({
        status,
        page,
        pageSize: PAGE_SIZE,
        search,
      }),
    enabled: canList,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const summary = useQuery({
    queryKey: ["admin-invitation-approvals", "summary"],
    queryFn: async () => {
      const [all, requested, approved, declined] = await Promise.all([
        invitationApprovalsApi.list({ status: "all", page: 1, pageSize: 1 }),
        invitationApprovalsApi.list({
          status: "requested",
          page: 1,
          pageSize: 1,
        }),
        invitationApprovalsApi.list({
          status: "approved",
          page: 1,
          pageSize: 1,
        }),
        invitationApprovalsApi.list({
          status: "declined",
          page: 1,
          pageSize: 1,
        }),
      ]);
      return {
        all: all.total,
        requested: requested.total,
        approved: approved.total,
        declined: declined.total,
      };
    },
    enabled: canList,
    retry: false,
  });

  function updateQuery(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(queryString);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === 1)
        params.delete(key);
      else params.set(key, String(value));
    });
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  if (profile.isPending) {
    return <InvitationQueueSkeleton title="Checking invitation permissions" />;
  }
  if (profile.isError) {
    return (
      <QueueError
        title="Invitation permissions are unavailable"
        error={profile.error}
        retry={() => profile.refetch()}
      />
    );
  }
  if (!canList) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Invitation access is restricted"
        description="You do not have permission to review visitor invitations for this property."
      />
    );
  }

  const items = invitations.data?.items || [];
  const summaryCounts: Record<ApprovalFilter, number | undefined> | null =
    summary.data
      ? {
          ...summary.data,
          expired: undefined,
          cancelled: undefined,
          revoked: undefined,
        }
      : null;
  const activeLabel =
    statusFilters.find((item) => item.value === status)?.label || "Invitations";
  const columns: Column<VisitAuthorization>[] = [
    {
      key: "guest",
      header: "Guest",
      sortable: true,
      accessor: (invitation) => (
        <div className="min-w-52 max-w-80">
          {invitation.guests.length > 1 ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[var(--vms-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
              <UsersRound className="h-3 w-3" aria-hidden="true" />
              Group · {invitation.guests.length} visitors
            </span>
          ) : null}
          <Link
            href={`/admin/invitations/${invitation.id}`}
            className="block font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
          >
            {invitation.guests
              .map((guest) => guest.display_name_snapshot)
              .join(", ") || "Unnamed guest"}
          </Link>
          <span className="mt-0.5 block font-mono text-[11px] text-[var(--vms-ink-muted)]">
            {invitation.code}
          </span>
        </div>
      ),
    },
    {
      key: "host_party",
      header: "Host / place",
      sortable: true,
      accessor: (invitation) => (
        <div className="text-[var(--vms-ink-muted)]">
          <span className="block text-[var(--vms-ink)]">
            {invitation.host_party.display_name}
          </span>
          <span className="block text-xs">
            {invitation.destination_place.name}
          </span>
        </div>
      ),
    },
    {
      key: "valid_from",
      header: "Validity",
      sortable: true,
      accessor: (invitation) => <Validity invitation={invitation} />,
    },
    {
      key: "uses_count",
      header: "Uses",
      sortable: true,
      accessor: (invitation) => (
        <span className="whitespace-nowrap tabular-nums text-[var(--vms-ink-muted)]">
          {invitation.uses_count}
          {invitation.max_uses ? ` / ${invitation.max_uses}` : " / unlimited"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (invitation) => <StatusBadge
        status={invitation.status}
        displayStatus={invitation.display_status}
      />,
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (invitation) => (
        <Link
          href={`/admin/invitations/${invitation.id}`}
          aria-label={`Open invitation for ${guestNames(invitation)}`}
          className="inline-flex min-h-9 items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-xs font-semibold hover:bg-[var(--vms-surface-subtle)]"
        >
          Details
        </Link>
      ),
    },
  ];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Access / Invitations"
        title="Visitor invitations"
        description="Review invitations against host, destination, validity and prior checkpoint history before deciding access."
        metadata={
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--vms-ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              <strong className="font-semibold tabular-nums text-[var(--vms-ink)]">
                {summary.data?.requested ?? "—"}
              </strong>
              awaiting approval
            </span>
            <span aria-hidden="true">·</span>
            <span>Canonical visit authorizations</span>
          </div>
        }
        primaryAction={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create invitation
            </Button>
          ) : undefined
        }
        secondaryActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => invitations.refetch()}
            isLoading={invitations.isFetching}
            loadingLabel="Refreshing"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <section
        className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Invitation summary"
      >
        <InvitationMetric
          icon={CalendarDays}
          label="All invitations"
          value={summary.data?.all}
          detail="Every invitation recorded for this Site"
        />
        <InvitationMetric
          icon={Clock3}
          label="Awaiting approval"
          value={summary.data?.requested}
          detail="Needs a SiteAdmin decision"
        />
        <InvitationMetric
          icon={CheckCircle2}
          label="Approved"
          value={summary.data?.approved}
          detail="Eligible at active Site checkpoints"
        />
        <InvitationMetric
          icon={XCircle}
          label="Declined"
          value={summary.data?.declined}
          detail="Access was not granted"
        />
      </section>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-[var(--vms-line)]"
        aria-label="Invitation status"
      >
        {statusFilters.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value}
              type="button"
              className={[
                "relative min-h-11 whitespace-nowrap px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                active
                  ? "text-[var(--vms-ink)]"
                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
              onClick={() =>
                updateQuery({
                  status: filter.value,
                  page: 1,
                  search: undefined,
                })
              }
            >
              {filter.label}
              {summaryCounts ? (
                <span className="ml-1.5 tabular-nums text-[var(--vms-ink-muted)]">
                  ({summaryCounts[filter.value] ?? 0})
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[var(--vms-active-accent)]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <DataTable
        data={items}
        columns={columns}
        tableLabel="Visitor invitation register"
        searchPlaceholder="Search code, guest or purpose"
        initialSearch={search}
        onSearchChange={(value) =>
          updateQuery({
            search: value.trim().slice(0, 100) || undefined,
            page: 1,
          })
        }
        serverSide
        total={invitations.data?.total ?? 0}
        currentPage={invitations.data?.page ?? page}
        onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        pageSize={PAGE_SIZE}
        pageSizeOptions={[PAGE_SIZE]}
        isLoading={invitations.isPending}
        errorMessage={
          invitations.isError && !invitations.data
            ? parseApiError(invitations.error).message
            : undefined
        }
        isStale={invitations.isError && !!invitations.data}
        staleMessage="Showing the last successful invitation snapshot."
        onRetry={() => invitations.refetch()}
        emptyMessage={
          search
            ? "No invitations match this search"
            : `No ${activeLabel.toLowerCase()}`
        }
        selectable
        getRowId={(invitation) => invitation.id}
        mobileSummary={(invitation) => (
          <Link href={`/admin/invitations/${invitation.id}`} className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold">
                  {invitation.guests.length > 1
                    ? `Group invitation · ${invitation.guests.length} visitors`
                    : guestNames(invitation)}
                </strong>
                <span className="mt-0.5 block font-mono text-[11px] text-[var(--vms-ink-muted)]">
                  {invitation.code}
                </span>
              </div>
              <StatusBadge
        status={invitation.status}
        displayStatus={invitation.display_status}
      />
            </div>
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
              <dt className="text-[var(--vms-ink-muted)]">Host</dt>
              <dd className="truncate text-right">
                {invitation.host_party.display_name}
              </dd>
              <dt className="text-[var(--vms-ink-muted)]">Place</dt>
              <dd className="truncate text-right">
                {invitation.destination_place.name}
              </dd>
              <dt className="text-[var(--vms-ink-muted)]">Valid</dt>
              <dd className="text-right">
                <Validity invitation={invitation} compact />
              </dd>
            </dl>
          </Link>
        )}
      />
      <CreateInvitationDrawer
        open={createOpen}
        siteId={profile.data?.site_id || ""}
        contextKey={profile.data?.organization_id || ""}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false);
          await queryClient.invalidateQueries({
            queryKey: ["admin-invitation-approvals"],
          });
        }}
      />
    </main>
  );
}

export function guestNames(invitation: VisitAuthorization) {
  const names = invitation.guests.map((guest) => guest.display_name_snapshot);
  if (names.length <= 2) return names.join(", ") || "Unnamed guest";
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

interface GuestDraft {
  id: string;
  name: string;
  email: string;
}

let guestDraftSequence = 0;

function newGuestDraft(): GuestDraft {
  guestDraftSequence += 1;
  return {
    id: `guest-draft-${guestDraftSequence}`,
    name: "",
    email: "",
  };
}

function CreateInvitationDrawer({
  open,
  siteId,
  contextKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  siteId: string;
  contextKey: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [host, setHost] = useState<FacetItem | null>(null);
  const [destination, setDestination] = useState<FacetItem | null>(null);
  const [kind, setKind] = useState<"single" | "group">("single");
  const [guests, setGuests] = useState<GuestDraft[]>(() => [newGuestDraft()]);
  const [purpose, setPurpose] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [validFrom, setValidFrom] = useState(() => toLocalDateTime(new Date()));
  const [validTo, setValidTo] = useState(() => {
    const value = new Date();
    value.setHours(value.getHours() + 4);
    return toLocalDateTime(value);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useMutation({
    mutationFn: () => {
      return invitationApprovalsApi.create({
        host_party_id: host!.value,
        site_id: siteId,
        destination_place_id: destination!.value,
        valid_from: new Date(validFrom).toISOString(),
        valid_to: new Date(validTo).toISOString(),
        max_uses: maxUses,
        status: "approved",
        purpose: purpose.trim() || undefined,
        guests: guests.map((guest, index) => ({
          display_name: guest.name.trim(),
          email: guest.email.trim() || undefined,
          suffix: String(index + 1).padStart(3, "0"),
        })),
      });
    },
    onSuccess: onSaved,
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  useEffect(() => {
    if (!open) return;
    setHost(null);
    setDestination(null);
    setKind("single");
    setGuests([newGuestDraft()]);
    setPurpose("");
    setMaxUses(1);
    setValidFrom(toLocalDateTime(new Date()));
    const end = new Date();
    end.setHours(end.getHours() + 4);
    setValidTo(toLocalDateTime(end));
    setErrors({});
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const start = new Date(validFrom);
    const end = new Date(validTo);
    if (!host) next.host = "Choose the responsible Party.";
    if (!destination) next.destination = "Choose the destination Place.";
    guests.forEach((guest, index) => {
      if (guest.name.trim().length < 2) {
        next[`guest-${index}`] = `Enter visitor ${index + 1}’s full name.`;
      }
    });
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      next.window = "Choose a valid arrival window.";
    } else if (end <= start) {
      next.window = "The invitation must end after it starts.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    create.mutate();
  }

  function updateKind(nextKind: "single" | "group") {
    setKind(nextKind);
    if (nextKind === "single") {
      setGuests((current) => current.slice(0, 1));
    } else if (guests.length < 2) {
      setGuests((current) => [...current, newGuestDraft()]);
    }
  }

  function updateGuest(
    guestId: string,
    field: "name" | "email",
    value: string,
  ) {
    setGuests((current) =>
      current.map((guest) =>
        guest.id === guestId ? { ...guest, [field]: value } : guest,
      ),
    );
  }

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title="New invitation"
      description="Create an approved visitor pass for this Site."
      className="max-w-2xl"
    >
      <form className="flex min-h-full flex-col gap-5" onSubmit={submit}>
        <FormErrorSummary errors={errors} />
        <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
          Group invitations remain one pass with one invitation code. Each
          visitor receives a numbered suffix such as 001 and 002 for checkpoint
          validation.
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">
            Visitor type <span className="text-[var(--vms-danger)]">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["single", "group"] as const).map((value) => (
              <label
                key={value}
                className={[
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--vms-radius-control)] border px-3 text-sm font-medium",
                  kind === value
                    ? "border-[var(--vms-ink)] bg-[var(--vms-surface-subtle)]"
                    : "border-[var(--vms-line)]",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="invitation-kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => updateKind(value)}
                  className="accent-[var(--vms-ink)]"
                />
                {value === "single" ? "Single" : "Group"}
              </label>
            ))}
          </div>
        </fieldset>
        <FacetPicker
          facet="parties"
          kind="person"
          label="Host Party"
          value={host}
          onChange={setHost}
          contextKey={contextKey}
          error={errors.host}
          description="The resident, tenant, employee or other Party hosting the visit."
        />
        <FacetPicker
          facet="places"
          label="Destination Place"
          value={destination}
          onChange={setDestination}
          contextKey={contextKey}
          error={errors.destination}
          description="The unit, room, office or shared Place the guest may access."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="invite-valid-from" label="Valid from" required>
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                value={validFrom}
                onChange={(event) => setValidFrom(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field id="invite-valid-to" label="Valid until" required>
            {(control) => (
              <input
                {...control}
                type="datetime-local"
                value={validTo}
                onChange={(event) => setValidTo(event.target.value)}
                className={fieldControlClassName}
              />
            )}
          </Field>
        </div>
        {errors.window ? (
          <p role="alert" className="text-sm text-[var(--vms-danger)]">
            {errors.window}
          </p>
        ) : null}
        <section
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)]"
          aria-label="Invited visitors"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">
                {kind === "group" ? "Visitors" : "Visitor"}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                Everyone listed travels under the same invitation code.
              </p>
            </div>
            {kind === "group" ? (
              <span className="text-xs font-semibold tabular-nums text-[var(--vms-ink-muted)]">
                {guests.length} / {MAX_GROUP_GUESTS}
              </span>
            ) : null}
          </div>
          <div className="space-y-4 p-4">
            {guests.map((guest, index) => (
              <div
                key={guest.id}
                className="grid gap-3 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-end"
              >
                <Field
                  id={`invite-guest-${guest.id}`}
                  label={
                    index === 0 ? "Visitor full name" : `Visitor ${index + 1}`
                  }
                  required={index === 0}
                  error={errors[`guest-${index}`]}
                >
                  {(control) => (
                    <input
                      {...control}
                      value={guest.name}
                      onChange={(event) =>
                        updateGuest(guest.id, "name", event.target.value)
                      }
                      className={fieldControlClassName}
                      autoComplete={index === 0 ? "name" : "off"}
                    />
                  )}
                </Field>
                <Field id={`invite-guest-email-${guest.id}`} label="Email">
                  {(control) => (
                    <input
                      {...control}
                      type="email"
                      value={guest.email}
                      onChange={(event) =>
                        updateGuest(guest.id, "email", event.target.value)
                      }
                      className={fieldControlClassName}
                      autoComplete={index === 0 ? "email" : "off"}
                      placeholder="Optional"
                    />
                  )}
                </Field>
                {kind === "group" && guests.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-self-start text-[var(--vms-danger)] sm:justify-self-end"
                    aria-label={`Remove visitor ${index + 1}`}
                    onClick={() =>
                      setGuests((current) =>
                        current.filter((item) => item.id !== guest.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
            {kind === "group" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={guests.length >= MAX_GROUP_GUESTS}
                onClick={() =>
                  setGuests((current) => [...current, newGuestDraft()])
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add visitor
              </Button>
            ) : null}
          </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="invite-max-uses" label="Allowed entries">
            {(control) => (
              <input
                {...control}
                type="number"
                min={1}
                max={100}
                value={maxUses}
                onChange={(event) => setMaxUses(Number(event.target.value))}
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field id="invite-purpose" label="Purpose">
            {(control) => (
              <input
                {...control}
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className={fieldControlClassName}
                placeholder="Guest, family visit, delivery"
              />
            )}
          </Field>
        </div>
        <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Checkpoint access
          </div>
          <p className="mt-1.5 text-sm">
            Active gates for this Site validate the pass. Gate-specific policy
            is applied by the Site checkpoint service.
          </p>
        </div>
        <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={create.isPending}
            loadingLabel="Creating invitation"
          >
            {kind === "group"
              ? `Create group pass · ${guests.length}`
              : "Create pass"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

function InvitationMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number | undefined;
  detail: string;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-r sm:even:border-r-0 sm:last:border-b xl:border-b-0 xl:even:border-r xl:last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-[-0.035em] tabular-nums">
            {value === undefined ? "—" : value}
          </p>
          <p className="mt-1 text-sm font-medium">{label}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
    </div>
  );
}

function toLocalDateTime(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function StatusBadge({
  status,
  displayStatus,
}: {
  status: VisitAuthorizationStatus;
  displayStatus?: string | null;
}) {
  const effective = displayStatus ?? status;
  const variant =
    effective === "active"
      ? "info"
      : effective === "approved"
        ? "success"
        : effective === "requested"
          ? "warning"
          : effective === "declined" ||
              effective === "revoked" ||
              effective === "expired"
            ? "danger"
            : "neutral";
  return (
    <Badge variant={variant}>
      {effective === "active" ? "Active" : statusLabel(effective)}
    </Badge>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Validity({
  invitation,
  compact = false,
}: {
  invitation: VisitAuthorization;
  compact?: boolean;
}) {
  return (
    <span className={compact ? "inline" : "grid gap-0.5 text-xs"}>
      <time dateTime={invitation.valid_from} className="whitespace-nowrap">
        {formatDate(invitation.valid_from)}
      </time>
      <span className="text-[var(--vms-ink-muted)]">
        {compact ? " – " : ""}
        <time dateTime={invitation.valid_to}>
          {formatDate(invitation.valid_to)}
        </time>
      </span>
    </span>
  );
}

function InvitationQueueSkeleton({ title }: { title: string }) {
  return (
    <main className="space-y-4 pb-10" role="status" aria-live="polite">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-64 w-full" />
      <span className="sr-only">{title}</span>
    </main>
  );
}

function QueueError({
  title,
  error,
  retry,
  embedded = false,
}: {
  title: string;
  error: unknown;
  retry: () => void;
  embedded?: boolean;
}) {
  return (
    <div
      role="alert"
      className={
        embedded
          ? "flex flex-wrap items-center justify-between gap-3 border-l-2 border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
          : "rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
      }
    >
      <div>
        <strong className="block font-semibold">{title}</strong>
        <p className="mt-1">{parseApiError(error).message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}
