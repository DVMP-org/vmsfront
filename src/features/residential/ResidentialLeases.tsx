"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Scale } from "lucide-react";
import { format } from "date-fns/format";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import { parseApiError } from "@/lib/error-utils";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { descendantIds, flattenPlaces, residentialApi } from "./api";
import { occupancyRoles, titleCase } from "./contracts";
import { leaseDaysRemaining, leaseState, leaseTone } from "./leases";

type LeaseFilter = "all" | "current" | "expiring" | "expired" | "open_ended";

const filters: Array<{ value: LeaseFilter; label: string }> = [
    { value: "all", label: "All leases" },
    { value: "current", label: "Current" },
    { value: "expiring", label: "Expiring" },
    { value: "expired", label: "Expired" },
    { value: "open_ended", label: "Open-ended" },
];

export default function ResidentialLeases() {
    const { contextKey, selectedProperty } = useResidentialAccess();
    const [filter, setFilter] = useState<LeaseFilter>("all");
    const placeId = selectedProperty?.id || "";
    const tree = useQuery({
        queryKey: ["residential", contextKey, "tree"],
        queryFn: residentialApi.tree,
        enabled: !!placeId,
    });
    const relationships = useQuery({
        queryKey: ["residential", contextKey, "relationships", placeId, "all"],
        queryFn: () => residentialApi.relationships(),
        enabled: !!placeId,
    });

    const scopeIds = useMemo(
        () => (tree.data ? descendantIds(tree.data, placeId) : new Set<string>()),
        [placeId, tree.data],
    );
    const unitNames = useMemo(() => {
        const map = new Map<string, string>();
        if (tree.data)
            flattenPlaces(tree.data).forEach((place) => map.set(place.id, place.name));
        return map;
    }, [tree.data]);

    const rows = useMemo(
        () =>
            (relationships.data?.items ?? [])
                .filter(
                    (relationship) =>
                        scopeIds.has(relationship.place.id) &&
                        occupancyRoles.includes(relationship.role as never),
                )
                .map((relationship) => ({
                    id: relationship.id,
                    resident: relationship.party.display_name,
                    email: relationship.party.email || "",
                    unit: unitNames.get(relationship.place.id) ?? relationship.place.name,
                    role: relationship.role,
                    status: relationship.status,
                    effectiveFrom: relationship.effective_from,
                    effectiveTo: relationship.effective_to,
                    state: leaseState(relationship.effective_to),
                    days: leaseDaysRemaining(relationship.effective_to),
                }))
                .sort((left, right) => {
                    const leftDays = left.days ?? Number.MAX_SAFE_INTEGER;
                    const rightDays = right.days ?? Number.MAX_SAFE_INTEGER;
                    return leftDays - rightDays;
                }),
        [relationships.data?.items, scopeIds, unitNames],
    );

    const counts = {
        all: rows.length,
        current: rows.filter((row) => row.state === "current").length,
        expiring: rows.filter((row) => row.state === "expiring").length,
        expired: rows.filter((row) => row.state === "expired").length,
        open_ended: rows.filter((row) => row.state === "open_ended").length,
    };
    const visible =
        filter === "all" ? rows : rows.filter((row) => row.state === filter);

    return (
        <ResidentialShell
            title="Leases & agreements"
            description="Agreement periods and expiry attention for residents, owners and tenants in this property."
            primaryAction={
                <Button asChild variant="outline">
                    <Link href="/admin/residential/occupancies">Residents & households</Link>
                </Button>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                    [
                        ["Current", counts.current, "success"],
                        ["Expiring ≤ 60 days", counts.expiring, "warning"],
                        ["Expired", counts.expired, "danger"],
                        ["Open-ended", counts.open_ended, "neutral"],
                    ] as const
                ).map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                            {label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--vms-line)] px-4 py-3">
                    {filters.map((item) => {
                        const active = item.value === filter;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setFilter(item.value)}
                                className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] ${active
                                        ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                        : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
                                    }`}
                            >
                                {item.label} ({counts[item.value]})
                            </button>
                        );
                    })}
                </div>

                {!selectedProperty ? (
                    <p className="px-4 py-6 text-sm text-[var(--vms-ink-muted)]">
                        Choose a property to review its leases.
                    </p>
                ) : relationships.isError ? (
                    <div
                        role="alert"
                        className="m-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
                    >
                        <p>{parseApiError(relationships.error).message}</p>
                        <Button
                            className="mt-3"
                            size="sm"
                            variant="outline"
                            onClick={() => relationships.refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : relationships.isPending ? (
                    <div className="space-y-3 p-4" role="status" aria-busy="true">
                        <span className="sr-only">Loading leases</span>
                        {[0, 1, 2, 3].map((row) => (
                            <div
                                key={row}
                                className="h-10 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
                            />
                        ))}
                    </div>
                ) : visible.length ? (
                    <Table containerClassName="rounded-none border-0" scrollLabel="Leases and agreements">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Resident</TableHead>
                                <TableHead>Space</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Lease state</TableHead>
                                <TableHead>Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <span className="block font-semibold text-[var(--vms-ink)]">
                                            {row.resident}
                                        </span>
                                        <span className="block text-xs text-[var(--vms-ink-muted)]">
                                            {row.email || "No email on file"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{row.unit}</TableCell>
                                    <TableCell className="text-[var(--vms-ink-muted)]">
                                        {titleCase(row.role)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-[var(--vms-ink-muted)]">
                                        {row.effectiveFrom
                                            ? format(new Date(row.effectiveFrom), "d MMM yyyy")
                                            : "—"}{" "}
                                        –{" "}
                                        {row.effectiveTo
                                            ? format(new Date(row.effectiveTo), "d MMM yyyy")
                                            : "Open-ended"}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge tone={leaseTone(row.state)}>
                                            {titleCase(row.state)}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-[var(--vms-ink-muted)]">
                                        {row.days === null
                                            ? "No end date"
                                            : row.days < 0
                                                ? `${Math.abs(row.days)} d ago`
                                                : `${row.days} d left`}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={Scale}
                        title="No leases to review"
                        description="Occupancy relationships with agreement dates will appear here as soon as they are recorded."
                        action={
                            <Button asChild variant="outline">
                                <Link href="/admin/residential/occupancies">
                                    <CalendarClock aria-hidden className="h-4 w-4" />
                                    Add an occupancy
                                </Link>
                            </Button>
                        }
                    />
                )}
            </section>
        </ResidentialShell>
    );
}
