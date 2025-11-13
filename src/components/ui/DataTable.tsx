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
  X
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

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  emptyMessage?: string;
  className?: string;
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
}: DataTableProps<T>) {
  // Validate and normalize inputs to prevent runtime errors
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: "",
    direction: null,
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

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
    let result = [...safeData];

    // Apply search
    if (searchTerm) {
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
  }, [safeData, searchTerm, filters, safeColumns, getComparableValue]);

  // Sort data
  const sortedData = useMemo(() => {
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
  }, [filteredData, sortState, safeColumns, getComparableValue]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.column === columnKey) {
        if (prev.direction === "asc") {
          return { column: columnKey, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { column: "", direction: null };
        }
      }
      return { column: columnKey, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1);
  };

  // Clear filter
  const clearFilter = (columnKey: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
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
                    <option value="">All {column.header}</option>
                    {column.filterOptions?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder={`Filter ${column.header}...`}
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
      <Table className="min-w-full text-xs sm:text-sm">
          <TableHeader>
            <TableRow>
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
                colSpan={safeColumns.length}
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
                <TableRow key={index}>
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

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
          <div className="text-xs xs:text-sm text-muted-foreground text-center xs:text-left">
            <span className="hidden sm:inline">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
              {sortedData.length} results
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
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
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
          Showing {sortedData.length} result{sortedData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
