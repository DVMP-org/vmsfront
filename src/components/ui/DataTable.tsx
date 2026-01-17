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
  Square,
  FilterX,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";
import DatePicker from "react-datepicker";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "./SearchableSelect";

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

export interface FilterDefinition {
  field: string;
  label: string;
  type: "select" | "date" | "date-range";
  options?: Array<{ value: string; label: string }>;
  operator?: FilterConfig["operator"];
  isSearchable?: boolean;
}

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedIds: string[]) => void;
  variant?: "primary" | "destructive" | "outline" | "secondary" | "ghost";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
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
  // Search - now fully managed internally
  initialSearch?: string;
  onSearchChange?: (search: string) => void;
  // Filters - now fully managed internally
  availableFilters?: FilterDefinition[];
  initialFilters?: FilterConfig[];
  onFiltersChange?: (filters: FilterConfig[]) => void;
  // Sort - now fully managed internally
  initialSort?: string | null;
  onSortChange?: (sort: string | null) => void;
  // Legacy props for backward compatibility
  externalSearch?: string;
  filterableFields?: FilterableField[];
  // Disable client-side operations when using API-level
  disableClientSideFiltering?: boolean;
  disableClientSideSorting?: boolean;
  // Bulk actions
  bulkActions?: BulkAction[];
  isLoading?: boolean | null;
  // Row styling
  rowClassName?: (row: T) => string;
  enableRowStriping?: boolean;
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
  pageSizeOptions = [10, 20, 30, 50, 100],
  onPageSizeChange,
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
  initialSearch: propInitialSearch = "",
  onSearchChange,
  availableFilters = [],
  initialFilters: propInitialFilters = [],
  onFiltersChange,
  initialSort: propInitialSort = null,
  onSortChange,
  // Legacy props for backward compatibility
  externalSearch,
  filterableFields = [],
  disableClientSideFiltering = false,
  disableClientSideSorting = false,
  bulkActions = [],
  isLoading = false,
  rowClassName,
  enableRowStriping = true,
}: DataTableProps<T>) {
  // Validate and normalize inputs to prevent runtime errors
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  // Use new props if provided, fall back to legacy props for backward compatibility
  const effectiveInitialSearch = useMemo(() => propInitialSearch || externalSearch || "", [propInitialSearch, externalSearch]);
  const effectiveInitialFilters = useMemo(() => {
    if (propInitialFilters.length > 0) {
      return propInitialFilters;
    }
    if (filterableFields.length > 0) {
      return filterableFields
        .filter(f => f.value !== undefined && f.value !== null && f.value !== "")
        .map(f => ({
          field: f.field,
          operator: (f.operator || "eq") as FilterConfig["operator"],
          value: f.value!,
        }));
    }
    return [];
  }, [propInitialFilters, filterableFields]);

  // Internal state for search
  const [localSearchTerm, setLocalSearchTerm] = useState(effectiveInitialSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isUserTypingRef = useRef(false);
  const lastLocalValueRef = useRef(effectiveInitialSearch);

  // Internal state for filters - map field to value
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    effectiveInitialFilters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== "") {
        const filterDef = availableFilters.find((f) => f.field === filter.field);
        if (filterDef?.type === "date-range") {
          if (filter.operator === "gte") {
            initial[`${filter.field}_from`] = String(filter.value);
          } else if (filter.operator === "lte") {
            initial[`${filter.field}_to`] = String(filter.value);
          }
        } else {
          initial[filter.field] = String(filter.value);
        }
      }
    });
    return initial;
  });

  // Internal state for sort
  const [sortState, setSortState] = useState<SortState>(() => {
    if (propInitialSort) {
      const [column, direction] = propInitialSort.split(":");
      return {
        column: column || "",
        direction: (direction === "asc" || direction === "desc" ? direction : null) as SortDirection,
      };
    }
    return { column: "", direction: null };
  });

  const [internalPage, setInternalPage] = useState(1);

  // Sync local search with external initialSearch
  useEffect(() => {
    if (effectiveInitialSearch !== undefined &&
      effectiveInitialSearch !== lastLocalValueRef.current &&
      !isUserTypingRef.current) {
      setLocalSearchTerm(effectiveInitialSearch);
      lastLocalValueRef.current = effectiveInitialSearch;
    }
  }, [effectiveInitialSearch]);

  // Sync filter values with external initialFilters
  // Use ref to avoid circular dependency that causes infinite loops
  const prevInitialFiltersStringRef = useRef<string>("");

  useEffect(() => {
    // Serialize to check for actual changes
    const currentFiltersString = JSON.stringify(effectiveInitialFilters);

    // Skip if filters haven't actually changed
    if (currentFiltersString === prevInitialFiltersStringRef.current) return;

    prevInitialFiltersStringRef.current = currentFiltersString;

    const newFilterValues: Record<string, string> = {};
    effectiveInitialFilters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== "") {
        const filterDef = availableFilters.find((f) => f.field === filter.field);
        if (filterDef?.type === "date-range") {
          if (filter.operator === "gte") {
            newFilterValues[`${filter.field}_from`] = String(filter.value);
          } else if (filter.operator === "lte") {
            newFilterValues[`${filter.field}_to`] = String(filter.value);
          }
        } else {
          newFilterValues[filter.field] = String(filter.value);
        }
      }
    });

    setFilterValues(newFilterValues);
  }, [effectiveInitialFilters, availableFilters]);

  // Sync sort state with external initialSort
  useEffect(() => {
    if (propInitialSort) {
      const [column, direction] = propInitialSort.split(":");
      setSortState({
        column: column || "",
        direction: (direction === "asc" || direction === "desc" ? direction : null) as SortDirection,
      });
    } else {
      setSortState({ column: "", direction: null });
    }
  }, [propInitialSort]);

  // Build filters from internal filterValues
  const currentFilters = useMemo(() => {
    const filters: FilterConfig[] = [];

    availableFilters.forEach((filterDef) => {
      if (filterDef.type === "date-range") {
        const fromValue = filterValues[`${filterDef.field}_from`];
        const toValue = filterValues[`${filterDef.field}_to`];

        if (fromValue) {
          filters.push({
            field: filterDef.field,
            operator: "gte",
            value: fromValue,
          });
        }

        if (toValue) {
          filters.push({
            field: filterDef.field,
            operator: "lte",
            value: toValue,
          });
        }
      } else {
        const value = filterValues[filterDef.field];
        if (value !== undefined && value !== null && value !== "") {
          filters.push({
            field: filterDef.field,
            operator: filterDef.operator || "eq",
            value: value,
          });
        }
      }
    });

    return filters;
  }, [availableFilters, filterValues]);

  // Use ref to store the latest onFiltersChange callback to avoid re-renders
  const onFiltersChangeRef = useRef(onFiltersChange);
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Use ref to track previous filters to avoid infinite loops
  const prevFiltersRef = useRef<FilterConfig[]>([]);

  // Notify parent when filters change (only if they actually changed)
  useEffect(() => {
    // Deep compare to check if filters actually changed
    const filtersChanged =
      currentFilters.length !== prevFiltersRef.current.length ||
      currentFilters.some((filter, idx) => {
        const prevFilter = prevFiltersRef.current[idx];
        return !prevFilter ||
          filter.field !== prevFilter.field ||
          filter.operator !== prevFilter.operator ||
          filter.value !== prevFilter.value;
      });

    if (filtersChanged && onFiltersChangeRef.current) {
      onFiltersChangeRef.current(currentFilters);
      prevFiltersRef.current = currentFilters;
    }
  }, [currentFilters]);

  // Use external page if provided (server-side), otherwise use internal
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const setCurrentPage = onPageChange || setInternalPage;

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
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase();
      result = result.filter((row) =>
        safeColumns.some((col) => {
          const value = getComparableValue(row, col);
          return value.toLowerCase().includes(searchLower);
        })
      );
    }

    return result;
  }, [safeData, localSearchTerm, safeColumns, getComparableValue, serverSide, disableClientSideFiltering]);

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

    // Update parent state (triggers API call)
    if (onSearchChange) {
      onSearchChange(value);
    }
    setCurrentPage(1);

    // Reset typing flag after a delay to allow external updates to sync
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 300);
  }, [onSearchChange, setCurrentPage]);

  // Handle filter change - memoized to prevent re-renders
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilterValues((prev) => {
      const newValues = { ...prev };
      if (value === "" || value === undefined) {
        delete newValues[field];
      } else {
        newValues[field] = value;
      }
      return newValues;
    });
    setCurrentPage(1);
  }, [setCurrentPage]);

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
    }
    setFilterValues({});
    setCurrentPage(1);
  };

  const hasActiveFilters = currentFilters.length > 0 || localSearchTerm;
  const hasSelectedRows = selected.size > 0;

  const handleBulkAction = (action: BulkAction) => {
    const selectedIds = Array.from(selected);

    if (action.requiresConfirmation) {
      const message = action.confirmationMessage ||
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedIds.length} item(s)?`;
      if (!window.confirm(message)) return;
    }

    action.onClick(selectedIds);
  };

  return (
    <div className={cn("space-y-3 xs:space-y-4", className)}>
      {/* Search and Filters */}
      {(searchable || availableFilters.length > 0) && (
        <div className="space-y-3">
          {/* Search */}
          {searchable && (
            <div className="flex flex-col gap-2 xs:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={localSearchTerm}
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

          {/* Filters Bar */}
          {availableFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filters:</span>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {availableFilters.map((filterDef) => (
                  <div key={filterDef.field} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {filterDef.label}:
                    </label>
                    {filterDef.type === "select" ? (
                      filterDef.isSearchable ? (
                        <SearchableSelect
                          options={filterDef.options || []}
                          value={filterValues[filterDef.field] || ""}
                          onChange={(value) => handleFilterChange(filterDef.field, value || "")}
                          placeholder={`All ${filterDef.label}`}
                          className="min-w-[150px]"
                        />
                      ) : (
                        <select
                          value={filterValues[filterDef.field] || ""}
                          onChange={(e) => handleFilterChange(filterDef.field, e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[120px]"
                        >
                          <option value="">All</option>
                          {filterDef.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )
                    ) : filterDef.type === "date" ? (
                      <div className="relative">
                        <DatePicker
                          selected={filterValues[filterDef.field] ? parseISO(filterValues[filterDef.field]) : null}
                          onChange={(date: Date | null) => {
                            if (date && isValid(date)) {
                              handleFilterChange(filterDef.field, format(date, "yyyy-MM-dd"));
                            } else {
                              handleFilterChange(filterDef.field, "");
                            }
                          }}
                          dateFormat="yyyy-MM-dd"
                          isClearable
                          portalId="root"
                          placeholderText={`Select ${filterDef.label}`}
                          className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    ) : (
                      <div className="relative flex items-center">
                        <DatePicker
                          selectsRange={true}
                          startDate={filterValues[`${filterDef.field}_from`] ? parseISO(filterValues[`${filterDef.field}_from`]) : undefined}
                          endDate={filterValues[`${filterDef.field}_to`] ? parseISO(filterValues[`${filterDef.field}_to`]) : undefined}
                          onChange={(update: [Date | null, Date | null]) => {
                            const [start, end] = update;

                            // Update start date
                            if (start && isValid(start)) {
                              handleFilterChange(`${filterDef.field}_from`, format(start, "yyyy-MM-dd"));
                            } else {
                              handleFilterChange(`${filterDef.field}_from`, "");
                            }

                            // Update end date
                            if (end && isValid(end)) {
                              handleFilterChange(`${filterDef.field}_to`, format(end, "yyyy-MM-dd"));
                            } else {
                              handleFilterChange(`${filterDef.field}_to`, "");
                            }
                          }}
                          isClearable
                          portalId="root"
                          dateFormat="MMM d, yyyy"
                          placeholderText={`Filter by ${filterDef.label.toLowerCase()} range`}
                          className="h-9 w-[220px] rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {Object.keys(filterValues).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 ml-auto text-xs text-muted-foreground hover:text-foreground hover:bg-transparent px-2"
                >
                  <FilterX className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectable && hasSelectedRows && bulkActions.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selected.size} {selected.size === 1 ? "item" : "items"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => handleBulkAction(action)}
                className="gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg  bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
                  const isEven = index % 2 === 0;
                  const customClassName = rowClassName ? rowClassName(row) : "";
                  const stripingClassName = enableRowStriping && isEven ? "bg-muted/30" : "";

                  return (
                    <TableRow
                      key={rowId || index}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        stripingClassName,
                        customClassName,
                        isSelected && "bg-primary/10"
                      )}
                    >
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
        )}

      </div>

      {/* Pagination */}
      {
        showPagination && (
          <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
            <div className="flex items-center gap-4 text-xs xs:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                  className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!onPageSizeChange}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="hidden sm:inline">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, displayTotal)} of{" "}
                  {displayTotal} results
                </span>
                <span className="sm:hidden">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
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
        )
      }

      {/* Results Info */}
      {
        !showPagination && (
          <div className="text-xs xs:text-sm text-muted-foreground text-center">
            Showing {displayTotal} result{displayTotal !== 1 ? "s" : ""}
          </div>
        )
      }

      {/* Selection Info */}
      {
        selectable && selected.size > 0 && (
          <div className="text-xs text-muted-foreground border-t border-zinc-200 pt-3">
            {selected.size} row{selected.size !== 1 ? "s" : ""} selected
          </div>
        )
      }
    </div >
  );
}