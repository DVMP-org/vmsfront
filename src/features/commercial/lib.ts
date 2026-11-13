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
): OccupancyRow[] {
    const names = new Map(places.map((place) => [place.id, place.name]));
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
