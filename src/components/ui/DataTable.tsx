"use client";

import {
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";
import { Input } from "./Input";
import { useConfirmAction } from "./useConfirmAction";
import { Button } from "./Button";
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
  Columns3,
  Inbox,
  RefreshCw,
  Rows3,
  SearchX,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { isValid } from "date-fns/isValid";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "./SearchableSelect";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  /** Hide column at this breakpoint and below: 'sm' = <640px, 'md' = <768px, 'lg' = <1024px */
  responsiveHide?: "sm" | "md" | "lg" | "xl";
  /** Minimum width for this column (prevents squishing) */
  minWidth?: number;
  /** Keep utility/action columns out of the generated mobile summary. */
  mobileHide?: boolean;
  /** Start hidden in the column chooser; users can opt back in. */
  hiddenByDefault?: boolean;
}

export interface FilterConfig {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in"
    | "not_in";
  value: string | number | boolean | string[];
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
  disableClientSideFiltering?: boolean;
  disableClientSideSorting?: boolean;
  // Bulk actions
  bulkActions?: BulkAction[];
  isLoading?: boolean | null;
  /** Optional mobile representation. When provided, the desktop table becomes a labelled row-summary list below md. */
  mobileSummary?: (row: T) => ReactNode;
  /** Accessible name for the desktop comparison region. */
  tableLabel?: string;
  scrollHint?: string;
  /** Existing data can remain visible while a failed refresh is retried. */
  isStale?: boolean;
  staleMessage?: string;
  onRetry?: () => void;
  /** Error copy for a failed collection load. Data may still be visible when stale. */
  errorMessage?: string | null;
  // Row styling
  rowClassName?: (row: T) => string;
  enableRowStriping?: boolean;
  /** Show the shared columns and density controls. */
  enableViewControls?: boolean;
  /**
   * Optional tree rendering. `data` must already be in depth-first tree order.
   * Descendants of collapsed rows are hidden; a search or a filter keeps its
   * matches together with the ancestor rows that give them context, so a match
   * is never lost behind a collapsed parent. Client-side sorting is skipped
   * while a hierarchy is supplied, because reordering would break the tree.
   */
  hierarchy?: {
    parentId: (row: T) => string | null | undefined;
    isExpanded: (id: string) => boolean;
  };
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
  disableClientSideFiltering = false,
  disableClientSideSorting = false,
  bulkActions = [],
  isLoading = false,
  mobileSummary,
  tableLabel = "Data table",
  scrollHint,
  isStale = false,
  staleMessage = "Showing the last available data.",
  onRetry,
  errorMessage = null,
  rowClassName,
  enableRowStriping = false,
  enableViewControls = true,
  hierarchy,
}: DataTableProps<T>) {
  // Validate and normalize inputs to prevent runtime errors
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns],
  );

  // Use new props if provided, fall back to legacy props for backward compatibility
  const effectiveInitialSearch = propInitialSearch || "";
  const effectiveInitialFilters = propInitialFilters;
  const initialVisibleColumnKeys = useMemo(
    () =>
      safeColumns
        .filter((column) => !column.hiddenByDefault)
        .map((column) => column.key),
    [safeColumns],
  );

  // Internal state for search
  const [localSearchTerm, setLocalSearchTerm] = useState(
    effectiveInitialSearch,
  );
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const columnPickerRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!enableViewControls) return;
    const dismissColumnPicker = (event: PointerEvent) => {
      const picker = columnPickerRef.current;
      if (picker?.open && !picker.contains(event.target as Node)) {
        picker.open = false;
      }
    };
    document.addEventListener("pointerdown", dismissColumnPicker);
    return () =>
      document.removeEventListener("pointerdown", dismissColumnPicker);
  }, [enableViewControls]);

  const isUserTypingRef = useRef(false);
  const lastLocalValueRef = useRef(effectiveInitialSearch);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    () => new Set(initialVisibleColumnKeys),
  );
  const [density, setDensity] = useState<"compact" | "comfortable">(
    "comfortable",
  );

  // Internal state for filters - map field to value
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      effectiveInitialFilters.forEach((filter) => {
        if (
          filter.value !== undefined &&
          filter.value !== null &&
          filter.value !== ""
        ) {
          const filterDef = availableFilters.find(
            (f) => f.field === filter.field,
          );
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
    },
  );

  // Internal state for sort
  const [sortState, setSortState] = useState<SortState>(() => {
    if (propInitialSort) {
      const [column, direction] = propInitialSort.split(":");
      return {
        column: column || "",
        direction: (direction === "asc" || direction === "desc"
          ? direction
          : null) as SortDirection,
      };
    }
    return { column: "", direction: null };
  });

  const [internalPage, setInternalPage] = useState(1);

  // Sync local search with external initialSearch
  useEffect(() => {
    if (
      effectiveInitialSearch !== undefined &&
      effectiveInitialSearch !== lastLocalValueRef.current &&
      !isUserTypingRef.current
    ) {
      setLocalSearchTerm(effectiveInitialSearch);
      lastLocalValueRef.current = effectiveInitialSearch;
    }
  }, [effectiveInitialSearch]);

  useEffect(() => {
    setVisibleColumnKeys((current) => {
      const next = new Set(
        Array.from(current).filter((key) =>
          safeColumns.some((column) => column.key === key),
        ),
      );
      initialVisibleColumnKeys.forEach((key) => {
        if (!safeColumns.some((column) => column.key === key)) return;
        const wasPresent = current.has(key);
        if (wasPresent || current.size === 0) next.add(key);
      });
      return next;
    });
  }, [initialVisibleColumnKeys, safeColumns]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    },
    [],
  );

  const visibleColumns = useMemo(
    () => safeColumns.filter((column) => visibleColumnKeys.has(column.key)),
    [safeColumns, visibleColumnKeys],
  );

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
      if (
        filter.value !== undefined &&
        filter.value !== null &&
        filter.value !== ""
      ) {
        const filterDef = availableFilters.find(
          (f) => f.field === filter.field,
        );
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
        direction: (direction === "asc" || direction === "desc"
          ? direction
          : null) as SortDirection,
      });
    } else {
      setSortState({ column: "", direction: null });
    }
  }, [propInitialSort]);

  // Build filters from internal filterValues
  const currentFilters = useMemo(() => {
    // Keep mandatory server scope filters even when they have no editable control.
    const filters: FilterConfig[] = effectiveInitialFilters.filter(
      (filter) => !availableFilters.some((definition) => definition.field === filter.field),
    );

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
  }, [availableFilters, filterValues, effectiveInitialFilters]);

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
        return (
          !prevFilter ||
          filter.field !== prevFilter.field ||
          filter.operator !== prevFilter.operator ||
          filter.value !== prevFilter.value
        );
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
  const [internalSelected, setInternalSelected] = useState<Set<string>>(
    new Set(),
  );
  const selected = selectedRows !== undefined ? selectedRows : internalSelected;
  const setSelected = onSelectionChange || setInternalSelected;

  const getComparableValue = useCallback(
    (row: T, column: Column<T>): string => {
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
    },
    [],
  );

  // Filter data (only for client-side filtering)
  const filteredData = useMemo(() => {
    if (serverSide || disableClientSideFiltering) {
      // Server-side: return data as-is, filtering is done on server
      return safeData;
    }

    let result = [...safeData];

    for (const filter of currentFilters) {
      result = result.filter((row) => {
        const value = row[filter.field];
        if (filter.operator === "eq")
          return String(value) === String(filter.value);
        if (filter.operator === "ne")
          return String(value) !== String(filter.value);
        if (filter.operator === "in") {
          return Array.isArray(filter.value)
            ? filter.value.map(String).includes(String(value))
            : false;
        }
        if (filter.operator === "not_in") {
          return Array.isArray(filter.value)
            ? !filter.value.map(String).includes(String(value))
            : true;
        }
        if (filter.operator === "like" || filter.operator === "ilike") {
          return String(value ?? "")
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        }
        const numericValue = Number(value);
        const numericFilter = Number(filter.value);
        const comparableValue =
          Number.isFinite(numericValue) && Number.isFinite(numericFilter)
            ? numericValue
            : String(value ?? "");
        const comparableFilter =
          Number.isFinite(numericValue) && Number.isFinite(numericFilter)
            ? numericFilter
            : String(filter.value);
        if (filter.operator === "gt") return comparableValue > comparableFilter;
        if (filter.operator === "gte")
          return comparableValue >= comparableFilter;
        if (filter.operator === "lt") return comparableValue < comparableFilter;
        if (filter.operator === "lte")
          return comparableValue <= comparableFilter;
        return true;
      });
    }

    // Apply search
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase();
      result = result.filter((row) =>
        safeColumns.some((col) => {
          const value = getComparableValue(row, col);
          return value.toLowerCase().includes(searchLower);
        }),
      );
    }

    if (hierarchy) {
      const byId = new Map<string, T>();
      safeData.forEach((row) => byId.set(getRowId(row), row));
      const matched = new Set(result.map((row) => getRowId(row)));
      const isNarrowed = Boolean(localSearchTerm) || currentFilters.length > 0;

      if (isNarrowed) {
        // Keep every match reachable: a match with a collapsed parent brings
        // its ancestors along so the row still reads in context.
        const keep = new Set(matched);
        matched.forEach((id) => {
          let parent = hierarchy.parentId(byId.get(id)!);
          while (parent && byId.has(parent) && !keep.has(parent)) {
            keep.add(parent);
            const parentRow = byId.get(parent);
            parent = parentRow ? hierarchy.parentId(parentRow) : null;
          }
        });
        result = safeData.filter((row) => keep.has(getRowId(row)));
      } else {
        result = safeData.filter((row) => {
          if (!matched.has(getRowId(row))) return false;
          let parent = hierarchy.parentId(row);
          while (parent && byId.has(parent)) {
            if (!hierarchy.isExpanded(parent)) return false;
            const parentRow = byId.get(parent);
            parent = parentRow ? hierarchy.parentId(parentRow) : null;
          }
          return true;
        });
      }
    }

    return result;
  }, [
    safeData,
    currentFilters,
    localSearchTerm,
    safeColumns,
    getComparableValue,
    serverSide,
    disableClientSideFiltering,
    hierarchy,
    getRowId,
  ]);

  // Sort data
  const sortedData = useMemo(() => {
    if (disableClientSideSorting || hierarchy) {
    // Server-side sorting, or a tree that must keep its depth-first order.
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
  }, [
    filteredData,
    sortState,
    safeColumns,
    getComparableValue,
    disableClientSideSorting,
    hierarchy,
  ]);

  // Paginate data (only for client-side pagination)
  const paginatedData = useMemo(() => {
    if (serverSide || !showPagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination, serverSide]);

  const totalPages =
    serverSide && total !== undefined
      ? Math.ceil(total / pageSize)
      : Math.ceil(sortedData.length / pageSize);
  const displayTotal =
    serverSide && total !== undefined ? total : sortedData.length;

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
  const handleSearchChange = useCallback(
    (value: string) => {
      isUserTypingRef.current = true;
      setLocalSearchTerm(value);
      lastLocalValueRef.current = value;
      if (onSearchChange) {
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
          onSearchChange(value);
        }, 300);
      }
      setCurrentPage(1);
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 350);
    },
    [onSearchChange, setCurrentPage],
  );

  // Handle filter change - memoized to prevent re-renders
  const handleFilterChange = useCallback(
    (field: string, value: string) => {
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
    },
    [setCurrentPage],
  );

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

  const allSelected =
    paginatedData.length > 0 && selected.size === paginatedData.length;
  const someSelected =
    selected.size > 0 && selected.size < paginatedData.length;

  // Clear all filters
  const clearAllFilters = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
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

    if (
      action.requiresConfirmation ||
      action.variant === "destructive" ||
      /\b(delete|remove|archive|revoke)\b/i.test(action.label)
    ) {
      confirmAction({
        title: `${action.label}?`,
        description:
          action.confirmationMessage ||
          `Apply “${action.label}” to ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}?`,
        confirmLabel: action.label,
        onConfirm: () => action.onClick(selectedIds),
      });
      return;
    }

    action.onClick(selectedIds);
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumnKeys((current) => {
      const next = new Set(current);
      if (next.has(columnKey)) {
        if (next.size === 1) return current;
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }
      return next;
    });
  };

  const resetVisibleColumns = () => {
    setVisibleColumnKeys(new Set(initialVisibleColumnKeys));
  };

  const renderFilterControl = (filterDef: FilterDefinition) => {
    if (filterDef.type === "select") {
      return filterDef.isSearchable ? (
        <SearchableSelect
          key={filterDef.field}
          options={filterDef.options || []}
          value={filterValues[filterDef.field] || ""}
          onChange={(value) => handleFilterChange(filterDef.field, value || "")}
          placeholder={`All ${filterDef.label}`}
          className="w-full md:w-[180px]"
        />
      ) : (
        <select
          key={filterDef.field}
          aria-label={`Filter by ${filterDef.label}`}
          value={filterValues[filterDef.field] || ""}
          onChange={(event) =>
            handleFilterChange(filterDef.field, event.target.value)
          }
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-[150px]"
        >
          <option value="">All {filterDef.label.toLowerCase()}</option>
          {filterDef.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (filterDef.type === "date") {
      return (
        <div className="relative w-full md:w-[170px]" key={filterDef.field}>
          <DatePicker
            selected={
              filterValues[filterDef.field]
                ? parseISO(filterValues[filterDef.field])
                : null
            }
            onChange={(date: Date | null) => {
              handleFilterChange(
                filterDef.field,
                date && isValid(date) ? format(date, "yyyy-MM-dd") : "",
              );
            }}
            dateFormat="yyyy-MM-dd"
            isClearable
            portalId="root"
            aria-label={`Filter by ${filterDef.label}`}
            placeholderText={filterDef.label}
            className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <CalendarIcon
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      );
    }

    return (
      <div className="relative w-full md:w-[260px]" key={filterDef.field}>
        <DatePicker
          selectsRange
          startDate={
            filterValues[`${filterDef.field}_from`]
              ? parseISO(filterValues[`${filterDef.field}_from`])
              : undefined
          }
          endDate={
            filterValues[`${filterDef.field}_to`]
              ? parseISO(filterValues[`${filterDef.field}_to`])
              : undefined
          }
          onChange={(update: [Date | null, Date | null]) => {
            const [start, end] = update;
            handleFilterChange(
              `${filterDef.field}_from`,
              start && isValid(start) ? format(start, "yyyy-MM-dd") : "",
            );
            handleFilterChange(
              `${filterDef.field}_to`,
              end && isValid(end) ? format(end, "yyyy-MM-dd") : "",
            );
          }}
          isClearable
          portalId="root"
          aria-label={`Filter by ${filterDef.label} range`}
          dateFormat="MMM d, yyyy"
          placeholderText={filterDef.label}
          className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <CalendarIcon
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  };

  const generatedMobileSummary = (row: T) => {
    const summaryColumns = visibleColumns
      .filter((column) => !column.mobileHide)
      .slice(0, 4);

    return (
      <dl className="grid gap-3">
        {summaryColumns.map((column) => (
          <div
            key={column.key}
            className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {column.header}
            </dt>
            <dd className="min-w-0 text-sm text-foreground">
              {column.accessor
                ? column.accessor(row)
                : String(row[column.key] ?? "—")}
            </dd>
          </div>
        ))}
      </dl>
    );
  };

  return (
    <div className={cn("space-y-3 xs:space-y-4", className)}>
      {confirmationDialog}
      {(searchable || availableFilters.length > 0 || enableViewControls) && (
        <div className="m-2 flex flex-wrap items-center gap-2 p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {searchable ? (
            <div className="relative min-w-[13rem] flex-1 sm:max-w-[22rem]">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={searchInputRef}
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={localSearchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          ) : null}

          {availableFilters.length > 0 ? (
            <>
              <div className="hidden flex-wrap items-center gap-2 md:flex">
                {availableFilters.map(renderFilterControl)}
              </div>
              <details className="relative md:hidden">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters
                  {currentFilters.length ? (
                    <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background">
                      {currentFilters.length}
                    </span>
                  ) : null}
                </summary>
                <div className="absolute left-0 z-30 mt-2 grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-md border border-border bg-card p-3 shadow-xl">
                  {availableFilters.map(renderFilterControl)}
                </div>
              </details>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="hidden whitespace-nowrap px-1 text-xs text-muted-foreground sm:inline"
              aria-live="polite"
            >
              {displayTotal} result{displayTotal === 1 ? "" : "s"}
            </span>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 gap-1.5 px-2"
              >
                <FilterX className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Clear</span>
              </Button>
            ) : null}
            {enableViewControls ? (
              <>
                <details
                  ref={columnPickerRef}
                  className="relative"
                  onKeyDown={(event) => {
                    if (event.key !== "Escape" || !event.currentTarget.open)
                      return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.open = false;
                    event.currentTarget.querySelector("summary")?.focus();
                  }}
                >
                  <summary
                    aria-label="Choose visible columns"
                    className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs font-medium [&::-webkit-details-marker]:hidden"
                  >
                    <Columns3 className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Columns</span>
                  </summary>
                  <fieldset className="absolute right-0 z-30 mt-2 w-60 rounded-md border border-border bg-card p-3 shadow-xl">
                    <legend className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Visible columns
                    </legend>
                    <div className="grid max-h-64 gap-1 overflow-y-auto">
                      {safeColumns.map((column) => (
                        <label
                          key={column.key}
                          className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-1.5 text-sm hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumnKeys.has(column.key)}
                            onChange={() => toggleColumn(column.key)}
                            className="h-4 w-4 rounded border-input"
                          />
                          {column.header}
                        </label>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetVisibleColumns}
                      className="mt-2 h-8 w-full justify-start px-2 text-xs"
                    >
                      Reset columns
                    </Button>
                  </fieldset>
                </details>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDensity((current) =>
                      current === "comfortable" ? "compact" : "comfortable",
                    )
                  }
                  className="h-9 w-9 p-0"
                  aria-label={
                    density === "comfortable"
                      ? "Use compact row density"
                      : "Use comfortable row density"
                  }
                  title={
                    density === "comfortable"
                      ? "Compact density"
                      : "Comfortable density"
                  }
                >
                  <Rows3 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectable && hasSelectedRows && bulkActions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-md bg-foreground px-3 py-2.5 text-background sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium sm:text-sm" aria-live="polite">
              {selected.size} {selected.size === 1 ? "item" : "items"} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => handleBulkAction(action)}
                aria-label={action.label}
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs sm:text-sm",
                  action.variant === "destructive"
                    ? "border-red-300/40 bg-transparent text-red-100 hover:bg-red-400/15 hover:text-white"
                    : "border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white",
                )}
              >
                {action.icon && (
                  <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="hidden xs:inline">{action.label}</span>
                <span className="xs:hidden">{action.label.split(" ")[0]}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="h-8 gap-1.5 px-2 text-background hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Clear</span>
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="m-2 rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          <div
            className="space-y-px bg-border"
            role="status"
            aria-label="Loading collection"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[2rem_minmax(0,2fr)_minmax(0,1fr)_6rem] items-center gap-3 bg-card px-4 py-3"
              >
                <span className="h-4 w-4 animate-pulse rounded bg-muted" />
                <span className="h-4 max-w-64 animate-pulse rounded bg-muted" />
                <span className="h-4 max-w-36 animate-pulse rounded bg-muted" />
                <span className="h-6 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            {errorMessage ? (
              <div
                className="mb-3 flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <span className="flex items-center gap-2">
                  <TriangleAlert
                    className="h-4 w-4 flex-none"
                    aria-hidden="true"
                  />
                  {errorMessage}
                </span>
                {onRetry ? (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}
            {isStale ? (
              <div
                className="mb-3 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
                role="status"
              >
                <span className="flex items-center gap-2">
                  <TriangleAlert
                    className="h-4 w-4 flex-none"
                    aria-hidden="true"
                  />
                  {staleMessage}
                </span>
                {onRetry ? (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}
            {/* Horizontal scroll container with shadow indicators */}
            <div className="hidden md:block">
              <Table
                aria-label={tableLabel}
                className="min-w-full text-xs sm:text-sm"
                scrollLabel={tableLabel}
                scrollHint={scrollHint}
              >
                <TableHeader>
                  <TableRow>
                    {selectable && (
                      <TableHead className="w-12">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center justify-center p-1 hover:bg-muted rounded transition-colors"
                          aria-label={
                            allSelected ? "Deselect all" : "Select all"
                          }
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
                    {visibleColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          column.className,
                          column.responsiveHide === "sm" &&
                            "hidden sm:table-cell",
                          column.responsiveHide === "md" &&
                            "hidden md:table-cell",
                          column.responsiveHide === "lg" &&
                            "hidden lg:table-cell",
                          column.responsiveHide === "xl" &&
                            "hidden xl:table-cell",
                        )}
                        style={
                          column.minWidth
                            ? { minWidth: column.minWidth }
                            : undefined
                        }
                        aria-sort={
                          sortState.column === column.key && sortState.direction
                            ? sortState.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : column.sortable
                              ? "none"
                              : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="whitespace-nowrap">
                            {column.header}
                          </span>
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
                        colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                        className="h-24 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                          {hasActiveFilters ? (
                            <SearchX
                              className="h-6 w-6 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <Inbox
                              className="h-6 w-6 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                          <p className="font-medium text-foreground">
                            {emptyMessage}
                          </p>
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
                      const customClassName = rowClassName
                        ? rowClassName(row)
                        : "";
                      const stripingClassName =
                        enableRowStriping && isEven ? "bg-muted/30" : "";

                      return (
                        <TableRow
                          key={rowId || index}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            stripingClassName,
                            customClassName,
                            isSelected && "bg-primary/10",
                          )}
                        >
                          {selectable && (
                            <TableCell>
                              <button
                                onClick={() => toggleRowSelection(rowId)}
                                className="flex items-center justify-center p-1 hover:bg-muted rounded transition-colors"
                                aria-label={
                                  isSelected ? "Deselect row" : "Select row"
                                }
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </TableCell>
                          )}
                          {visibleColumns.map((column) => (
                            <TableCell
                              key={column.key}
                              className={cn(
                                column.className,
                                density === "compact" && "py-1.5",
                                column.responsiveHide === "sm" &&
                                  "hidden sm:table-cell",
                                column.responsiveHide === "md" &&
                                  "hidden md:table-cell",
                                column.responsiveHide === "lg" &&
                                  "hidden lg:table-cell",
                                column.responsiveHide === "xl" &&
                                  "hidden xl:table-cell",
                              )}
                              style={
                                column.minWidth
                                  ? { minWidth: column.minWidth }
                                  : undefined
                              }
                            >
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
            </div>
            <ul
              className="divide-y divide-border rounded-lg border border-border md:hidden"
              aria-label={`${tableLabel} row summaries`}
            >
              {paginatedData.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  <p>{emptyMessage}</p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="mt-3"
                    >
                      Clear filters to see all results
                    </Button>
                  ) : null}
                </li>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = getRowId(row);
                  return (
                    <li
                      key={rowId || index}
                      className={cn(
                        "px-4 py-4",
                        selected.has(rowId) && "bg-accent/20",
                      )}
                    >
                      {selectable ? (
                        <label className="mb-3 flex min-h-11 items-center gap-2 text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={selected.has(rowId)}
                            onChange={() => toggleRowSelection(rowId)}
                            className="h-5 w-5 rounded border-input"
                          />
                          Select row
                        </label>
                      ) : null}
                      {(mobileSummary || generatedMobileSummary)(row)}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="m-2 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
          <div className="flex items-center gap-4 text-xs xs:text-sm text-muted-foreground">
            <div className="px-2 flex items-center gap-2">
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
                Showing{" "}
                {displayTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, displayTotal)} of{" "}
                {displayTotal} results
              </span>
              <span className="sm:hidden">
                Page {displayTotal === 0 ? 0 : currentPage} of {totalPages}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1">
            {/* First/Prev - hidden on very small screens */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="hidden xs:flex h-8 sm:h-9 w-8 sm:w-9 p-0"
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>

            {/* Page numbers - show fewer on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from(
                {
                  length: Math.min(
                    typeof window !== "undefined" && window.innerWidth < 480
                      ? 3
                      : 5,
                    totalPages,
                  ),
                },
                (_, i) => {
                  const maxPages =
                    typeof window !== "undefined" && window.innerWidth < 480
                      ? 3
                      : 5;
                  let pageNum: number;
                  if (totalPages <= maxPages) {
                    pageNum = i + 1;
                  } else if (currentPage <= Math.ceil(maxPages / 2)) {
                    pageNum = i + 1;
                  } else if (
                    currentPage >=
                    totalPages - Math.floor(maxPages / 2)
                  ) {
                    pageNum = totalPages - maxPages + 1 + i;
                  } else {
                    pageNum = currentPage - Math.floor(maxPages / 2) + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[1.75rem] sm:min-w-[2.25rem] h-8 sm:h-9 text-xs px-1.5 sm:px-2"
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>
            {/* Last - hidden on very small screens */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden xs:flex h-8 sm:h-9 w-8 sm:w-9 p-0"
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
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
