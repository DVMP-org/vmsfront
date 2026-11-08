"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Share2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import type { WorkspaceRelationship } from "@/types";
import {
  accessJourneyApi,
  type CreateVisitAuthorizationInput,
  type VisitAuthorization,
  type VisitAuthorizationStatus,
} from "./api";

const MAX_INVITATION_GUESTS = 20;

const statusMeta: Record<
  VisitAuthorizationStatus,
  { label: string; className: string }
> = {
  requested: {
    label: "Awaiting approval",
    className:
      "border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]   ",
  },
  approved: {
    label: "Approved",
    className:
      "border-[var(--vms-success)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]   ",
  },
  declined: {
    label: "Declined",
    className:
      "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]   ",
  },
  expired: {
    label: "Expired",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600   ",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600   ",
  },
  revoked: {
    label: "Revoked",
    className:
      "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]   ",
  },
};

export function AccessWorkspace({
  relationship,
  partyName,
  partyEmail,
}: {
  relationship: WorkspaceRelationship;
  partyName: string;
  partyEmail?: string | null;
}) {
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState<
    string | null
  >(null);
  const queryKey = ["workspace", "visit-authorizations", relationship.place.id];
  const invitations = useQuery({
    queryKey,
    queryFn: () => accessJourneyApi.list(relationship.place.id),
    retry: false,
  });
  const cancelInvitation = useMutation({
    mutationFn: accessJourneyApi.cancel,
    onSuccess: async () => {
      toast.success("Invitation cancelled");
      await queryClient.invalidateQueries({
        queryKey: ["workspace", "visit-authorizations"],
      });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const items = useMemo(
    () => invitations.data?.items || [],
    [invitations.data?.items],
  );
  const stats = useMemo(() => countInvitations(items), [items]);
  const closeInvitation = useCallback(() => setSelectedInvitationId(null), []);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invitation code copied");
    } catch {
      toast.error("Could not copy the invitation code");
    }
  }

  const invitationColumns: Column<VisitAuthorization>[] = [
    {
      key: "guests",
      header: "Guest",
      sortable: true,
      accessor: (invitation) => (
        <div className="min-w-0">
          <strong className="block truncate text-sm">
            {invitation.guests
              .map((guest) => guest.display_name_snapshot)
              .join(", ")}
          </strong>
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-[var(--vms-ink-muted)]">
            {invitation.code}
          </span>
        </div>
      ),
    },
    {
      key: "valid_from",
      header: "Validity",
      sortable: true,
      accessor: (invitation) => (
        <span className="whitespace-nowrap text-xs text-[var(--vms-ink-muted)]">
          {formatWindow(invitation.valid_from, invitation.valid_to)}
        </span>
      ),
    },
    {
      key: "uses_count",
      header: "Uses",
      sortable: true,
      accessor: (invitation) => (
        <span className="whitespace-nowrap text-sm tabular-nums">
          {invitation.uses_count}
          {invitation.max_uses ? ` / ${invitation.max_uses}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (invitation) => {
        const status = statusMeta[invitation.status];
        return (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (invitation) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setSelectedInvitationId(invitation.id)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2.5 text-xs font-semibold hover:bg-[var(--vms-surface-subtle)]"
          >
            View
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => copyCode(invitation.code)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2.5 text-xs font-semibold hover:bg-[var(--vms-surface-subtle)]"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy
          </button>
        </div>
      ),
    },
  ];
  const invitationBulkActions: BulkAction[] = [
    {
      label: "Copy selected codes",
      icon: Copy,
      onClick: async (ids) => {
        const codes = items
          .filter((invitation) => ids.includes(invitation.id))
          .map((invitation) => invitation.code);
        try {
          await navigator.clipboard.writeText(codes.join("\n"));
          toast.success(
            `${codes.length} invitation code${codes.length === 1 ? "" : "s"} copied.`,
          );
        } catch {
          toast.error("Invitation codes could not be copied.");
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Summary
          icon={CalendarClock}
          label="Active invitations"
          value={stats.active}
          detail="Approved and currently valid"
        />
        <Summary
          icon={Clock3}
          label="Awaiting approval"
          value={stats.requested}
          detail="Submitted to site administration"
        />
        <Summary
          icon={Users}
          label="Guests invited"
          value={stats.guests}
          detail="Across all listed invitations"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm  ">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5  sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Visitor invitations</h2>
            <p className="mt-1 text-sm text-zinc-500 ">
              Invite visitors to {relationship.place.name} and follow their
              approval and arrival status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {showComposer ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {showComposer ? "Close" : "Create invitation"}
          </button>
        </div>

        {showComposer ? (
          <InvitationComposer
            destinationPlaceId={relationship.place.id}
            destinationName={relationship.place.name}
            partyName={partyName}
            partyEmail={partyEmail}
            onCreated={async () => {
              setShowComposer(false);
              await queryClient.invalidateQueries({ queryKey });
            }}
          />
        ) : null}

        <div className="p-3">
          <DataTable
            data={items}
            columns={invitationColumns}
            tableLabel="Workspace visitor invitations"
            searchPlaceholder="Search invitations"
            isLoading={invitations.isPending}
            errorMessage={
              invitations.isError
                ? parseApiError(invitations.error).message
                : undefined
            }
            onRetry={() => invitations.refetch()}
            emptyMessage="No invitations yet"
            selectable
            getRowId={(invitation) => invitation.id}
            bulkActions={invitationBulkActions}
            showPagination={items.length > 10}
            pageSize={10}
            mobileSummary={(invitation) => (
              <InvitationRow
                invitation={invitation}
                cancelling={
                  cancelInvitation.isPending &&
                  cancelInvitation.variables === invitation.id
                }
                onCopy={() => copyCode(invitation.code)}
                onOpen={() => setSelectedInvitationId(invitation.id)}
                onCancel={() => cancelInvitation.mutate(invitation.id)}
              />
            )}
          />
        </div>
      </section>

      {relationship.place.address ? (
        <section className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm  ">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div>
            <p className="font-medium">Destination</p>
            <p className="mt-0.5 text-zinc-500 ">
              {relationship.place.address}
            </p>
          </div>
        </section>
      ) : null}

      {selectedInvitationId ? (
        <InvitationDetail
          invitationId={selectedInvitationId}
          onClose={closeInvitation}
          onCancel={() => cancelInvitation.mutate(selectedInvitationId)}
          cancelling={
            cancelInvitation.isPending &&
            cancelInvitation.variables === selectedInvitationId
          }
        />
      ) : null}
    </div>
  );
}

function InvitationComposer({
  destinationPlaceId,
  destinationName,
  partyName,
  partyEmail,
  onCreated,
}: {
  destinationPlaceId: string;
  destinationName: string;
  partyName: string;
  partyEmail?: string | null;
  onCreated: () => Promise<void>;
}) {
  const [guests, setGuests] = useState<GuestDraft[]>([createGuestDraft()]);
  const [purpose, setPurpose] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [validFrom, setValidFrom] = useState(() => toLocalInput(new Date()));
  const [validTo, setValidTo] = useState(() =>
    toLocalInput(new Date(Date.now() + 4 * 60 * 60 * 1000)),
  );
  const [error, setError] = useState<string | null>(null);
  const createInvitation = useMutation({
    mutationFn: accessJourneyApi.create,
    onSuccess: async () => {
      toast.success("Invitation submitted");
      await onCreated();
    },
    onError: (mutationError) => setError(parseApiError(mutationError).message),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const start = new Date(validFrom);
    const end = new Date(validTo);
    const missingGuest = guests.findIndex(
      (guest) => !guest.display_name.trim(),
    );
    if (missingGuest !== -1) {
      setError(`Enter visitor ${missingGuest + 1}’s name.`);
      return;
    }
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setError("Choose a valid access window.");
      return;
    }
    if (end <= start) {
      setError("The access window must end after it starts.");
      return;
    }
    const input: CreateVisitAuthorizationInput = {
      destination_place_id: destinationPlaceId,
      valid_from: start.toISOString(),
      valid_to: end.toISOString(),
      max_uses: Math.max(1, maxUses),
      purpose: purpose.trim() || null,
      guests: guests.map((guest) => ({
        display_name: guest.display_name.trim(),
        email: guest.email.trim() || undefined,
        phone: guest.phone.trim() || undefined,
      })),
    };
    createInvitation.mutate(input);
  }

  return (
    <form
      onSubmit={submit}
      className="border-b border-zinc-200 bg-zinc-50/80 p-5  "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Create a visitor invitation</h3>
          <p className="mt-1 text-sm text-zinc-500 ">
            Hosted by {partyName} at {destinationName}.
          </p>
        </div>
        {partyEmail ? (
          <span className="hidden rounded-full bg-white px-3 py-1 text-xs text-zinc-500 shadow-sm   sm:block">
            {partyEmail}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Purpose">
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Visit, delivery, meeting…"
            className={inputClass}
          />
        </Field>
        <Field label="Access starts" required>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Access ends" required>
          <input
            type="datetime-local"
            value={validTo}
            onChange={(event) => setValidTo(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Maximum entries">
          <input
            type="number"
            min={1}
            max={100}
            value={maxUses}
            onChange={(event) => setMaxUses(Number(event.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <section
        className="mt-5 rounded-lg border border-zinc-200 bg-white p-4  "
        aria-label="Invited guests"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Guests</h4>
            <p className="mt-0.5 text-xs text-zinc-500 ">
              Add everyone covered by this invitation.
            </p>
          </div>
          <button
            type="button"
            disabled={guests.length >= MAX_INVITATION_GUESTS}
            onClick={() =>
              setGuests((current) => [...current, createGuestDraft()])
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50  "
          >
            <Plus className="h-3.5 w-3.5" />
            Add another guest
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {guests.map((guest, index) => (
            <div
              key={guest.id}
              className="rounded-md border border-zinc-200 p-3 "
            >
              <div className="mb-3 flex items-center justify-between">
                <strong className="text-xs uppercase tracking-[0.08em] text-zinc-500 ">
                  Guest {index + 1}
                </strong>
                {guests.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Remove guest ${index + 1}`}
                    onClick={() =>
                      setGuests((current) =>
                        current.filter((item) => item.id !== guest.id),
                      )
                    }
                    className="text-xs font-semibold text-[var(--vms-danger)] hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field
                  label={
                    index === 0
                      ? "Visitor name"
                      : `Additional visitor ${index} name`
                  }
                  required
                >
                  <input
                    value={guest.display_name}
                    onChange={(event) =>
                      updateGuest(
                        setGuests,
                        guest.id,
                        "display_name",
                        event.target.value,
                      )
                    }
                    placeholder="Full name"
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={
                    index === 0 ? "Email" : `Additional visitor ${index} email`
                  }
                >
                  <input
                    type="email"
                    value={guest.email}
                    onChange={(event) =>
                      updateGuest(
                        setGuests,
                        guest.id,
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={
                    index === 0 ? "Phone" : `Additional visitor ${index} phone`
                  }
                >
                  <input
                    type="tel"
                    value={guest.phone}
                    onChange={(event) =>
                      updateGuest(
                        setGuests,
                        guest.id,
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2 text-sm text-[var(--vms-danger)]   "
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={createInvitation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createInvitation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <UserRound className="h-4 w-4" />
          )}
          Submit invitation
        </button>
      </div>
    </form>
  );
}

interface GuestDraft {
  id: string;
  display_name: string;
  email: string;
  phone: string;
}

function createGuestDraft(): GuestDraft {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random()}`,
    display_name: "",
    email: "",
    phone: "",
  };
}

function updateGuest(
  setGuests: React.Dispatch<React.SetStateAction<GuestDraft[]>>,
  guestId: string,
  field: "display_name" | "email" | "phone",
  value: string,
) {
  setGuests((current) =>
    current.map((guest) =>
      guest.id === guestId ? { ...guest, [field]: value } : guest,
    ),
  );
}

function InvitationRow({
  invitation,
  cancelling,
  onCopy,
  onOpen,
  onCancel,
}: {
  invitation: VisitAuthorization;
  cancelling: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onCancel: () => void;
}) {
  const status = statusMeta[invitation.status];
  const cancellable =
    invitation.status === "requested" || invitation.status === "approved";
  return (
    <article className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">
            {invitation.guests
              .map((guest) => guest.display_name_snapshot)
              .join(", ")}
          </h3>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 ">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatWindow(invitation.valid_from, invitation.valid_to)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {invitation.uses_count}
            {invitation.max_uses ? ` / ${invitation.max_uses}` : ""} entries
          </span>
          {invitation.purpose ? <span>{invitation.purpose}</span> : null}
        </div>
        <p className="mt-3 font-mono text-sm font-semibold tracking-[0.08em]">
          {invitation.code}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50   "
        >
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50   "
        >
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </button>
        {cancellable ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-lg border border-[var(--vms-danger)] px-3 py-2 text-xs font-semibold text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)] disabled:opacity-50   "
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function InvitationDetail({
  invitationId,
  onClose,
  onCancel,
  cancelling,
}: {
  invitationId: string;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const invitation = useQuery({
    queryKey: ["workspace", "visit-authorization", invitationId],
    queryFn: () => accessJourneyApi.get(invitationId),
    retry: false,
  });
  const checkpointEvents = useQuery({
    queryKey: ["workspace", "visit-checkpoint-events", invitationId],
    queryFn: () => accessJourneyApi.checkpointEvents(invitationId),
    enabled: invitation.isSuccess,
    retry: false,
  });
  const data = invitation.data;
  const status = data ? statusMeta[data.status] : null;

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  async function shareInvitation() {
    if (!data) return;
    const text = [
      `Visitor invitation for ${data.destination_place.name}`,
      `Code: ${data.code}`,
      `Valid: ${formatWindow(data.valid_from, data.valid_to)}`,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Visitor invitation", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Invitation details copied");
      }
    } catch {
      toast.error("Could not share the invitation");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-detail-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-2xl   sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 ">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 ">
              Visitor invitation
            </p>
            <h2
              id="invitation-detail-title"
              className="mt-1 text-lg font-semibold"
            >
              {data
                ? data.guests
                    .map((guest) => guest.display_name_snapshot)
                    .join(", ")
                : "Loading invitation"}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close invitation details"
            className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50   "
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {invitation.isError ? (
          <div className="p-5">
            <ErrorState
              message={parseApiError(invitation.error).message}
              onRetry={() => invitation.refetch()}
            />
          </div>
        ) : invitation.isPending || !data ? (
          <LoadingRows />
        ) : (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {status ? (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              ) : null}
              <span className="text-xs text-zinc-500 ">
                Requested {formatDateTime(data.requested_at)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-4">
                <DetailLine
                  icon={MapPin}
                  label="Destination"
                  value={`${data.destination_place.name}${
                    data.destination_place.address
                      ? ` · ${data.destination_place.address}`
                      : ""
                  }`}
                />
                <DetailLine
                  icon={CalendarClock}
                  label="Access window"
                  value={formatWindow(data.valid_from, data.valid_to)}
                />
                <DetailLine
                  icon={CheckCircle2}
                  label="Entry allowance"
                  value={`${data.uses_count} used${
                    data.max_uses ? ` of ${data.max_uses}` : " · unlimited"
                  }`}
                />
                <DetailLine
                  icon={UserRound}
                  label="Host"
                  value={data.host_party.display_name}
                />
                {data.purpose ? (
                  <DetailLine
                    icon={KeyRound}
                    label="Purpose"
                    value={data.purpose}
                  />
                ) : null}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center  ">
                <div className="mx-auto grid h-36 w-36 place-items-center rounded-lg bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    value={data.qr_code_url || data.code}
                    size={120}
                    level="M"
                  />
                </div>
                <p className="mt-3 break-all font-mono text-sm font-semibold tracking-[0.08em]">
                  {data.code}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 ">
                  Present this code at arrival
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Guests</h3>
              <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200  ">
                {data.guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {guest.display_name_snapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 ">
                        {guest.email_snapshot ||
                          guest.phone_snapshot ||
                          "No contact provided"}
                      </p>
                    </div>
                    <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-[10px] text-zinc-600  ">
                      {guest.suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ArrivalHistory
              events={checkpointEvents.data?.items || []}
              loading={checkpointEvents.isPending}
              error={
                checkpointEvents.isError
                  ? parseApiError(checkpointEvents.error).message
                  : null
              }
              onRetry={() => checkpointEvents.refetch()}
            />

            {data.decline_reason ? (
              <div className="rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]   ">
                <p className="font-semibold">Declined</p>
                <p className="mt-1">{data.decline_reason}</p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4  sm:flex-row sm:justify-end">
              {(data.status === "requested" || data.status === "approved") && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className="rounded-lg border border-[var(--vms-danger)] px-3 py-2 text-sm font-semibold text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)] disabled:opacity-50   "
                >
                  {cancelling ? "Cancelling…" : "Cancel invitation"}
                </button>
              )}
              <button
                type="button"
                onClick={shareInvitation}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 py-2 text-sm font-semibold text-white"
              >
                <Share2 className="h-4 w-4" />
                Share invitation
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ArrivalHistory({
  events,
  loading,
  error,
  onRetry,
}: {
  events: Array<{
    id: string;
    direction: "entry" | "exit";
    outcome: "allowed" | "denied";
    reason_code: string;
    occurred_at: string;
    gate_id: string;
  }>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="arrival-history-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="arrival-history-title" className="text-sm font-semibold">
            Arrival history
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 ">
            Checkpoint decisions recorded for this invitation.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600  ">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-500 ">Loading arrival history…</p>
      ) : error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]   ">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-semibold">
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-500  ">
          No checkpoint events yet.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200  ">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium capitalize">
                  {event.direction} · {event.outcome}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 ">
                  Gate {event.gate_id.slice(0, 8)} · {event.reason_code}
                </p>
              </div>
              <time
                dateTime={event.occurred_at}
                className="text-right text-xs text-zinc-500 "
              >
                {formatDateTime(event.occurred_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500  ">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 ">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm  ">
      <Icon className="h-5 w-5 text-[var(--vms-action)] " />
      <p className="mt-4 text-xs font-medium text-zinc-500 ">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 ">{detail}</p>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      <span>
        {label}
        {required ? (
          <span className="ml-1 text-[var(--vms-danger)]">*</span>
        ) : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="p-6">
      <div className="flex items-start gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]   ">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Invitations unavailable</p>
          <p className="mt-1">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" role="status">
      <span className="sr-only">Loading invitations</span>
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-lg bg-zinc-100 "
        />
      ))}
    </div>
  );
}

function countInvitations(items: VisitAuthorization[]) {
  const now = Date.now();
  return items.reduce(
    (counts, invitation) => ({
      requested: counts.requested + (invitation.status === "requested" ? 1 : 0),
      active:
        counts.active +
        (invitation.status === "approved" &&
        new Date(invitation.valid_from).getTime() <= now &&
        new Date(invitation.valid_to).getTime() > now
          ? 1
          : 0),
      guests: counts.guests + invitation.guests.length,
    }),
    { requested: 0, active: 0, guests: 0 },
  );
}

function formatWindow(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(from))} – ${formatter.format(new Date(to))}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)]/20   ";
