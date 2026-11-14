import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";

import type { StatusTone } from "@/components/ui/StatusBadge";
import { sumAmounts } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

import type {
    ChargeRecurrence,
    Lease,
    LeaseChargeLine,
    LeaseKind,
    LeaseStatus,
} from "./api";

const statusLabels: Record<LeaseStatus, string> = {
    draft: "Draft",
    pending_signature: "Awaiting signature",
    active: "Active",
    expiring: "Expiring",
    terminated: "Terminated",
    expired: "Expired",
    cancelled: "Cancelled",
};

export function leaseStatusLabel(status: LeaseStatus): string {
    return statusLabels[status] ?? status;
}

export function leaseStatusTone(status: LeaseStatus): StatusTone {
    if (status === "active") return "success";
    if (status === "expiring" || status === "pending_signature") return "warning";
    if (status === "terminated" || status === "expired") return "danger";
    return "neutral";
}

const kindLabels: Record<LeaseKind, string> = {
    lease: "Lease",
    tenancy: "Tenancy",
    licence: "Licence",
    stay: "Stay",
};

export function leaseKindLabel(kind: LeaseKind): string {
    return kindLabels[kind] ?? kind;
}

const cadenceLabels: Record<ChargeRecurrence, string> = {
    one_time: "One-off",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    biannual: "Every 6 months",
    yearly: "Yearly",
};

export function cadenceLabel(cadence: ChargeRecurrence): string {
    return cadenceLabels[cadence] ?? cadence;
}

/** Months in one billing cycle, used to compare cadences on one scale. */
const cadenceMonths: Record<ChargeRecurrence, number> = {
    one_time: 0,
    daily: 1 / 30.44,
    weekly: 1 / 4.345,
    monthly: 1,
    quarterly: 3,
    biannual: 6,
    yearly: 12,
};

/** Statuses that still hold the Place for the Party. */
export function leaseIsLive(status: LeaseStatus): boolean {
    return (
        status === "draft" ||
        status === "pending_signature" ||
        status === "active" ||
        status === "expiring"
    );
}

export function leaseTermLabel(lease: Pick<Lease, "starts_at" | "ends_at">): string {
    const from = formatDate(lease.starts_at);
    return lease.ends_at ? `${from} – ${formatDate(lease.ends_at)}` : `${from} – open ended`;
}

export function leaseDaysRemaining(
    lease: Pick<Lease, "ends_at">,
    now: Date = new Date(),
): number | null {
    if (!lease.ends_at) return null;
    return differenceInCalendarDays(new Date(lease.ends_at), now);
}

/**
 * The one sentence an operator needs about the term. Drafts and closed terms
 * do not get an expiry countdown because nothing is counting down yet.
 */
export function leaseExpiryCopy(
    lease: Pick<Lease, "status" | "ends_at">,
    now: Date = new Date(),
): { label: string; tone: StatusTone } {
    if (lease.status === "cancelled") {
        return { label: "Cancelled before it started", tone: "neutral" };
    }
    if (lease.status === "terminated") {
        return { label: "Ended early", tone: "danger" };
    }
    if (!leaseIsLive(lease.status)) {
        return { label: leaseStatusLabel(lease.status), tone: leaseStatusTone(lease.status) };
    }
    const days = leaseDaysRemaining(lease, now);
    if (days === null) {
        return { label: "Open ended", tone: "neutral" };
    }
    if (days < 0) {
        return { label: `Ended ${Math.abs(days)} days ago`, tone: "danger" };
    }
    if (days === 0) {
        return { label: "Ends today", tone: "warning" };
    }
    if (days <= 60) {
        return { label: `${days} days left`, tone: "warning" };
    }
    return { label: `${days} days left`, tone: "success" };
}

function liveLines(lines: LeaseChargeLine[]): LeaseChargeLine[] {
    return lines.filter((line) => line.status !== "cancelled");
}

/** What the plan bills per month, so mixed cadences can be compared. */
export function monthlyEquivalent(lines: LeaseChargeLine[]): number {
    return liveLines(lines).reduce((total, line) => {
        const months = cadenceMonths[line.recurrence] ?? 0;
        if (months === 0) return total;
        return total + sumAmounts([line.amount]) / months;
    }, 0);
}

/** One-off charges sit outside the recurring total; they are shown separately. */
export function oneOffTotal(lines: LeaseChargeLine[]): number {
    return sumAmounts(
        liveLines(lines)
            .filter((line) => line.recurrence === "one_time")
            .map((line) => line.amount),
    );
}

export type PlanGroup = {
    cadence: ChargeRecurrence;
    total: number;
    names: string[];
};

/**
 * The charge plan grouped by cadence. Reading it this way is what makes a plan
 * reviewable before confirmation: three monthly lines and one yearly line.
 */
export function groupPlanByCadence(lines: LeaseChargeLine[]): PlanGroup[] {
    const groups = new Map<ChargeRecurrence, PlanGroup>();
    for (const line of liveLines(lines)) {
        const group = groups.get(line.recurrence) ?? {
            cadence: line.recurrence,
            total: 0,
            names: [],
        };
        group.total += sumAmounts([line.amount]);
        group.names.push(line.name);
        groups.set(line.recurrence, group);
    }
    const order: ChargeRecurrence[] = [
        "monthly",
        "quarterly",
        "biannual",
        "yearly",
        "weekly",
        "daily",
        "one_time",
    ];
    return order
        .filter((cadence) => groups.has(cadence))
        .map((cadence) => groups.get(cadence)!);
}

export type LeaseAttentionReason = {
    id: "expiring" | "unsigned" | "no_plan" | "open_ended";
    label: string;
    tone: StatusTone;
};

/** Why a lease deserves attention now: expiry, an unsigned draft, a bare plan. */
export function leaseAttentionReasons(
    lease: Pick<Lease, "status" | "ends_at" | "signed_at"> & {
        charge_lines: LeaseChargeLine[];
    },
    now: Date = new Date(),
): LeaseAttentionReason[] {
    const reasons: LeaseAttentionReason[] = [];
    if (
        (lease.status === "active" || lease.status === "expiring") &&
        lease.ends_at
    ) {
        const days = leaseDaysRemaining(lease, now);
        if (days !== null && days <= 60) {
            reasons.push({
                id: "expiring",
                label: days < 0 ? "Term has run out" : `Ends in ${days} days`,
                tone: days < 0 ? "danger" : "warning",
            });
        }
    }
    if (
        (lease.status === "draft" || lease.status === "pending_signature") &&
        !lease.signed_at
    ) {
        reasons.push({
            id: "unsigned",
            label: "Not signed yet",
            tone: "warning",
        });
    }
    if (
        (lease.status === "draft" || lease.status === "pending_signature") &&
        liveLines(lease.charge_lines).length === 0
    ) {
        reasons.push({
            id: "no_plan",
            label: "No charges planned",
            tone: "neutral",
        });
    }
    if (lease.status === "active" && !lease.ends_at) {
        reasons.push({
            id: "open_ended",
            label: "No end date, so it never expires",
            tone: "neutral",
        });
    }
    return reasons;
}
