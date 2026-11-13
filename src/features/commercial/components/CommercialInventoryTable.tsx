"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Archive,
    Building2,
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    Pencil,
    RotateCcw,
    Store,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
    DataTable,
    type BulkAction,
    type Column,
    type FilterDefinition,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import { cn } from "@/lib/utils";

import {
    commercialSpaceTypeLabel,
    commercialSpaceTypes,
    titleCase,
} from "../contracts";
import {
    defaultExpandedInventoryIds,
    flattenInventoryRows,
    type InventoryDisplayRow,
    type InventoryRow,
} from "../lib";

function RowToggle({
    row,
    expanded,
    onToggle,
}: {
    row: InventoryDisplayRow;
    expanded: boolean;
    onToggle: () => void;
}) {
    if (!row.has_children) {
        return <span className="block h-7 w-7 shrink-0" aria-hidden="true" />;
    }
    return (
        <button
            type="button"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${row.name}`}
            aria-expanded={expanded}
            onClick={onToggle}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
        >
            <ChevronRight
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
                aria-hidden="true"
            />
        </button>
    );
}

/** What the row holds, written once and reused by table and mobile summary. */
function rowDetail(row: InventoryDisplayRow) {
    if (row.is_container) {
        if (row.child_count === 0) return "No places inside yet";
        return `${row.child_count} place${row.child_count === 1 ? "" : "s"} inside`;
    }
    return row.location;
}

export function CommercialInventoryTable({
    rows,
    isLoading,
    errorMessage,
    isStale,
    onRetry,
    canManage,
    onEdit,
    onToggleState,
}: {
    rows: InventoryRow[];
    isLoading: boolean;
    errorMessage: string | null;
    isStale: boolean;
    onRetry: () => void;
    canManage: boolean;
    onEdit: (row: InventoryRow) => void;
    onToggleState: (rows: InventoryRow[]) => Promise<unknown>;
}) {
    const { confirmAction, confirmationDialog } = useConfirmAction();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    // Expansion is stored as the exception: buildings with places are open by
    // default, so a new building appears expanded without extra bookkeeping.
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

    const defaults = useMemo(() => defaultExpandedInventoryIds(rows), [rows]);
    const expandedIds = useMemo(() => {
        const next = new Set(defaults);
        collapsed.forEach((id) => next.delete(id));
        return next;
    }, [collapsed, defaults]);
    const displayRows = useMemo(
        () => flattenInventoryRows(rows, expandedIds),
        [expandedIds, rows],
    );
    const buildings = useMemo(
        () => rows.filter((row) => row.is_container),
        [rows],
    );

    function toggle(row: InventoryDisplayRow) {
        setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
        });
    }

    function expandAll() {
        setCollapsed(new Set());
    }

    function collapseAll() {
        setCollapsed(new Set(defaults));
    }

    function requestArchive(row: InventoryDisplayRow) {
        if (!row.is_active) {
            void onToggleState([row]);
            return;
        }
        confirmAction({
            title: `Archive ${row.name}?`,
            description:
                "This removes the space from active inventory. Existing occupancy or future use may prevent archiving.",
            confirmLabel: "Archive space",
            onConfirm: () => onToggleState([row]),
        });
    }

    const filters: FilterDefinition[] = [
        {
            field: "location",
            label: "Building",
            type: "select",
            isSearchable: true,
            options: buildings.map((row) => ({ value: row.name, label: row.name })),
        },
        {
            field: "commercial_type",
            label: "Space type",
            type: "select",
            options: commercialSpaceTypes.map((type) => ({
                value: type.value,
                label: type.label,
            })),
        },
        {
            field: "occupancy",
            label: "Occupancy",
            type: "select",
            options: [
                { value: "occupied", label: "Occupied" },
                { value: "vacant", label: "Vacant" },
            ],
        },
        {
            field: "state",
            label: "Status",
            type: "select",
            options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
            ],
        },
    ];

    const columns: Column<InventoryDisplayRow>[] = [
        {
            key: "name",
            header: "Space",
            accessor: (row) => {
                const expanded = expandedIds.has(row.id);
                return (
                    <span
                        className="flex min-w-0 items-center gap-2"
                        style={{ paddingLeft: row.depth * 20 }}
                    >
                        <RowToggle row={row} expanded={expanded} onToggle={() => toggle(row)} />
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
                            {row.commercial_type === "shop" ||
                                row.commercial_type === "retail_unit" ? (
                                <Store className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <Building2 className="h-4 w-4" aria-hidden="true" />
                            )}
                        </span>
                        <span className="min-w-0">
                            <Link
                                href={`/admin/places/${row.id}`}
                                className="block truncate font-semibold underline-offset-4 hover:underline"
                            >
                                {row.name}
                            </Link>
                            <span className="block text-xs text-[var(--vms-ink-muted)]">
                                {rowDetail(row)}
                            </span>
                        </span>
                    </span>
                );
            },
        },
        {
            key: "commercial_type",
            header: "Type",
            accessor: (row) => commercialSpaceTypeLabel(row.commercial_type),
        },
        {
            key: "occupancy",
            header: "Occupancy",
            accessor: (row) => (
                <StatusBadge
                    tone={
                        row.is_container
                            ? "info"
                            : row.occupancy === "occupied"
                                ? "success"
                                : "neutral"
                    }
                >
                    {row.is_container ? "Container" : titleCase(row.occupancy)}
                </StatusBadge>
            ),
        },
        {
            key: "occupants",
            header: "Business relationship",
            accessor: (row) => (
                <span className="block max-w-64 truncate">
                    {row.occupants ||
                        (row.is_container
                            ? "Holds lettable spaces"
                            : "No active relationship")}
                </span>
            ),
        },
        {
            key: "state",
            header: "Status",
            accessor: (row) => (
                <StatusBadge tone={row.is_active ? "success" : "warning"}>
                    {titleCase(row.state)}
                </StatusBadge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            className: "text-right",
            mobileHide: true,
            accessor: (row) =>
                canManage ? (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => onEdit(row)}
                        >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`${row.is_active ? "Archive" : "Activate"} ${row.name}`}
                            onClick={() => requestArchive(row)}
                        >
                            {row.is_active ? (
                                <Archive className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            )}
                        </Button>
                    </div>
                ) : null,
        },
    ];

    const bulkActions: BulkAction[] = canManage
        ? [
            {
                label: "Activate",
                icon: RotateCcw,
                onClick: (ids) =>
                    void onToggleState(rows.filter((row) => ids.includes(row.id))),
            },
            {
                label: "Archive",
                icon: Archive,
                variant: "destructive",
                requiresConfirmation: true,
                confirmationMessage:
                    "Archive the selected commercial spaces? Active relationships or future use may prevent archiving.",
                onClick: (ids) =>
                    void onToggleState(rows.filter((row) => ids.includes(row.id))),
            },
        ]
        : [];

    return (
        <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--vms-ink-muted)]">
                    {buildings.length} building{buildings.length === 1 ? "" : "s"} ·{" "}
                    {rows.length - buildings.length} space
                    {rows.length - buildings.length === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={expandAll}>
                        <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                        Expand all
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                        <ChevronsDownUp className="h-4 w-4" aria-hidden="true" />
                        Collapse all
                    </Button>
                </div>
            </div>
            <DataTable
                data={displayRows}
                columns={columns}
                availableFilters={filters}
                searchPlaceholder="Search spaces, buildings or occupants"
                selectable={canManage}
                selectedRows={selected}
                onSelectionChange={setSelected}
                bulkActions={bulkActions}
                isLoading={isLoading}
                errorMessage={errorMessage}
                isStale={isStale}
                onRetry={onRetry}
                emptyMessage="No commercial spaces match this property."
                tableLabel="Commercial space inventory"
                hierarchy={{
                    parentId: (row) => row.parent_id,
                    isExpanded: (id) => expandedIds.has(id),
                }}
                mobileSummary={(row) => {
                    const expanded = expandedIds.has(row.id);
                    return (
                        <div className="space-y-3">
                            <div
                                className="flex items-start justify-between gap-3"
                                style={{ paddingLeft: row.depth * 12 }}
                            >
                                <div className="flex min-w-0 items-start gap-2">
                                    <RowToggle
                                        row={row}
                                        expanded={expanded}
                                        onToggle={() => toggle(row)}
                                    />
                                    <div className="min-w-0">
                                        <Link
                                            href={`/admin/places/${row.id}`}
                                            className="font-semibold underline-offset-4 hover:underline"
                                        >
                                            {row.name}
                                        </Link>
                                        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                            {rowDetail(row)} ·{" "}
                                            {commercialSpaceTypeLabel(row.commercial_type)}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge
                                    tone={
                                        row.is_container
                                            ? "info"
                                            : row.occupancy === "occupied"
                                                ? "success"
                                                : "neutral"
                                    }
                                >
                                    {row.is_container ? "Container" : titleCase(row.occupancy)}
                                </StatusBadge>
                            </div>
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                {row.occupants ||
                                    (row.is_container
                                        ? "Holds lettable spaces"
                                        : "No active business relationship")}
                            </p>
                            {canManage ? (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
                                        Edit space
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => requestArchive(row)}
                                    >
                                        {row.is_active ? "Archive" : "Activate"}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    );
                }}
            />
            {confirmationDialog}
        </>
    );
}
