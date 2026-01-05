import { FilterConfig } from "@/components/ui/DataTable";

/**
 * Format filters array to JSON string for API
 */
export function formatFiltersForAPI(filters: FilterConfig[]): string | undefined {
  if (!filters || filters.length === 0) return undefined;
  
  // Format as JSON string
  return JSON.stringify(filters);
}

/**
 * Format sort state to API format
 * Format: 'field1:asc,field2:desc' or '-field1,field2'
 */
export function formatSortForAPI(column: string, direction: "asc" | "desc" | null): string | undefined {
  if (!column || !direction) return undefined;
  
  return `${column}:${direction}`;
}

