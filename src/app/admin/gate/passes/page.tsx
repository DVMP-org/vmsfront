"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { User, ArrowUpDown, ArrowUp, ArrowDown, X, MoreVertical } from "lucide-react";
import { GatePassStatus, GatePass } from "@/types";
import { useAdminGatePasses } from "@/hooks/use-admin";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "All statuses", value: undefined },
  { label: "Active / Checked-in", value: GatePassStatus.CHECKED_IN },
  { label: "Checked-out", value: GatePassStatus.CHECKED_OUT },
  { label: "Pending", value: GatePassStatus.PENDING },
  { label: "Completed", value: GatePassStatus.COMPLETED },
  { label: "Revoked", value: GatePassStatus.REVOKED },
  { label: "Expired", value: GatePassStatus.EXPIRED },
];

type SortField = "code" | "status" | "created_at" | "updated_at" | null;
type SortDirection = "asc" | "desc" | null;

export default function AdminGatePassesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching } = useAdminGatePasses({
    page,
    pageSize,
    search: search.trim() || undefined,
    status,
  });

  let passes = useMemo(() => data?.items ?? [], [data?.items]);

  // Client-side sorting (can be replaced with server-side when API supports it)
  passes = useMemo(() => {
    if (!sortField || !sortDirection) return passes;

    return [...passes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "code":
          aValue = a.code?.toLowerCase() || "";
          bValue = b.code?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "created_at":
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case "updated_at":
          aValue = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          bValue = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [passes, sortField, sortDirection]);

  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const togglePassSelection = useCallback((passId: string) => {
    setSelectedPasses((prev) => {
      const next = new Set(prev);
      if (next.has(passId)) {
        next.delete(passId);
      } else {
        next.add(passId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPasses(new Set(passes.map((p) => p.id)));
    } else {
      setSelectedPasses(new Set());
    }
  }, [passes]);

  const allSelected = passes.length > 0 && selectedPasses.size === passes.length;
  const someSelected = selectedPasses.size > 0 && selectedPasses.size < passes.length;

  const handleBulkRevoke = useCallback(async () => {
    if (selectedPasses.size === 0) return;
    // TODO: Implement bulk revoke API call
    toast.info(`Revoking ${selectedPasses.size} pass(es)...`);
    // For now, just clear selection
    setSelectedPasses(new Set());
  }, [selectedPasses]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedPasses.size === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPasses.size} pass(es)? This action cannot be undone.`
    );
    if (!confirmed) return;
    // TODO: Implement bulk delete API call
    toast.info(`Deleting ${selectedPasses.size} pass(es)...`);
    setSelectedPasses(new Set());
  }, [selectedPasses]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <TableHead className="cursor-pointer select-none" onClick={() => handleSort(field)}>
        <div className="flex items-center gap-1.5">
          <span>{children}</span>
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 text-foreground" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-foreground" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Gate Passes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {total > 0 ? `${total} total pass${total !== 1 ? "es" : ""}` : "All issued gate passes"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* Filters and Actions */}
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                  <Input
                    value={search}
                    onChange={(event) => {
                      setPage(1);
                      setSearch(event.target.value);
                    }}
                    placeholder="Search pass code, resident or visitor..."
                    className="flex-1 max-w-sm"
                  />
                  <select
                    value={status ?? ""}
                    onChange={(event) => {
                      setPage(1);
                      setStatus(event.target.value || undefined);
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.label} value={option.value ?? ""}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPage(1);
                      setPageSize(Number(event.target.value));
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedPasses.size > 0 && (
                <div className="flex items-center justify-between border border-border bg-muted/30 px-3 py-2 rounded-sm">
                  <span className="text-sm text-foreground">
                    {selectedPasses.size} pass{selectedPasses.size !== 1 ? "es" : ""} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPasses(new Set())}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkRevoke}
                    >
                      Revoke
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <TableSkeleton />
            ) : passes.length === 0 ? (
              <EmptyState
                icon={User}
                title="No passes yet"
                description="Once visitors or residents generate passes, they will appear here."
              />
            ) : (
              <>
                <div className="border border-border rounded-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someSelected;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 rounded border-input cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableHead>
                        <SortableHeader field="code">Pass code</SortableHeader>
                        <TableHead>Resident</TableHead>
                        <SortableHeader field="status">Status</SortableHeader>
                        <TableHead>Validity</TableHead>
                        <TableHead>Uses</TableHead>
                        <SortableHeader field="updated_at">Last updated</SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {passes.map((pass) => {
                        const isSelected = selectedPasses.has(pass.id);
                        return (
                          <TableRow
                            key={pass.id}
                            className={isSelected ? "bg-muted/50" : ""}
                            onClick={(e) => {
                              // Don't navigate if clicking checkbox
                              if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                                return;
                              }
                              router.push(`/admin/gate/passes/${pass.id}`);
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePassSelection(pass.id)}
                                className="h-4 w-4 rounded border-input cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {pass.code}
                            </TableCell>
                            <TableCell className="text-sm">
                              {pass.visitors?.[0]?.name ??
                                pass.visitors?.[0]?.email ??
                                "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pass.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pass.valid_from && pass.valid_to ? (
                                <>
                                  {new Date(pass.valid_from).toLocaleDateString()} –{" "}
                                  {new Date(pass.valid_to).toLocaleDateString()}
                                </>
                              ) : (
                                "Flexible"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {pass.uses_count}/{pass.max_uses ?? "∞"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pass.updated_at
                                ? formatDistanceToNow(new Date(pass.updated_at), {
                                  addSuffix: true,
                                })
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4">
                    <PaginationBar
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      totalPages={totalPages}
                      hasNext={data?.has_next}
                      hasPrevious={data?.has_previous}
                      resourceLabel="passes"
                      onChange={setPage}
                      isFetching={isFetching}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    [GatePassStatus.CHECKED_IN]: {
      label: "Checked in",
      className: "bg-muted text-foreground border border-border",
    },
    [GatePassStatus.CHECKED_OUT]: {
      label: "Checked out",
      className: "bg-muted text-muted-foreground border border-border",
    },
    [GatePassStatus.PENDING]: {
      label: "Pending",
      className: "bg-muted text-foreground border border-border",
    },
    [GatePassStatus.REVOKED]: {
      label: "Revoked",
      className: "bg-muted text-destructive border border-border",
    },
    [GatePassStatus.EXPIRED]: {
      label: "Expired",
      className: "bg-muted text-muted-foreground border border-border",
    },
    [GatePassStatus.COMPLETED]: {
      label: "Completed",
      className: "bg-muted text-muted-foreground border border-border",
    },
  };

  const data = statusMap[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <Badge variant="secondary" className={`${data.className} font-normal text-xs`}>
      {data.label}
    </Badge>
  );
}
