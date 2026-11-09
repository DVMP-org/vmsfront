"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock3,
  History,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CheckpointEvent } from "@/features/access-journey/api";
import { parseApiError } from "@/lib/error-utils";
import { useSiteAccess } from "@/features/context/use-site-access";
import { invitationApprovalsApi, type VisitSession } from "./api";
import { formatDate, guestNames, StatusBadge } from "./InvitationApprovals";

export function InvitationDetail({ invitationId }: { invitationId: string }) {
  const queryClient = useQueryClient();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [success, setSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const access = useSiteAccess();
  const profile = access.workspace;
  const invitation = useQuery({
    queryKey: ["admin-invitation-detail", invitationId],
    queryFn: () => invitationApprovalsApi.get(invitationId),
    retry: false,
  });
  const events = useQuery({
    queryKey: ["admin-invitation-events", invitationId],
    queryFn: () => invitationApprovalsApi.events(invitationId),
    enabled: !!invitation.data,
    retry: false,
  });
  const sessions = useQuery({
    queryKey: ["admin-invitation-sessions", invitationId],
    queryFn: () => invitationApprovalsApi.sessions(invitationId),
    enabled: !!invitation.data,
    retry: false,
  });

  const can = (permission: string) =>
    !profile.isError &&
    profile.isFetchedAfterMount &&
    access.allowed(`visit_authorizations.${permission}`);

  async function refreshAfterAction(message: string) {
    setSuccess(message);
    setActionError("");
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["admin-invitation-detail", invitationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin-invitation-approvals"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin-invitation-events", invitationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin-invitation-sessions", invitationId],
      }),
    ]);
  }

  const approve = useMutation({
    mutationFn: () => invitationApprovalsApi.approve(invitationId),
    onSuccess: () => refreshAfterAction("Invitation approved."),
    onError: (error) =>
      setActionError(parseApiError(error).message || "Approval failed."),
  });
  const decline = useMutation({
    mutationFn: (reason: string) =>
      invitationApprovalsApi.decline(invitationId, reason),
    onSuccess: async () => {
      setDeclineOpen(false);
      setDeclineReason("");
      await refreshAfterAction("Invitation declined.");
    },
    onError: (error) =>
      setActionError(parseApiError(error).message || "Decline failed."),
  });
  const revoke = useMutation({
    mutationFn: () => invitationApprovalsApi.revoke(invitationId),
    onSuccess: () => refreshAfterAction("Invitation revoked."),
    onError: (error) =>
      setActionError(parseApiError(error).message || "Revocation failed."),
  });

  function submitDecline(event: FormEvent) {
    event.preventDefault();
    const reason = declineReason.trim();
    if (!reason) {
      setActionError("Enter a reason before declining the invitation.");
      return;
    }
    decline.mutate(reason);
  }

  if (invitation.isPending || profile.isPending) {
    return <DetailSkeleton />;
  }
  if (invitation.isError) {
    return (
      <DetailError
        title="Invitation unavailable"
        detail={parseApiError(invitation.error).message}
        retry={() => invitation.refetch()}
      />
    );
  }
  if (profile.isError) {
    return (
      <DetailError
        title="Invitation permissions unavailable"
        detail={parseApiError(profile.error).message}
        retry={() => profile.refetch()}
      />
    );
  }

  const item = invitation.data;
  const requested = item.status === "requested";
  const approved = item.status === "approved";
  const actionPending =
    approve.isPending || decline.isPending || revoke.isPending;

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        breadcrumbs={
          <Link
            href="/admin/invitations"
            className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Invitations
          </Link>
        }
        eyebrow={`Invitation / ${item.code}`}
        title={
          item.guests.length > 1
            ? `Group invitation · ${item.guests.length} visitors`
            : guestNames(item)
        }
        description={
          item.purpose ||
          (item.guests.length > 1
            ? item.guests.map((guest) => guest.display_name_snapshot).join(", ")
            : "Review the host, destination, validity and checkpoint trail for this invitation.")
        }
        metadata={
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--vms-ink-muted)]">
            <StatusBadge status={item.status} />
            <span>
              Requested{" "}
              <time dateTime={item.requested_at}>
                {formatDate(item.requested_at)}
              </time>
            </span>
          </div>
        }
        primaryAction={
          requested && can("approve") ? (
            <Button
              type="button"
              onClick={() => approve.mutate()}
              isLoading={approve.isPending}
              loadingLabel="Approving"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Approve invitation
            </Button>
          ) : approved && can("revoke") ? (
            <Button
              type="button"
              variant="destructive-outlined"
              onClick={() => revoke.mutate()}
              isLoading={revoke.isPending}
              loadingLabel="Revoking"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Revoke access
            </Button>
          ) : undefined
        }
        secondaryActions={
          requested && can("decline") ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionError("");
                setDeclineOpen(true);
              }}
              disabled={actionPending}
            >
              Decline
            </Button>
          ) : undefined
        }
      />

      {success ? (
        <div
          role="status"
          className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-success)_30%,transparent)] bg-[var(--vms-success-subtle)] px-4 py-3 text-sm text-[var(--vms-success)]"
        >
          {success}
        </div>
      ) : null}
      {actionError ? (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] px-4 py-3 text-sm text-[var(--vms-danger)]"
        >
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <div className="space-y-4">
          <DetailPanel title="Invitation facts">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact
                icon={UserRound}
                label="Host"
                value={item.host_party.display_name}
              />
              <Fact
                icon={MapPin}
                label="Destination"
                value={item.destination_place.name}
                address={item.destination_place.address}
              />
              <Fact
                icon={CalendarClock}
                label="Valid from"
                value={formatDate(item.valid_from)}
                machineTime={item.valid_from}
              />
              <Fact
                icon={Clock3}
                label="Valid until"
                value={formatDate(item.valid_to)}
                machineTime={item.valid_to}
              />
              <Fact
                label="Uses"
                value={`${item.uses_count}${item.max_uses ? ` of ${item.max_uses}` : " / unlimited"}`}
              />
              <Fact label="Invitation code" value={item.code} mono />
            </dl>
          </DetailPanel>

          <DetailPanel title={`Guests (${item.guests.length})`}>
            <ul className="divide-y divide-[var(--vms-line)]">
              {item.guests.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <strong className="block text-sm font-semibold">
                      {guest.display_name_snapshot}
                    </strong>
                    <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                      Group suffix {guest.suffix}
                    </span>
                  </div>
                  <div className="grid justify-items-end gap-1 text-xs text-[var(--vms-ink-muted)]">
                    {guest.email_snapshot ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {guest.email_snapshot}
                      </span>
                    ) : null}
                    {guest.phone_snapshot ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        {guest.phone_snapshot}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </DetailPanel>

          {item.decline_reason ? (
            <DetailPanel title="Decision note">
              <p className="text-sm text-[var(--vms-danger)]">
                {item.decline_reason}
              </p>
            </DetailPanel>
          ) : null}
        </div>

        <aside className="space-y-4">
          <DetailPanel title="Access history" icon={History}>
            {events.isPending ? (
              <div
                className="space-y-2"
                role="status"
                aria-label="Loading checkpoint history"
              >
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : events.isError ? (
              <PartialError
                message={parseApiError(events.error).message}
                retry={() => events.refetch()}
              />
            ) : events.data?.items.length ? (
              <ol className="space-y-3">
                {events.data.items.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--vms-ink-muted)]">
                No checkpoint events have been recorded for this invitation.
              </p>
            )}
          </DetailPanel>

          <DetailPanel title="Visit sessions">
            {sessions.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : sessions.isError ? (
              <PartialError
                message={parseApiError(sessions.error).message}
                retry={() => sessions.refetch()}
              />
            ) : sessions.data?.items.length ? (
              <ol className="space-y-3">
                {sessions.data.items.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--vms-ink-muted)]">
                No visit session has started yet.
              </p>
            )}
          </DetailPanel>
        </aside>
      </section>

      <Modal
        isOpen={declineOpen}
        onClose={() => {
          if (!decline.isPending) setDeclineOpen(false);
        }}
        title="Decline invitation"
        description={`Decline access for ${guestNames(item)}. The host will be able to see the reason.`}
        size="sm"
      >
        <form className="space-y-4 p-5" onSubmit={submitDecline}>
          {actionError ? (
            <div
              role="alert"
              className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
            >
              {actionError}
            </div>
          ) : null}
          <label className="grid gap-1.5 text-[13px] font-semibold">
            Decline reason
            <textarea
              required
              maxLength={255}
              rows={4}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              className="min-h-28 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-base font-normal outline-none focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)] sm:text-sm"
              placeholder="Explain why this invitation cannot be approved."
            />
          </label>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeclineOpen(false)}
              disabled={decline.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={decline.isPending}
              loadingLabel="Declining"
              disabled={!declineReason.trim()}
            >
              Confirm decline
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

function DetailPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--vms-line)] px-4 py-3">
        {Icon ? (
          <Icon
            className="h-4 w-4 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
        ) : null}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  address,
  machineTime,
  mono = false,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  address?: string;
  machineTime?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--vms-ink-muted)]">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </dt>
      <dd
        className={mono ? "mt-1 break-all font-mono text-sm" : "mt-1 text-sm"}
      >
        {machineTime ? <time dateTime={machineTime}>{value}</time> : value}
      </dd>
      {address ? (
        <dd className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
          {address}
        </dd>
      ) : null}
    </div>
  );
}

function EventRow({ event }: { event: CheckpointEvent }) {
  return (
    <li className="border-l-2 border-[var(--vms-line-strong)] pl-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-xs font-semibold capitalize">
          {event.direction} {event.outcome}
        </strong>
        <Badge variant={event.outcome === "allowed" ? "success" : "danger"}>
          {event.outcome}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
        {formatDate(event.occurred_at)} · {event.reason_code}
      </p>
    </li>
  );
}

function SessionRow({ session }: { session: VisitSession }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-[var(--vms-line)] pb-3 last:border-0 last:pb-0">
      <div>
        <strong className="text-xs font-semibold">
          Visit {session.sequence_number}
        </strong>
        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
          {formatDate(session.started_at)}
        </p>
      </div>
      <Badge variant={session.status === "active" ? "warning" : "neutral"}>
        {session.status}
      </Badge>
    </li>
  );
}

function PartialError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="text-sm text-[var(--vms-danger)]" role="alert">
      <p>{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={retry}
      >
        Retry
      </Button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main
      className="space-y-5"
      role="status"
      aria-label="Loading invitation detail"
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </main>
  );
}

function DetailError({
  title,
  detail,
  retry,
}: {
  title: string;
  detail: string;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_30%,transparent)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
    >
      <strong>{title}</strong>
      <p className="mt-1">{detail}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={retry}
      >
        Retry
      </Button>
    </div>
  );
}
