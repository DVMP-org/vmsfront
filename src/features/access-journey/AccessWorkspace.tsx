"use client";

import { useMemo, useState } from "react";
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
import type { WorkspaceRelationship } from "@/types";
import {
  accessJourneyApi,
  type CreateVisitAuthorizationInput,
  type VisitAuthorization,
  type VisitAuthorizationStatus,
} from "./api";

const statusMeta: Record<
  VisitAuthorizationStatus,
  { label: string; className: string }
> = {
  requested: {
    label: "Awaiting approval",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  declined: {
    label: "Declined",
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  },
  expired: {
    label: "Expired",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
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

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invitation code copied");
    } catch {
      toast.error("Could not copy the invitation code");
    }
  }

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

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Visitor invitations</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Invite visitors to {relationship.place.name} and follow their
              approval and arrival status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--brand-primary,#213928))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
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

        {invitations.isError ? (
          <ErrorState
            message={parseApiError(invitations.error).message}
            onRetry={() => invitations.refetch()}
          />
        ) : invitations.isPending ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-zinc-400" />
            <h3 className="mt-4 text-base font-semibold">No invitations yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Create a visitor invitation for this workspace. Site approval may
              be required before the pass becomes active.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                cancelling={
                  cancelInvitation.isPending &&
                  cancelInvitation.variables === invitation.id
                }
                onCopy={() => copyCode(invitation.code)}
                onOpen={() => setSelectedInvitationId(invitation.id)}
                onCancel={() => cancelInvitation.mutate(invitation.id)}
              />
            ))}
          </div>
        )}
      </section>

      {relationship.place.address ? (
        <section className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div>
            <p className="font-medium">Destination</p>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              {relationship.place.address}
            </p>
          </div>
        </section>
      ) : null}

      {selectedInvitationId ? (
        <InvitationDetail
          invitationId={selectedInvitationId}
          onClose={() => setSelectedInvitationId(null)}
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
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
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
    if (!guestName.trim()) {
      setError("Enter the visitor’s name.");
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
      guests: [
        {
          display_name: guestName.trim(),
          email: guestEmail.trim() || undefined,
          phone: guestPhone.trim() || undefined,
        },
      ],
    };
    createInvitation.mutate(input);
  }

  return (
    <form
      onSubmit={submit}
      className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Create a visitor invitation</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Hosted by {partyName} at {destinationName}.
          </p>
        </div>
        {partyEmail ? (
          <span className="hidden rounded-full bg-white px-3 py-1 text-xs text-zinc-500 shadow-sm dark:bg-zinc-800 dark:text-zinc-400 sm:block">
            {partyEmail}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Visitor name" required>
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className={inputClass}
          />
        </Field>
        <Field label="Purpose">
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Visit, delivery, meeting…"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            placeholder="Optional"
            autoComplete="email"
            className={inputClass}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
            placeholder="Optional"
            autoComplete="tel"
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

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={createInvitation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--brand-primary,#213928))] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </button>
        {cancellable ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-detail-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
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
            type="button"
            onClick={onClose}
            aria-label="Close invitation details"
            className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
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

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/60">
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
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Present this code at arrival
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Guests</h3>
              <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
                {data.guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {guest.display_name_snapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {guest.email_snapshot ||
                          guest.phone_snapshot ||
                          "No contact provided"}
                      </p>
                    </div>
                    <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                <p className="font-semibold">Declined</p>
                <p className="mt-1">{data.decline_reason}</p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
              {(data.status === "requested" || data.status === "approved") && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {cancelling ? "Cancelling…" : "Cancel invitation"}
                </button>
              )}
              <button
                type="button"
                onClick={shareInvitation}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--brand-primary,#213928))] px-4 py-2 text-sm font-semibold text-white"
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
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Checkpoint decisions recorded for this invitation.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Loading arrival history…
        </p>
      ) : error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-semibold">
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No checkpoint events yet.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium capitalize">
                  {event.direction} · {event.outcome}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Gate {event.gate_id.slice(0, 8)} · {event.reason_code}
                </p>
              </div>
              <time
                dateTime={event.occurred_at}
                className="text-right text-xs text-zinc-500 dark:text-zinc-400"
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
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <Icon className="h-5 w-5 text-[rgb(var(--brand-primary,#213928))] dark:text-emerald-300" />
      <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
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
        {required ? <span className="ml-1 text-red-500">*</span> : null}
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
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
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
          className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
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
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[rgb(var(--brand-primary,#213928))] focus:ring-2 focus:ring-[rgb(var(--brand-primary,#213928)/0.12)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
