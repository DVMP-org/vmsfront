"use client";

import { useState, useMemo, useCallback, ReactNode, useEffect, useRef } from "react";
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
import { Badge } from "./Badge";
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
  CheckSquare,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select";
  filterOptions?: { value: string; label: string }[];
  className?: string;
}

export interface FilterConfig {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "not_in";
  value: string | number | boolean | string[];
}

export interface FilterableField {
  field: string;
  operator?: FilterConfig["operator"];
  value?: string | number | boolean | string[] | null;
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
  // Multi-select support
  selectable?: boolean;
  getRowId?: (row: T) => string;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  // Server-side pagination support
  serverSide?: boolean;
  total?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  // External search/filter (for server-side)
  externalSearch?: string;
  onSearchChange?: (search: string) => void;
  // API-level operations
  onFiltersChange?: (filters: FilterConfig[]) => void;
  onSortChange?: (sort: string | null) => void;
  // Filterable fields from payload (e.g., status, house_id, category_id)
  filterableFields?: FilterableField[];
  // Disable client-side operations when using API-level
  disableClientSideFiltering?: boolean;
  disableClientSideSorting?: boolean;
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
  selectable = false,
  getRowId = (row: T) => (row as any).id || String(row),
  selectedRows,
  onSelectionChange,
  serverSide = false,
  total,
  currentPage: externalPage,
  onPageChange,
  externalSearch,
  onSearchChange,
  onFiltersChange,
  onSortChange,
  filterableFields = [],
  disableClientSideFiltering = false,
  disableClientSideSorting = false,
}: DataTableProps<T>) {
  // Validate and normalize inputs to prevent runtime errors
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  const [searchTerm, setSearchTerm] = useState(externalSearch || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(externalSearch || "");
  const [sortState, setSortState] = useState<SortState>({
    column: "",
    direction: null,
  });
  const [internalPage, setInternalPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isUserTypingRef = useRef(false);
  const lastLocalValueRef = useRef(externalSearch || "");

  // Sync local search term with external search when it changes externally (not from user typing)
  useEffect(() => {
    // Only sync if:
    // 1. externalSearch is defined (controlled mode)
    // 2. externalSearch actually changed
    // 3. We're not currently typing (user input takes precedence)
    // 4. The external value is different from what we last set locally
    if (externalSearch !== undefined &&
      externalSearch !== lastLocalValueRef.current &&
      !isUserTypingRef.current) {
      setLocalSearchTerm(externalSearch);
      lastLocalValueRef.current = externalSearch;
    }
  }, [externalSearch]);

  // Build filters from filterableFields
  const apiFilters = useMemo(() => {
    if (!filterableFields || filterableFields.length === 0) {
      return [];
    }

    return filterableFields
      .filter((field) => field.value !== undefined && field.value !== null && field.value !== "")
      .map((field) => ({
        field: field.field,
        operator: field.operator || "eq",
        value: field.value!,
      }));
  }, [filterableFields]);

  // Use ref to store the latest onFiltersChange callback to avoid re-renders
  const onFiltersChangeRef = useRef(onFiltersChange);
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Notify parent when filters change
  useEffect(() => {
    if (onFiltersChangeRef.current) {
      onFiltersChangeRef.current(apiFilters);
    }
  }, [apiFilters]);

  // Use external page if provided (server-side), otherwise use internal
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const setCurrentPage = onPageChange || setInternalPage;

  // Use local search term for input value to prevent focus loss, external search for filtering
  const effectiveSearch = externalSearch !== undefined ? localSearchTerm : searchTerm;
  const searchValueForFiltering = externalSearch !== undefined ? externalSearch : searchTerm;

  // Internal selection state if not controlled
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selected = selectedRows !== undefined ? selectedRows : internalSelected;
  const setSelected = onSelectionChange || setInternalSelected;

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

  // Filter data (only for client-side filtering)
  const filteredData = useMemo(() => {
    if (serverSide || disableClientSideFiltering) {
      // Server-side: return data as-is, filtering is done on server
      return safeData;
    }

    let result = [...safeData];

    // Apply search
    if (searchValueForFiltering) {
      const searchLower = searchValueForFiltering.toLowerCase();
      result = result.filter((row) =>
        safeColumns.some((col) => {
          const value = getComparableValue(row, col);
          return value.toLowerCase().includes(searchLower);
        })
      );
    }

    return result;
  }, [safeData, searchValueForFiltering, safeColumns, getComparableValue, serverSide, disableClientSideFiltering]);

  // Sort data
  const sortedData = useMemo(() => {
    if (disableClientSideSorting) {
      // Server-side sorting: return data as-is
      return filteredData;
    }

    if (!sortState.column || !sortState.direction) {
      return filteredData;
    }

    const column = safeColumns.find((col) => col.key === sortState.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getComparableValue(a, column);
      const bValue = getComparableValue(b, column);

      const comparison = aValue.localeCompare(bValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortState, safeColumns, getComparableValue, disableClientSideSorting]);

  // Paginate data (only for client-side pagination)
  const paginatedData = useMemo(() => {
    if (serverSide || !showPagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination, serverSide]);

  const totalPages = serverSide && total !== undefined
    ? Math.ceil(total / pageSize)
    : Math.ceil(sortedData.length / pageSize);
  const displayTotal = serverSide && total !== undefined ? total : sortedData.length;

  // Handle sorting
  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      let newState: SortState;
      if (prev.column === columnKey) {
        if (prev.direction === "asc") {
          newState = { column: columnKey, direction: "desc" };
        } else if (prev.direction === "desc") {
          newState = { column: "", direction: null };
        } else {
          newState = { column: columnKey, direction: "asc" };
        }
      } else {
        newState = { column: columnKey, direction: "asc" };
      }

      // If API-level sorting is enabled, notify parent
      if (onSortChange) {
        if (newState.column && newState.direction) {
          const sortString = `${newState.column}:${newState.direction}`;
          onSortChange(sortString);
        } else {
          onSortChange(null);
        }
      }

      return newState;
    });
    setCurrentPage(1);
  };

  // Handle search change - update local state immediately, then update parent
  const handleSearchChange = useCallback((value: string) => {
    // Mark that we're updating from user input
    isUserTypingRef.current = true;

    // Update local state immediately to keep input responsive and maintain focus
    setLocalSearchTerm(value);
    lastLocalValueRef.current = value;

    // Update parent state (triggers API call) - but don't block on it
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setSearchTerm(value);
    }
    setCurrentPage(1);

    // Reset typing flag after a delay to allow external updates to sync
    // This prevents the useEffect from overwriting our local state while typing
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 300);
  }, [onSearchChange, setCurrentPage]);

  // Selection handlers
  const toggleRowSelection = (rowId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === paginatedData.length) {
      setSelected(new Set());
    } else {
      const allIds = new Set(paginatedData.map((row) => getRowId(row)));
      setSelected(allIds);
    }
  };

  const allSelected = paginatedData.length > 0 && selected.size === paginatedData.length;
  const someSelected = selected.size > 0 && selected.size < paginatedData.length;

  // Clear all filters
  const clearAllFilters = () => {
    setLocalSearchTerm("");
    lastLocalValueRef.current = "";
    if (onSearchChange) {
      onSearchChange("");
    } else {
      setSearchTerm("");
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = apiFilters.length > 0 || searchValueForFiltering;

  return (
    <div className={cn("space-y-3 xs:space-y-4", className)}>
      {/* Search */}
      {searchable && (
        <div className="flex flex-col gap-2 xs:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              key="search-input"
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={effectiveSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

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

      {/* Table */}
      <Table className="min-w-full text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center p-1 hover:bg-muted rounded transition-colors"
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : someSelected ? (
                    <div className="h-4 w-4 border-2 border-primary rounded bg-primary/20" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
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
                      aria-label={`Sort by ${column.header}`}
                    >
                      {sortState.column === column.key ? (
                        sortState.direction === "asc" ? (
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
                colSpan={safeColumns.length + (selectable ? 1 : 0)}
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
            paginatedData.map((row, index) => {
              const rowId = getRowId(row);
              const isSelected = selected.has(rowId);
              return (
                <TableRow key={rowId || index}>
                  {selectable && (
                    <TableCell>
                      <button
                        onClick={() => toggleRowSelection(rowId)}
                        className="flex items-center justify-center p-1 hover:bg-muted rounded transition-colors"
                        aria-label={isSelected ? "Deselect row" : "Select row"}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
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
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
          <div className="text-xs xs:text-sm text-muted-foreground text-center xs:text-left">
            <span className="hidden sm:inline">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, displayTotal)} of{" "}
              {displayTotal} results
            </span>
            <span className="sm:hidden">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 xs:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
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
          Showing {displayTotal} result{displayTotal !== 1 ? "s" : ""}
        </div>
      )}

      {/* Selection Info */}
      {selectable && selected.size > 0 && (
        <div className="text-xs text-muted-foreground border-t border-zinc-200 pt-3">
          {selected.size} row{selected.size !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}
