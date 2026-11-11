"use client";

import { useConfirmAction } from "@/components/ui/useConfirmAction";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { useSiteAccess } from "@/features/context/use-site-access";
import { VisitorJourneyPanel } from "@/features/access-journey/VisitorJourneyPanel";
import { checkpointsApi } from "@/features/checkpoints/api";
import { formatDateTime } from "@/lib/utils";
import { invitationApprovalsApi } from "./api";
import { guestNames, StatusBadge as InvitationStatusBadge } from "./InvitationApprovals";

/**
 * Visitor/invitation detail in a side drawer.
 *
 * The admin visitor register opens details here instead of navigating away,
 * so the operator keeps the list in view while approving, declining or
 * revoking an invitation.
 */
export function VisitorDetailDrawer({
  invitationId,
  focusGuestId = null,
  onClose,
}: {
  invitationId: string | null;
  /** Visitor whose journey should be open first (row-level register). */
  focusGuestId?: string | null;
  onClose: () => void;
}) {
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const client = useQueryClient();
  const access = useSiteAccess();
  const profile = access.workspace;
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const detail = useQuery({
    queryKey: ["admin-invitation-detail", invitationId],
    queryFn: () => invitationApprovalsApi.get(invitationId as string),
    enabled: Boolean(invitationId),
    retry: false,
  });
  const events = useQuery({
    queryKey: ["admin-invitation-events", invitationId],
    queryFn: () => invitationApprovalsApi.events(invitationId as string),
    enabled: Boolean(invitationId),
    retry: false,
  });
  const gates = useQuery({
    queryKey: ["journey-gates", detail.data?.site_id],
    queryFn: () => checkpointsApi.gates(1, ""),
    enabled: Boolean(detail.data?.site_id),
    retry: false,
  });

  const can = (permission: string) =>
    !profile.isError &&
    access.allowed(`visit_authorizations.${permission}`);

  async function refresh(message: string) {
    toast.success(message);
    setDeclineOpen(false);
    setDeclineReason("");
    await Promise.all([
      client.invalidateQueries({
        queryKey: ["admin-invitation-detail", invitationId],
      }),
      client.invalidateQueries({ queryKey: ["admin-invitation-approvals"] }),
      client.invalidateQueries({ queryKey: ["residential"] }),
    ]);
  }

  const decline = useMutation({    mutationFn: (reason: string) =>
      invitationApprovalsApi.decline(invitationId as string, reason),
    onSuccess: () => refresh("Invitation declined."),
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const revoke = useMutation({
    mutationFn: () => invitationApprovalsApi.revoke(invitationId as string),
    onSuccess: () => refresh("Invitation revoked."),
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const invitation = detail.data;
  const pending = decline.isPending || revoke.isPending;

  return (
    <Drawer
      isOpen={Boolean(invitationId)}
      onClose={onClose}
      title={invitation ? guestNames(invitation) : "Visitor"}
      description={
        invitation
          ? `${invitation.code} · ${invitation.destination_place.name}`
          : "Loading visitor details"
      }
      className="max-w-xl"
    >
      {detail.isPending ? (
        <div role="status" className="space-y-3 p-5">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
          <div className="h-24 w-full animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        </div>
      ) : detail.isError ? (
        <div role="alert" className="space-y-3 p-5 text-sm text-[var(--vms-danger)]">
          <p>{parseApiError(detail.error).message}</p>
          <Button variant="outline" size="sm" onClick={() => detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : invitation ? (
        <div className="flex min-h-full flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <InvitationStatusBadge
              status={invitation.status}
              displayStatus={invitation.display_status}
            />
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {invitation.uses_count}
              {invitation.max_uses
                ? ` of ${invitation.max_uses} uses`
                : " uses · unlimited"}
            </span>
          </div>

          <dl className="grid gap-x-5 gap-y-3 border-y border-[var(--vms-line)] py-4 text-sm sm:grid-cols-2">
            <Fact label="Host" value={invitation.host_party.display_name} />
            <Fact
              label="Destination"
              value={invitation.destination_place.name}
            />
            <Fact label="Valid from" value={formatDateTime(invitation.valid_from)} />
            <Fact label="Valid until" value={formatDateTime(invitation.valid_to)} />
            <Fact label="Purpose" value={invitation.purpose || "Not stated"} />
            <Fact
              label="Requested"
              value={formatDateTime(invitation.requested_at)}
            />
          </dl>

          <section aria-label="Visitors">
            <h3 className="text-sm font-semibold">
              Visitors ({invitation.guests.length})
            </h3>
            <ul className="mt-2 divide-y divide-[var(--vms-line)]">
              {invitation.guests.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">
                      {guest.display_name_snapshot}
                    </strong>
                    <span className="mt-0.5 grid gap-0.5 text-xs text-[var(--vms-ink-muted)]">
                      {guest.email_snapshot ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {guest.email_snapshot}
                        </span>
                      ) : null}
                      {guest.phone_snapshot ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {guest.phone_snapshot}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <StatusBadge
                    tone={guest.state === "checked_in" ? "success" : "neutral"}
                  >
                    {guest.state === "checked_in" ? "Checked in" : "Not checked in"}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Visitor journey">
            <h3 className="text-sm font-semibold">Journey</h3>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              One visitor at a time. Greyed checkpoints have not been reached;
              every scan is listed underneath.
            </p>
            <div className="mt-3">
              <VisitorJourneyPanel
                guests={invitation.guests}
                events={events.data?.items ?? []}
                gates={(gates.data?.items ?? []).filter(
                  (gate) =>
                    !invitation.site_id || !gate.site_id || gate.site_id === invitation.site_id,
                )}
                loading={events.isPending}
                error={
                  events.isError
                    ? parseApiError(events.error).message
                    : null
                }
                onRetry={() => void events.refetch()}
                initialGuestId={focusGuestId}
              />
            </div>
          </section>

          {invitation.decline_reason ? (            <section>
              <h3 className="text-sm font-semibold">Decision note</h3>
              <p className="mt-1 text-sm text-[var(--vms-danger)]">
                {invitation.decline_reason}
              </p>
            </section>
          ) : null}

          {declineOpen ? (
            <div className="space-y-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3">
              <Field id="decline-reason" label="Decline reason" required>
                {(control) => (
                  <textarea
                    {...control}
                    value={declineReason}
                    maxLength={255}
                    onChange={(event) => setDeclineReason(event.target.value)}
                    className={`${fieldControlClassName} min-h-20 py-2`}
                    placeholder="Explain why this invitation cannot be approved."
                  />
                )}
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeclineOpen(false)}
                  disabled={decline.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={decline.isPending}
                  disabled={!declineReason.trim()}
                  onClick={() => decline.mutate(declineReason.trim())}
                >
                  Confirm decline
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {invitation.status === "requested" && can("decline") ? (
              <Button
                type="button"
                variant="destructive-outlined"
                disabled={pending}
                onClick={() => setDeclineOpen((open) => !open)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Decline
              </Button>
            ) : null}
            {(invitation.status === "approved" ||
              invitation.status === "requested") &&
            can("revoke") ? (
              <Button
                type="button"
                variant="destructive-outlined"
                isLoading={revoke.isPending}
                disabled={pending}
                onClick={() => confirmAction({title: "Revoke visitor access?", description: "This invitation will no longer grant access to its visitors.", confirmLabel: "Revoke access", onConfirm: () => revoke.mutateAsync()})}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Revoke access
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {confirmationDialog}
    </Drawer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
      <dt className="text-[var(--vms-ink-muted)]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
