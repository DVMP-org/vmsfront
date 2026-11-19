"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowRight,
    BellRing,
    Plus,
    ReceiptText,
    Wrench,
} from "lucide-react";

import { usePlaceWorkspace } from "./PlaceWorkspaceShell";
import { placeWorkspaceApi } from "./api";
import {
    EmptyRow,
    PlaceRowSkeleton,
    SectionCard,
    StatusPill,
    listRowClass,
    surfaceClass,
} from "./ui";
import { GuestStayDashboard } from "@/features/guest-stay/GuestStayDashboard";
import { accessJourneyApi } from "@/features/access-journey/api";
import { parseApiError } from "@/lib/error-utils";
import { relativeTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/**
 * The hospitality guest's home.
 *
 * A hotel guest is not a resident: the desk owns the room, the bill and the
 * stay lifecycle, so this page leads with the stay and the bill and keeps the
 * guest's own decisions — who may visit, what needs fixing, what the hotel is
 * saying — below it. Nothing here offers an action the guest cannot finish.
 */
export function HospitalityGuestOverview() {
    const { place, party } = usePlaceWorkspace();
    const announcements = useQuery({
        queryKey: ["place-announcements", place.id, party.id],
        queryFn: () => placeWorkspaceApi.announcements(place.id),
        retry: false,
    });
    const invitations = useQuery({
        queryKey: ["workspace", "visit-authorizations", place.id, party.id],
        queryFn: () => accessJourneyApi.list(place.id),
        retry: false,
    });

    const notices = (announcements.data ?? []).slice(0, 3);
    const now = Date.now();
    const terminal = new Set(["declined", "cancelled", "revoked", "expired"]);
    const upcoming = (invitations.data?.items ?? [])
        .filter((invitation) => {
            const effective = invitation.display_status ?? invitation.status;
            return (
                !terminal.has(invitation.status) &&
                effective !== "expired" &&
                effective !== "active" &&
                new Date(invitation.valid_to).getTime() >= now
            );
        })
        .sort(
            (left, right) =>
                new Date(left.valid_from).getTime() -
                new Date(right.valid_from).getTime(),
        )
        .slice(0, 3);

    return (
        <div className="space-y-4">
            <GuestStayDashboard placeId={place.id} />

            <SectionCard
                title="During your stay"
                description="The things a guest does most, without leaving the workspace."
            >
                <div className="grid gap-2 sm:grid-cols-2">
                    {[
                        {
                            href: `/workspace/${place.id}/invitations`,
                            icon: Plus,
                            title: "Invite a guest",
                            detail: "Give someone access to visit you",
                            primary: true,
                        },
                        {
                            href: `/workspace/${place.id}/charges`,
                            icon: ReceiptText,
                            title: "View your bill",
                            detail: "Charges, payments and balance",
                            primary: false,
                        },
                        {
                            href: `/workspace/${place.id}/maintenance`,
                            icon: Wrench,
                            title: "Report a room issue",
                            detail: "Tell the hotel what needs fixing",
                            primary: false,
                        },
                        {
                            href: `/workspace/${place.id}/announcements`,
                            icon: BellRing,
                            title: "Hotel announcements",
                            detail: "Notices for guests",
                            primary: false,
                        },
                    ].map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className={cn(
                                    "group flex min-h-[4.5rem] min-w-0 items-start gap-3 rounded-[var(--vms-radius-control)] border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                                    action.primary
                                        ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)] hover:bg-[var(--vms-action-hover)]"
                                        : "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)]",
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                                        action.primary
                                            ? "bg-white/15 text-[var(--vms-on-action)]"
                                            : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block break-words text-[13px] font-semibold leading-5">
                                        {action.title}
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-0.5 block break-words text-[11px] leading-4",
                                            action.primary
                                                ? "text-white/70"
                                                : "text-[var(--vms-ink-muted)]",
                                        )}
                                    >
                                        {action.detail}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard
                    title="Hotel announcements"
                    actionHref={`/workspace/${place.id}/announcements`}
                    actionLabel="All notices"
                >
                    {announcements.isPending ? (
                        <PlaceRowSkeleton rows={2} />
                    ) : announcements.isError ? (
                        <p role="alert" className="text-sm text-[var(--vms-danger)]">
                            {parseApiError(announcements.error).message}
                        </p>
                    ) : notices.length ? (
                        <ul>
                            {notices.map((notice) => (
                                <li key={notice.id} className={listRowClass}>
                                    <div className="min-w-0 flex-1">
                                        <p className="break-words text-sm font-semibold text-[var(--vms-ink)]">
                                            {notice.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                                            {relativeTime(notice.published_at)}
                                        </p>
                                    </div>
                                    {notice.priority ? (
                                        <StatusPill status={notice.priority} />
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyRow
                            icon={BellRing}
                            title="No notices right now"
                            description="Messages from the hotel will appear here."
                        />
                    )}
                </SectionCard>

                <SectionCard
                    title="Your guest invitations"
                    actionHref={`/workspace/${place.id}/invitations`}
                    actionLabel="All invitations"
                >
                    {invitations.isPending ? (
                        <PlaceRowSkeleton rows={2} />
                    ) : invitations.isError ? (
                        <p role="alert" className="text-sm text-[var(--vms-danger)]">
                            {parseApiError(invitations.error).message}
                        </p>
                    ) : upcoming.length ? (
                        <ul>
                            {upcoming.map((invitation) => {
                                const guest = invitation.guests[0];
                                const extra = invitation.guests.length - 1;
                                return (
                                    <li key={invitation.id} className={listRowClass}>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
                                                {guest?.display_name_snapshot || "Guest"}
                                                {extra > 0 ? (
                                                    <span className="font-normal text-[var(--vms-ink-muted)]">
                                                        {" "}
                                                        +{extra} more
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                                                {relativeTime(invitation.valid_from)}
                                            </p>
                                        </div>
                                        <StatusPill status={invitation.status} />
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyRow
                            icon={ArrowRight}
                            title="No upcoming guests"
                            description="Invite someone to visit you during your stay."
                            action={
                                <Link
                                    href={`/workspace/${place.id}/invitations`}
                                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--vms-action)] underline-offset-4 hover:underline"
                                >
                                    Create an invitation
                                    <ArrowRight aria-hidden className="h-4 w-4" />
                                </Link>
                            }
                        />
                    )}
                </SectionCard>
            </div>

            <section className={cn(surfaceClass, "px-4 py-3 text-xs text-[var(--vms-ink-muted)]")}>
                Room changes, extensions and checkout are handled by hotel reception.
                Your workspace shows what the desk has recorded.
            </section>
        </div>
    );
}
