"use client";

import { useState, useMemo, useCallback, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./Table";
import { Input } from "./Input";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string | ReactNode;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select";
  filterOptions?: { value: string; label: string }[];
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  emptyMessage?: string;
  className?: string;
  // Controlled sorting props
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  // Controlled pagination props
  manualPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Controlled search
  onSearch?: (term: string) => void;
  // Selection props
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowId?: keyof T; // Key to use for selection ID (default: "id")
  isLoading?: boolean;
}

type SortDirection = "asc" | "desc" | null;
type SortState = {
  column: string;
  direction: SortDirection;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  showPagination = true,
  emptyMessage = "No data available",
  className,
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  onSort: externalOnSort,
  manualPagination = false,
  currentPage: externalPage = 1,
  totalPages: externalTotalPages = 1,
  onPageChange,
  onSearch,
  enableSelection = false,
  selectedIds = [],
  onSelectionChange,
  rowId = "id",
  isLoading = false,
}: DataTableProps<T>) {
  // Validate and normalize inputs to prevent runtime errors
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [internalSortState, setInternalSortState] = useState<SortState>({
    column: "",
    direction: null,
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Determine current sort state (controlled or internal)
  const isControlledSort = externalSortColumn !== undefined && externalSortDirection !== undefined;
  const currentSortColumn = isControlledSort ? externalSortColumn : internalSortState.column;
  const currentSortDirection = isControlledSort ? externalSortDirection : internalSortState.direction;

  // Use controlled or internal page
  const page = manualPagination ? externalPage : currentPage;

  const getComparableValue = useCallback((row: T, column: Column<T>): string => {
    const rawValue = row[column.key];

    if (rawValue !== undefined && rawValue !== null) {
      return String(rawValue);
    }

    if (column.accessor) {
      const accessorValue = column.accessor(row);

      if (
        typeof accessorValue === "string" ||
        typeof accessorValue === "number" ||
        typeof accessorValue === "boolean"
      ) {
        return String(accessorValue);
      }

      return "";
    }

    return "";
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    // If manual pagination/search is enabled, we assume filtering is handled externally for search,
    // but maybe not for column filters. For simplicity, if onSearch is provided, we skip internal search logic.
    let result = [...safeData];

    // Apply search
    if (searchTerm && !onSearch) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        safeColumns.some((col) => {
          const value = getComparableValue(row, col);
          return value.toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const column = safeColumns.find((col) => col.key === key);
        if (column) {
          result = result.filter((row) => {
            const cellValue = getComparableValue(row, column);
            return cellValue.toLowerCase().includes(value.toLowerCase());
          });
        }
      }
    });

    return result;
  }, [safeData, searchTerm, filters, safeColumns, getComparableValue, onSearch]);

  // Sort data (only if NOT controlled)
  const sortedData = useMemo(() => {
    // If controlled, we assume data is already sorted by parent
    if (isControlledSort || manualPagination) return filteredData;

    if (!internalSortState.column || !internalSortState.direction) {
      return filteredData;
    }

    const column = safeColumns.find((col) => col.key === internalSortState.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getComparableValue(a, column);
      const bValue = getComparableValue(b, column);

      const comparison = aValue.localeCompare(bValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return internalSortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, internalSortState, safeColumns, getComparableValue, isControlledSort, manualPagination]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (manualPagination) return safeData; // Expecting data to be just the current page
    if (!showPagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination, manualPagination, safeData]);

  const totalPages = manualPagination ? externalTotalPages : Math.ceil(sortedData.length / pageSize);

  // Selection Logic
  const allCurrentPageIds = useMemo(() => {
    return paginatedData.map(row => String(row[rowId]));
  }, [paginatedData, rowId]);

  const isAllSelected = useMemo(() => {
    if (allCurrentPageIds.length === 0) return false;
    return allCurrentPageIds.every(id => selectedIds.includes(id));
  }, [allCurrentPageIds, selectedIds]);

  const isPartiallySelected = useMemo(() => {
    if (allCurrentPageIds.length === 0) return false;
    const selectedOnPage = allCurrentPageIds.filter(id => selectedIds.includes(id));
    return selectedOnPage.length > 0 && selectedOnPage.length < allCurrentPageIds.length;
  }, [allCurrentPageIds, selectedIds]);

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      // Select all on this page
      const uniqueSelected = Array.from(new Set([...selectedIds, ...allCurrentPageIds]));
      onSelectionChange(uniqueSelected);
    } else {
      // Deselect all on this page
      const newSelected = selectedIds.filter(id => !allCurrentPageIds.includes(id));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(prevId => prevId !== id));
    }
  };


  // Handle sorting
  const handleSort = (columnKey: string) => {
    let newDirection: SortDirection = "asc";

    if (currentSortColumn === columnKey) {
      if (currentSortDirection === "asc") {
        newDirection = "desc";
      } else if (currentSortDirection === "desc") {
        newDirection = null; // Reset
      }
    }

    if (externalOnSort) {
      externalOnSort(columnKey, newDirection);
    }

    // Always update internal state for UI consistency if not fully controlled or hybrid
    setInternalSortState({
      column: newDirection ? columnKey : "",
      direction: newDirection
    });

    if (!manualPagination) {
      setCurrentPage(1);
    }
  };

  // Handle filter change
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    if (!manualPagination) setCurrentPage(1);
  };

  // Clear filter
  const clearFilter = (columnKey: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
    if (!manualPagination) setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    if (!manualPagination) setCurrentPage(1);
    if (onSearch) onSearch("");
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!manualPagination) setCurrentPage(1);
    if (onSearch) onSearch(value);
  }

  const handlePageChange = (newPage: number) => {
    if (manualPagination) {
      if (onPageChange) onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  return (
    <div className={cn("space-y-3 xs:space-y-4", className)}>
      {/* Search and Filters */}
      {(searchable || safeColumns.some((col) => col.filterable)) && (
        <div className="flex flex-col gap-2 xs:gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              <span className="hidden xs:inline">Clear Filters</span>
              <span className="xs:hidden">Clear</span>
            </Button>
          )}
        </div>
      )}

      {/* Column Filters */}
      {safeColumns.some((col) => col.filterable) && (
        <div className="flex flex-wrap gap-2 xs:gap-3">
          {safeColumns
            .filter((col) => col.filterable)
            .map((column) => (
              <div
                key={column.key}
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
              >
                {column.filterType === "select" ? (
                  <select
                    value={filters[column.key] || ""}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto touch-manipulation"
                  >
                    <option value="">All {typeof column.header === 'string' ? column.header : ''}</option>
                    {column.filterOptions?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder={`Filter ${typeof column.header === 'string' ? column.header : ''}...`}
                    value={filters[column.key] || ""}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="w-full sm:w-48"
                  />
                )}
                {filters[column.key] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter(column.key)}
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <Table className="min-w-full text-xs sm:text-sm">
          <TableHeader>
            <TableRow>
              {enableSelection && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={isAllSelected || (isPartiallySelected ? "indeterminate" : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {safeColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.className}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="hover:text-foreground transition-colors"
                        aria-label={`Sort by ${typeof column.header === 'string' ? column.header : column.key}`}
                      >
                        {currentSortColumn === column.key ? (
                          currentSortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={safeColumns.length + (enableSelection ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                      >
                        Clear filters to see all results
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow key={index} data-state={selectedIds.includes(String(row[rowId])) ? "selected" : undefined}>
                  {enableSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(String(row[rowId]))}
                        onCheckedChange={(checked) => handleSelectRow(String(row[rowId]), !!checked)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {safeColumns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.accessor
                        ? column.accessor(row)
                        : String(row[column.key] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
          <div className="text-xs xs:text-sm text-muted-foreground text-center xs:text-left">
            {manualPagination ? (
              <span>
                Page {page} of {totalPages}
              </span>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
                  {sortedData.length} results
                </span>
                <span className="sm:hidden">
                  Page {currentPage} of {totalPages}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 xs:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="h-9 w-9 p-0"
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-9 w-9 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {/* Simplified pagination for now to avoid complexity in ref logic. Just show current +/- 2 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[2.25rem] h-9 text-xs xs:text-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(Math.min(totalPages, page + 1))
              }
              disabled={page === totalPages}
              className="h-9 w-9 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="h-9 w-9 p-0"
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Results Info */}
      {!showPagination && (
        <div className="text-xs xs:text-sm text-muted-foreground text-center">
          {manualPagination ? (
            <>Showing results (total count controlled externally)</>
          ) : (
            <>Showing {sortedData.length} result{sortedData.length !== 1 ? "s" : ""}</>
          )}
        </div>
      )}
    </div>
  );
}
