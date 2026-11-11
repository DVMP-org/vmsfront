import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";

import type { StatusTone } from "@/components/ui/StatusBadge";

export type LeaseState = "current" | "expiring" | "expired" | "open_ended";

/** Days left before the lease ends. `null` means the term is open-ended. */
export function leaseDaysRemaining(effectiveTo: string | null | undefined) {
    if (!effectiveTo) return null;
    return differenceInCalendarDays(new Date(effectiveTo), new Date());
}

export function leaseState(effectiveTo: string | null | undefined): LeaseState {
    const remaining = leaseDaysRemaining(effectiveTo);
    if (remaining === null) return "open_ended";
    if (remaining < 0) return "expired";
    if (remaining <= 60) return "expiring";
    return "current";
}

export function leaseTone(state: string): StatusTone {
    if (state === "expired") return "danger";
    if (state === "expiring") return "warning";
    if (state === "open_ended") return "neutral";
    return "success";
}
