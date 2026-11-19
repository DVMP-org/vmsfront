"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CalendarClock,
    CheckCheck,
    ClipboardList,
    Sparkles,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import {
    fromDateInputValue,
    formatDateTime,
    toDateTimeInputValue,
} from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { humanize } from "@/lib/strings";
import { hospitalityApi } from "../api";
import type {
    HousekeepingEvent,
    HousekeepingRoomDetail,
    HousekeepingStatus,
} from "../contracts";

const STATUS_OPTIONS: Array<{ value: HousekeepingStatus; label: string }> = [
    { value: "dirty", label: "Dirty" },
    { value: "in_progress", label: "In progress" },
    { value: "clean", label: "Clean" },
    { value: "inspected", label: "Inspected" },
];
const PRIORITY_OPTIONS = [
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
] as const;

const EVENT_LABELS: Record<HousekeepingEvent["event_type"], string> = {
    housekeeping_updated: "Housekeeping updated",
    stay_checked_in: "Guest checked in",
    stay_checked_out: "Guest checked out",
    imported_snapshot: "Starting state imported",
};

function statusTone(status: HousekeepingStatus | null | undefined) {
    if (status === "dirty") return "warning";
    if (status === "in_progress") return "info";
    if (status === "clean" || status === "inspected") return "success";
    return "neutral";
}

function eventSummary(event: HousekeepingEvent) {
    const lines: string[] = [];
    if (event.from_status !== event.to_status && event.to_status) {
        lines.push(
            `${event.from_status ? humanize(event.from_status) : "—"} → ${humanize(event.to_status)}`,
        );
    }
    if (
        event.from_operational_status !== event.to_operational_status &&
        event.to_operational_status
    ) {
        lines.push(
            `Room ${humanize(event.from_operational_status ?? "—")} → ${humanize(event.to_operational_status)}`,
        );
    }
    if (
        event.previous_assigned_to !== event.assigned_to &&
        (event.assigned_to_name || event.assigned_to)
    ) {
        lines.push(`Assigned to ${event.assigned_to_name ?? "a housekeeper"}`);
    }
    if (
        event.previous_priority !== event.priority &&
        event.priority
    ) {
        lines.push(`Priority ${humanize(event.priority)}`);
    }
    if (event.notes) {
        lines.push(`Notes: ${event.notes}`);
    }
    return lines;
}

function StatusDot({ tone }: { tone: string }) {
    return (
        <span
            aria-hidden="true"
            className={
                tone === "success"
                    ? "h-2 w-2 rounded-full bg-[var(--vms-success)]"
                    : tone === "warning"
                        ? "h-2 w-2 rounded-full bg-[var(--vms-warning)]"
                        : tone === "info"
                            ? "h-2 w-2 rounded-full bg-[var(--vms-info)]"
                            : "h-2 w-2 rounded-full bg-[var(--vms-ink-muted)]"
            }
        />
    );
}

/**
 * One room's housekeeping workspace.
 *
 * The room register is for scanning; this drawer is for doing the work. It
 * shows the current state with the rest of the room's context, offers the
 * transitions a desk or housekeeper actually makes, and keeps the recorded
 * history underneath so "why is this room dirty?" has an answer.
 */
export function HousekeepingDrawer({
    roomId,
    contextKey,
    onClose,
    canEdit,
    assignees,
}: {
    roomId: string | null;
    contextKey: string;
    onClose: () => void;
    canEdit: boolean;
    assignees: Array<{ value: string; label: string }>;
}) {
    const client = useQueryClient();
    const detailKey = useMemo(
        () => ["hospitality-housekeeping-room", contextKey, roomId] as const,
        [contextKey, roomId],
    );
    const detail = useQuery({
        queryKey: detailKey,
        queryFn: async () =>
            (await hospitalityApi.housekeeping.detail(roomId as string)) as
            | HousekeepingRoomDetail
            | undefined,
        enabled: Boolean(roomId),
    });

    const [status, setStatus] = useState<HousekeepingStatus>("clean");
    const [assignee, setAssignee] = useState("");
    const [priority, setPriority] = useState<"normal" | "high" | "urgent">(
        "normal",
    );
    const [dueAt, setDueAt] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const task = detail.data?.task;
        if (!task) return;
        setStatus(task.status);
        setAssignee(task.assigned_to ?? "");
        setPriority(task.priority);
        setDueAt(task.due_at ? toDateTimeInputValue(task.due_at) : "");
        setNotes(task.notes ?? "");
    }, [detail.data?.task]);

    const update = useMutation({
        mutationFn: async (body: Parameters<typeof hospitalityApi.housekeeping.update>[1]) =>
            hospitalityApi.housekeeping.update(roomId as string, body),
        onSuccess: async () => {
            toast.success("Housekeeping updated.");
            await Promise.all([
                client.invalidateQueries({ queryKey: detailKey }),
                client.invalidateQueries({
                    queryKey: ["hospitality-housekeeping", contextKey],
                }),
                client.invalidateQueries({
                    queryKey: ["hospitality-rooms", contextKey],
                }),
            ]);
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });

    function transition(next: HousekeepingStatus) {
        setStatus(next);
        update.mutate({ status: next });
    }

    function saveAssignment() {
        update.mutate({
            status,
            assigned_to: assignee || null,
            priority,
            notes: notes.trim() || null,
            due_at: fromDateInputValue(dueAt)?.toISOString() ?? null,
        });
    }

    const data = detail.data;
    const task = data?.task;
    const room = data?.room;
    const history = data?.history ?? [];
    const operational = room?.status;
    const isOccupied = operational === "occupied";
    const canSetStatus = canEdit && !update.isPending;

    return (
        <Drawer
            isOpen={Boolean(roomId)}
            onClose={onClose}
            eyebrow="Housekeeping"
            title={room?.name ?? "Room housekeeping"}
            description={
                room
                    ? `${room.room_number}${room.floor ? ` · Floor ${room.floor}` : ""}`
                    : "Current state and recorded history."
            }
            footer={
                <Button type="button" variant="outline" onClick={onClose}>
                    Close
                </Button>
            }
        >
            {detail.isPending || !data ? (
                <PanelState
                    kind={detail.isError ? "error" : "loading"}
                    title={
                        detail.isError
                            ? "Housekeeping details could not be loaded"
                            : "Loading housekeeping"
                    }
                    description={
                        detail.isError
                            ? parseApiError(detail.error).message
                            : "Fetching the room's current state and history."
                    }
                    onRetry={detail.isError ? () => void detail.refetch() : undefined}
                />
            ) : (
                <div className="flex flex-col gap-5">
                    {update.isError ? (
                        <InlineAlert tone="danger" title="Housekeeping was not updated">
                            {parseApiError(update.error).message}
                        </InlineAlert>
                    ) : null}

                    <section
                        aria-label="Current housekeeping state"
                        className="rounded-lg border border-[var(--vms-line)] p-4"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                    Current state
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vms-surface-subtle)] px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ring-[var(--vms-line)]">
                                        <StatusDot tone={statusTone(task?.status)} />
                                        {humanize(task?.status ?? "clean")}
                                    </span>
                                    {operational ? (
                                        <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
                                            Room {humanize(operational)}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="text-right text-xs text-[var(--vms-ink-muted)]">
                                <p>
                                    {room?.current_guest_name
                                        ? `In house: ${room.current_guest_name}`
                                        : "No current guest"}
                                </p>
                                <p>
                                    {room?.next_arrival
                                        ? `Next: ${room.next_guest_name ?? "Guest"} · ${formatDateTime(room.next_arrival)}`
                                        : "No upcoming arrival"}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Assignee</dt>
                                <dd className="mt-0.5 flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5 text-[var(--vms-ink-muted)]" />
                                    {assignees.find((person) => person.value === assignee)?.label ||
                                        "Unassigned"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Priority</dt>
                                <dd className="mt-0.5 capitalize">{humanize(priority)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Due</dt>
                                <dd className="mt-0.5 flex items-center gap-1.5">
                                    <CalendarClock className="h-3.5 w-3.5 text-[var(--vms-ink-muted)]" />
                                    {dueAt ? formatDateTime(dueAt) : "Not set"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Last update</dt>
                                <dd className="mt-0.5">
                                    {task?.updated_at ? formatDateTime(task.updated_at) : "—"}
                                </dd>
                            </div>
                        </dl>
                        {notes ? (
                            <p className="mt-3 rounded-md bg-[var(--vms-surface-subtle)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
                                {notes}
                            </p>
                        ) : null}
                    </section>

                    <section aria-label="Housekeeping actions" className="space-y-3">
                        <h3 className="text-sm font-semibold">Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    size="sm"
                                    variant={option.value === task?.status ? "primary" : "outline"}
                                    disabled={!canSetStatus || option.value === task?.status}
                                    onClick={() => transition(option.value)}
                                >
                                    {option.value === "inspected" ? (
                                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                                    ) : option.value === "in_progress" ? (
                                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    Mark {option.label.toLowerCase()}
                                </Button>
                            ))}
                        </div>
                        {isOccupied ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                The room is occupied. Housekeeping state can change, but the room
                                stays unsellable until check-out.
                            </p>
                        ) : null}
                    </section>

                    <section aria-label="Housekeeping details" className="space-y-3">
                        <h3 className="text-sm font-semibold">Details &amp; assignment</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-medium">
                                Housekeeper
                                <select
                                    value={assignee}
                                    disabled={!canEdit || update.isPending}
                                    onChange={(event) => setAssignee(event.currentTarget.value)}
                                    className="h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2 text-sm"
                                >
                                    <option value="">Unassigned</option>
                                    {assignees.map((person) => (
                                        <option key={person.value} value={person.value}>
                                            {person.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium">
                                Priority
                                <select
                                    value={priority}
                                    disabled={!canEdit || update.isPending}
                                    onChange={(event) =>
                                        setPriority(
                                            event.currentTarget.value as "normal" | "high" | "urgent",
                                        )
                                    }
                                    className="h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2 text-sm"
                                >
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium">
                                Due
                                <input
                                    type="datetime-local"
                                    value={dueAt}
                                    disabled={!canEdit || update.isPending}
                                    onChange={(event) => setDueAt(event.currentTarget.value)}
                                    className="h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2 text-sm"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                                Notes
                                <textarea
                                    value={notes}
                                    disabled={!canEdit || update.isPending}
                                    onChange={(event) => setNotes(event.currentTarget.value)}
                                    rows={3}
                                    placeholder="Anything the next person needs to know."
                                    className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-sm"
                                />
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                size="sm"
                                isLoading={update.isPending}
                                disabled={!canEdit}
                                onClick={saveAssignment}
                            >
                                Save assignment
                            </Button>
                        </div>
                    </section>

                    <section aria-label="Housekeeping history" className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold">History</h3>
                            <span className="text-xs text-[var(--vms-ink-muted)]">
                                {history.length} {history.length === 1 ? "entry" : "entries"}
                            </span>
                        </div>
                        {history.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-[var(--vms-line)] px-3 py-4 text-sm text-[var(--vms-ink-muted)]">
                                No housekeeping history has been recorded yet.
                            </p>
                        ) : (
                            <ol className="space-y-0">
                                {history.map((event) => {
                                    const summary = eventSummary(event);
                                    return (
                                        <li
                                            key={event.id}
                                            className="relative border-l border-[var(--vms-line)] pb-4 pl-5 last:pb-0"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--vms-action)]"
                                            />
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <strong className="text-xs font-semibold">
                                                    {EVENT_LABELS[event.event_type] ?? humanize(event.event_type)}
                                                </strong>
                                                <span className="text-[11px] text-[var(--vms-ink-muted)]">
                                                    {formatDateTime(event.created_at)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-[var(--vms-ink-muted)]">
                                                {event.actor_name ?? "System"}
                                            </p>
                                            {summary.length ? (
                                                <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--vms-ink-muted)]">
                                                    {summary.map((line, lineIndex) => (
                                                        <li
                                                            key={`${event.id}-${lineIndex}`}
                                                            className="flex gap-1.5"
                                                        >
                                                            <span aria-hidden="true">·</span>
                                                            {line}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </section>
                </div>
            )}
        </Drawer>
    );
}
