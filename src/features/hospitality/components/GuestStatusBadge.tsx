import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { humanize } from "@/lib/strings";
import type { StayStatus } from "../contracts";

const TONES: Record<StayStatus, StatusTone> = {
    reserved: "info",
    checked_in: "success",
    checked_out: "neutral",
    cancelled: "danger",
    no_show: "warning",
};

/**
 * The stay lifecycle, as the desk reads it.
 *
 * `booking.status` answers "was this agreed?"; this answers "where is the
 * guest?". They move independently, so both are shown rather than one standing
 * in for the other.
 */
export function GuestStatusBadge({
    status,
}: {
    status?: StayStatus | string | null;
}) {
    if (!status) {
        return (
            <span className="text-xs text-[var(--vms-ink-muted)]">No stay yet</span>
        );
    }
    return (
        <StatusBadge tone={TONES[status as StayStatus] ?? "neutral"}>
            {humanize(status)}
        </StatusBadge>
    );
}
