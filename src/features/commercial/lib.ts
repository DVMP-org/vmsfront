import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";

import type { StatusTone } from "@/components/ui/StatusBadge";

export type LeaseAttention = {
    id: string;
    tenant: string;
    space: string;
    role: string;
    ends_at: string | null;
    days: number | null;
    state: "current" | "expired" | "expiring" | "open_ended";
};

export function buildLeaseAttention(
    relationships: Array<{
        id: string;
        role: string;
        effective_to: string | null;
        party: { display_name: string };
        place: { id: string; name: string };
    }>,
): LeaseAttention[] {
    return relationships.map((relationship) => {
        const days = relationship.effective_to
            ? differenceInCalendarDays(new Date(relationship.effective_to), new Date())
            : null;
        return {
            id: relationship.id,
            tenant: relationship.party.display_name,
            space: relationship.place.name,
            role: relationship.role,
            ends_at: relationship.effective_to,
            days,
            state:
                days === null
                    ? "open_ended"
                    : days < 0
                        ? "expired"
                        : days <= 60
                            ? "expiring"
                            : "current",
        };
    });
}

export function leaseTone(state: LeaseAttention["state"]): StatusTone {
    return state === "expired"
        ? "danger"
        : state === "expiring"
            ? "warning"
            : state === "open_ended"
                ? "neutral"
                : "success";
}

export function expiryBuckets(leases: LeaseAttention[]) {
    const expiring = leases.filter((lease) => lease.state === "expiring");
    return [
        {
            key: "expired",
            label: "Expired",
            danger: true,
            count: leases.filter((lease) => lease.state === "expired").length,
        },
        {
            key: "30",
            label: "≤ 30 days",
            danger: false,
            count: expiring.filter((lease) => (lease.days ?? 0) <= 30).length,
        },
        {
            key: "60",
            label: "31–60 days",
            danger: false,
            count: expiring.filter((lease) => (lease.days ?? 0) > 30).length,
        },
        {
            key: "open",
            label: "Open-ended",
            danger: false,
            count: leases.filter((lease) => lease.state === "open_ended").length,
        },
    ];
}

export type OccupancyRow = {
    /** Building name, or the space's own name when it stands alone. */
    label: string;
    total: number;
    occupied: number;
    standalone: boolean;
};

export type OccupancySpace = {
    id: string;
    name: string;
    parent_id: string | null;
};

/**
 * Group lettable spaces by building. A space without a building is legitimate
 * in commercial Sites (a shop or office on its own stand), so it is shown as
 * its own row instead of being folded into an "unassigned" bucket.
 */
export function buildOccupancy(
    inventory: OccupancySpace[],
    places: Array<{ id: string; name: string }>,
    relationships: Array<{ place: { id: string } }>,
): OccupancyRow[] {    const names = new Map(places.map((place) => [place.id, place.name]));
    const occupied = new Set(relationships.map((row) => row.place.id));
    const rows = new Map<string, OccupancyRow>();

    inventory.forEach((space) => {
        const parentName = space.parent_id ? names.get(space.parent_id) : undefined;
        const key = parentName ? `building:${space.parent_id}` : `space:${space.id}`;
        const row =
            rows.get(key) ??
            ({
                label: parentName ?? space.name,
                total: 0,
                occupied: 0,
                standalone: !parentName,
            } satisfies OccupancyRow);
        row.total += 1;
        if (occupied.has(space.id)) row.occupied += 1;
        rows.set(key, row);
    });

    return [...rows.values()].sort((left, right) => {
        if (left.standalone !== right.standalone) return left.standalone ? 1 : -1;
        return left.label.localeCompare(right.label);
    });
}

export type AgeingBucket = "current" | "1_30" | "31_60" | "61_90" | "90_plus";

/** Business days are irrelevant here: arrears age in calendar days. */
export const ageingBuckets: Array<{ key: AgeingBucket; label: string }> = [
    { key: "current", label: "Current" },
    { key: "1_30", label: "1–30 days" },
    { key: "31_60", label: "31–60 days" },
    { key: "61_90", label: "61–90 days" },
    { key: "90_plus", label: "90+ days" },
];

/**
 * Age one charge against its next unpaid due date. A future or missing due date
 * is current; anything else counts the days it has been owed.
 */
export function ageingBucket(
    due: string | null | undefined,
    today: Date = new Date(),
): AgeingBucket {
    if (!due) return "current";
    const days = differenceInCalendarDays(today, new Date(due));
    if (days <= 0) return "current";
    if (days <= 30) return "1_30";
    if (days <= 60) return "31_60";
    if (days <= 90) return "61_90";
    return "90_plus";
}

export type RentRollRow = {
    id: string;
    space: string;
    /** The live business tenant, or null when the space has none. */
    tenant: string | null;
    lease_ends_at: string | null;
    balance: number;
    /** Oldest unpaid due date behind the balance. */
    oldest_due: string | null;
    bucket: AgeingBucket;
};

type RentRollRelationship = {
    role: string;
    status: string;
    effective_from: string | null;
    effective_to: string | null;
    party: { display_name: string };
    place: { id: string };
};

type RentRollAssignment = {
    target_place: { id: string };
    outstanding_amount: string | number;
    next_due_date?: string | null;
};

/**
 * One row per space that either holds a business tenant or still owes money.
 * A space can carry a balance with no tenant: arrears outlive the tenancy, and
 * hiding those rows would drop exactly the money collections needs to chase.
 */
export function buildRentRoll(
    spaces: Array<{ id: string; name: string }>,
    relationships: RentRollRelationship[],
    assignments: RentRollAssignment[],
    today: Date = new Date(),
): RentRollRow[] {
    const tenants = new Map<string, RentRollRelationship>();
    for (const relationship of relationships) {
        if (!["tenant", "member"].includes(relationship.role)) continue;
        if (!["active", "pending"].includes(relationship.status)) continue;
        const current = tenants.get(relationship.place.id);
        if (
            !current ||
            (relationship.effective_from ?? "") > (current.effective_from ?? "")
        ) {
            tenants.set(relationship.place.id, relationship);
        }
    }

    const balances = new Map<string, { balance: number; oldest: string | null }>();
    for (const assignment of assignments) {
        const amount = Number(assignment.outstanding_amount || 0);
        if (!(amount > 0)) continue;
        const entry = balances.get(assignment.target_place.id) ?? {
            balance: 0,
            oldest: null,
        };
        entry.balance += amount;
        const due = assignment.next_due_date ?? null;
        if (due && (!entry.oldest || due < entry.oldest)) entry.oldest = due;
        balances.set(assignment.target_place.id, entry);
    }

    return spaces
        .map((space): RentRollRow => {
            const tenant = tenants.get(space.id) ?? null;
            const money = balances.get(space.id) ?? { balance: 0, oldest: null };
            return {
                id: space.id,
                space: space.name,
                tenant: tenant?.party.display_name ?? null,
                lease_ends_at: tenant?.effective_to ?? null,
                balance: money.balance,
                oldest_due: money.oldest,
                bucket: ageingBucket(money.oldest, today),
            };
        })
        .filter((row) => row.tenant !== null || row.balance > 0)
        .sort((left, right) => {
            if (right.balance !== left.balance) return right.balance - left.balance;
            return left.space.localeCompare(right.space);
        });
}

/** Outstanding money per ageing bucket, for the collections headline. */
export function ageingTotals(
    rows: RentRollRow[],
): Array<{ key: AgeingBucket; label: string; amount: number }> {
    return ageingBuckets.map((bucket) => ({
        ...bucket,
        amount: rows
            .filter((row) => row.bucket === bucket.key)
            .reduce((total, row) => total + row.balance, 0),
    }));
}
