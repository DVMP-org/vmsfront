"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  MapPin,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import type {
  VisitAuthorization,
  VisitAuthorizationStatus,
} from "@/features/access-journey/api";
import {
  invitationApprovalsApi,
  type ApprovalStatus,
} from "./api";
import styles from "./InvitationApprovals.module.css";

const tabs: Array<{ value: ApprovalStatus; label: string }> = [
  { value: "requested", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

export function InvitationApprovals() {
  const [status, setStatus] = useState<ApprovalStatus>("requested");
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["admin-invitation-approvals", status];
  const invitations = useQuery({
    queryKey,
    queryFn: () => invitationApprovalsApi.list(status),
    retry: false,
  });
  const approve = useMutation({
    mutationFn: (authorizationId: string) =>
      invitationApprovalsApi.approve(authorizationId),
    onSuccess: async () => {
      toast.success("Visitor invitation approved");
      await queryClient.invalidateQueries({
        queryKey: ["admin-invitation-approvals"],
      });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const decline = useMutation({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => invitationApprovalsApi.decline(id, reason),
    onSuccess: async () => {
      toast.success("Visitor invitation declined");
      setDecliningId(null);
      setDeclineReason("");
      await queryClient.invalidateQueries({
        queryKey: ["admin-invitation-approvals"],
      });
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const items = useMemo(
    () => invitations.data?.items || [],
    [invitations.data?.items],
  );
  const pendingCount =
    status === "requested" ? invitations.data?.total || items.length : undefined;

  function submitDecline(event: FormEvent) {
    event.preventDefault();
    const reason = declineReason.trim();
    if (!decliningId || !reason) return;
    decline.mutate({ id: decliningId, reason });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ACCESS / MANAGEMENT</p>
          <h1>Visitor approvals</h1>
          <p>
            Review visitor invitations submitted for this organization, confirm
            the host and destination, then approve or decline with a clear reason.
          </p>
        </div>
        <div className={styles.headerStatus} aria-live="polite">
          <Clock3 className="h-4 w-4" />
          <span>
            <strong>{pendingCount ?? "—"}</strong>
            awaiting approval
          </span>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Invitation status">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={status === tab.value}
            onClick={() => {
              setStatus(tab.value);
              setDecliningId(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={styles.panel} aria-label={`${status} invitations`}>
        <div className={styles.panelHeader}>
          <div>
            <h2>{tabs.find((tab) => tab.value === status)?.label}</h2>
            <p>
              Invitations use the canonical visitor authorization and checkpoint
              records.
            </p>
          </div>
          <button
            type="button"
            className={styles.refresh}
            onClick={() => invitations.refetch()}
            disabled={invitations.isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", invitations.isFetching && styles.spin)}
            />
            Refresh
          </button>
        </div>

        {invitations.isPending ? (
          <LoadingState />
        ) : invitations.isError ? (
          <div className={styles.error} role="alert">
            <div>
              <strong>Approval queue unavailable</strong>
              <p>{parseApiError(invitations.error).message}</p>
            </div>
            <button type="button" onClick={() => invitations.refetch()}>
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <Check className="h-8 w-8" />
            <h3>No {status} invitations</h3>
            <p>
              {status === "requested"
                ? "The approval queue is clear."
                : "There are no invitations in this state."}
            </p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {items.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                status={status}
                approving={
                  approve.isPending && approve.variables === invitation.id
                }
                declining={decliningId === invitation.id}
                declinePending={
                  decline.isPending && decline.variables?.id === invitation.id
                }
                declineReason={decliningId === invitation.id ? declineReason : ""}
                onApprove={() => approve.mutate(invitation.id)}
                onStartDecline={() => {
                  setDecliningId(invitation.id);
                  setDeclineReason("");
                }}
                onDeclineReason={setDeclineReason}
                onCancelDecline={() => {
                  setDecliningId(null);
                  setDeclineReason("");
                }}
                onDecline={submitDecline}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function InvitationCard({
  invitation,
  status,
  approving,
  declining,
  declinePending,
  declineReason,
  onApprove,
  onStartDecline,
  onDeclineReason,
  onCancelDecline,
  onDecline,
}: {
  invitation: VisitAuthorization;
  status: ApprovalStatus;
  approving: boolean;
  declining: boolean;
  declinePending: boolean;
  declineReason: string;
  onApprove: () => void;
  onStartDecline: () => void;
  onDeclineReason: (value: string) => void;
  onCancelDecline: () => void;
  onDecline: (event: FormEvent) => void;
}) {
  const guests = invitation.guests.map((guest) => guest.display_name_snapshot);
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <p className={styles.code}>{invitation.code}</p>
          <h3>{guests.join(", ")}</h3>
          <p className={styles.host}>
            <UserRound className="h-3.5 w-3.5" />
            Invited by {invitation.host_party.display_name}
          </p>
        </div>
        <Status status={invitation.status} />
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>
            <MapPin className="h-3.5 w-3.5" />
            Destination
          </dt>
          <dd>{invitation.destination_place.name}</dd>
        </div>
        <div>
          <dt>
            <CalendarClock className="h-3.5 w-3.5" />
            Access window
          </dt>
          <dd>
            {formatDate(invitation.valid_from)} –{" "}
            {formatDate(invitation.valid_to)}
          </dd>
        </div>
        <div>
          <dt>Uses</dt>
          <dd>
            {invitation.uses_count}
            {invitation.max_uses ? ` / ${invitation.max_uses}` : " / unlimited"}
          </dd>
        </div>
      </dl>

      {invitation.purpose ? (
        <p className={styles.purpose}>{invitation.purpose}</p>
      ) : null}
      {invitation.decline_reason ? (
        <p className={styles.declineReason}>
          Declined: {invitation.decline_reason}
        </p>
      ) : null}

      {status === "requested" && !declining ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.declineButton}
            onClick={onStartDecline}
            disabled={approving}
          >
            <X className="h-4 w-4" />
            Decline
          </button>
          <button
            type="button"
            className={styles.approveButton}
            onClick={onApprove}
            disabled={approving}
          >
            <Check className="h-4 w-4" />
            {approving ? "Approving…" : "Approve invitation"}
          </button>
        </div>
      ) : null}

      {declining ? (
        <form className={styles.declineForm} onSubmit={onDecline}>
          <label htmlFor={`decline-${invitation.id}`}>Decline reason</label>
          <textarea
            id={`decline-${invitation.id}`}
            value={declineReason}
            maxLength={255}
            required
            autoFocus
            onChange={(event) => onDeclineReason(event.target.value)}
            placeholder="Explain why this visitor cannot be admitted."
          />
          <div>
            <button type="button" onClick={onCancelDecline}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!declineReason.trim() || declinePending}
            >
              {declinePending ? "Declining…" : "Confirm decline"}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

function Status({ status }: { status: VisitAuthorizationStatus }) {
  const label =
    status === "requested"
      ? "Awaiting approval"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn(styles.status, styles[status])}>{label}</span>;
}

function LoadingState() {
  return (
    <div className={styles.loadingGrid} aria-label="Loading invitations">
      {[0, 1, 2].map((item) => (
        <div key={item} className={styles.loadingCard} />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
