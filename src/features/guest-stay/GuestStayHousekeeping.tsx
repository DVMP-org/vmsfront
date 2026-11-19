"use client";

import { CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { parseApiError } from "@/lib/error-utils";
import type { HousekeepingStatus } from "@/features/hospitality/contracts";
import {
    useGuestStayHousekeeping,
    useSetGuestHousekeeping,
} from "./housekeeping-queries";

const STATUS_LABEL: Record<HousekeepingStatus, string> = {
    clean: "No request active",
    dirty: "Cleaning requested",
    in_progress: "Housekeeping in progress",
    inspected: "Clean and inspected",
};

/**
 * The guest's side of housekeeping.
 *
 * A hotel guest does not clean the room and does not assign the work; what they
 * decide is whether service is wanted. That decision is written to the same
 * room state the desk works from, so "request cleaning" reaches housekeeping and
 * "no service needed" stops the visit without a phone call.
 */
export function GuestStayHousekeeping({
    stayId,
    roomName,
}: {
    stayId: string;
    roomName: string;
}) {
    const state = useGuestStayHousekeeping(stayId);
    const update = useSetGuestHousekeeping(stayId);

    if (state.isPending) {
        return (
            <div
                aria-hidden="true"
                className="h-16 animate-pulse rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
            />
        );
    }

    if (state.isError || !state.data) {
        return (
            <div
                role="alert"
                className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-3 text-xs text-[var(--vms-danger)]"
            >
                <p className="font-semibold">Housekeeping could not be loaded</p>
                <p className="mt-1">{parseApiError(state.error).message}</p>
                <button
                    type="button"
                    onClick={() => state.refetch()}
                    className="mt-2 min-h-11 font-semibold underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    const { status } = state.data;
    const staffWorking = status === "in_progress" || status === "inspected";

    return (
        <section
            aria-labelledby={`housekeeping-${stayId}`}
            className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                    id={`housekeeping-${stayId}`}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]"
                >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Housekeeping · {roomName}
                </h3>
                <span
                    className={
                        status === "dirty"
                            ? "rounded-full border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vms-warning)]"
                            : "rounded-full border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vms-ink-muted)]"
                    }
                >
                    {STATUS_LABEL[status]}
                </span>
            </div>

            {staffWorking ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-[var(--vms-ink-muted)]">
                    <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Housekeeping is taking care of your room. No action needed.
                </p>
            ) : (
                <>
                    <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
                        Tell housekeeping whether you want your room serviced today.
                    </p>
                    <div
                        role="group"
                        aria-label={`Housekeeping for ${roomName}`}
                        className="mt-3 flex flex-wrap gap-2"
                    >
                        <Tooltip content="Mark the room as needing cleaning and let housekeeping know">
                            <Button
                                variant={status === "dirty" ? "secondary" : "primary"}
                                size="sm"
                                disabled={status === "dirty"}
                                isLoading={update.isPending && update.variables === "dirty"}
                                leftNode={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                                onClick={() => update.mutate("dirty")}
                            >
                                Request cleaning
                            </Button>
                        </Tooltip>
                        <Tooltip content="Tell housekeeping not to enter the room today">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={status === "clean"}
                                isLoading={update.isPending && update.variables === "clean"}
                                leftNode={
                                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                }
                                onClick={() => update.mutate("clean")}
                            >
                                No service needed
                            </Button>
                        </Tooltip>
                    </div>
                </>
            )}
        </section>
    );
}
