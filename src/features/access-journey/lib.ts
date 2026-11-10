"use client";

/**
 * Invitation helpers and formatters.
 *
 * Bucketing, filtering and draft helpers are pure functions so they can be
 * unit tested and reused by any view of invitations.
 */

import type { VisitAuthorization, VisitAuthorizationStatus } from "./api";

export const PAGE_SIZE = 8;
export const MAX_INVITATION_GUESTS = 20;

export type InvitationTab = "upcoming" | "on_site" | "past";
export type VisitDateFilter = "all" | "today" | "week" | "month";
export type StatusFilter = "all" | VisitAuthorizationStatus;

/**
 * Parse the maximum-entries field the way the operator typed it. Anything
 * unreadable falls back to a single entry, and the value is capped so a stray
 * keystroke cannot open an invitation for hundreds of passages.
 */
export function clampMaxUses(value: string | number) {
    const parsed =
        typeof value === "number" ? value : Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

export const dayLabel = (value: Date) =>
    value.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

export const timeLabel = (value: Date) =>
    value.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

export function invitationBucket(
    invitation: VisitAuthorization,
    now: number,
): InvitationTab {
    const start = new Date(invitation.valid_from).getTime();
    const end = new Date(invitation.valid_to).getTime();
    const open =
        invitation.status === "approved" || invitation.status === "requested";
    if (open && start <= now && end >= now) return "on_site";
    if (open && end >= now) return "upcoming";
    return "past";
}

export function bucketInvitations(items: VisitAuthorization[]) {
    const now = Date.now();
    const buckets: Record<InvitationTab, VisitAuthorization[]> = {
        upcoming: [],
        on_site: [],
        past: [],
    };
    for (const invitation of items) {
        buckets[invitationBucket(invitation, now)].push(invitation);
    }
    const byStart = (left: VisitAuthorization, right: VisitAuthorization) =>
        new Date(left.valid_from).getTime() - new Date(right.valid_from).getTime();
    buckets.upcoming.sort(byStart);
    buckets.on_site.sort(byStart);
    buckets.past.sort(
        (left, right) =>
            new Date(right.valid_from).getTime() -
            new Date(left.valid_from).getTime(),
    );
    return buckets;
}

export function filterInvitations(
    items: VisitAuthorization[],
    {
        search,
        visitDate,
        status,
    }: { search: string; visitDate: VisitDateFilter; status: StatusFilter },
) {
    const needle = search.trim().toLowerCase();
    const now = new Date();
    const horizon = new Date(now);
    if (visitDate === "today") horizon.setHours(23, 59, 59, 999);
    if (visitDate === "week") horizon.setDate(horizon.getDate() + 7);
    if (visitDate === "month") horizon.setDate(horizon.getDate() + 30);
    return items.filter((invitation) => {
        if (status !== "all" && invitation.status !== status) return false;
        if (visitDate !== "all") {
            const start = new Date(invitation.valid_from);
            if (start > horizon) return false;
            if (
                visitDate === "today" &&
                start < new Date(now.getFullYear(), now.getMonth(), now.getDate())
            ) {
                return false;
            }
        }
        if (!needle) return true;
        return [
            invitation.code,
            invitation.purpose ?? "",
            invitation.host_party?.display_name ?? "",
            ...invitation.guests.map(
                (guest) =>
                    `${guest.display_name_snapshot} ${guest.phone_snapshot ?? ""} ${guest.email_snapshot ?? ""}`,
            ),
        ]
            .join(" ")
            .toLowerCase()
            .includes(needle);
    });
}

export interface GuestDraft {
    id: string;
    display_name: string;
    email: string;
    phone: string;
}

export function createGuestDraft(): GuestDraft {
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

export function updateGuest(
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

export function formatWindow(from: string, to: string) {
    const formatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
    return `${formatter.format(new Date(from))} – ${formatter.format(new Date(to))}`;
}

export function formatDateTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export function toLocalInput(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
