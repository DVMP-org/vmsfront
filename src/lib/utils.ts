import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}



export const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
};

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "U";
}

export function getFullName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown User";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function isPassValid(validFrom: string, validTo: string): boolean {
  const now = new Date();
  const from = new Date(validFrom);
  const to = new Date(validTo);
  return now >= from && now <= to;
}

export function getPassStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "text-blue-600 bg-blue-50 border border-blue-600";
    case "expired":
      return "text-red-600 bg-red-50 border border-red-600";
    case "revoked":
      return "text-slate-600 bg-slate-50 border border-slate-600";
    case "checked_in":
      return "text-green-600 bg-green-50 border border-green-600";
    case "checked_out":
      return "text-white bg-orange-500 border border-orange-500";
    case "pending":
      return "text-amber-600 bg-amber-50 border border-amber-600";
    default:
      return "text-gray-600 bg-gray-50 border border-gray-600";
  }
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case "success":
      return "border-green-500/50 text-green-600";
    case "failed":
      return "border-red-500/50 text-red-600";
    case "pending":
      return "border-amber-500/50 text-amber-600";
    default:
      return "border-border text-muted-foreground";
  }
};

export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

/**
 * Converts a string into title case, handling extra spaces and punctuation.
 *
 * @param {string} v - The input string.
 * @returns {string} - The title-cased string, or an empty string if input is falsy.
 */
export function titleCase(v) {
  if (!v) return "";

  // Normalize whitespace and lowercase first
  v = v.trim().replace(/\s+/g, " ").toLowerCase();
  v = v.replace(/_/g, " ").replace(/-/g, " ");
  // Convert to title case
  return v
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Converts a snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case
 * Handles acronyms correctly (e.g., defaultStreamFps -> default_stream_fps)
 */
export function toSnakeCase(str: string): string {
  // Handle consecutive uppercase letters (acronyms) as a single unit
  // First, insert underscore before uppercase letters that follow lowercase or other uppercase
  return str
    // Insert underscore before uppercase letters that follow lowercase letters
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    // Insert underscore before uppercase letters that follow other uppercase letters (acronyms)
    // but only if followed by lowercase (to avoid splitting acronyms)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Recursively converts object keys from snake_case to camelCase
 */
export function keysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item)) as T;
  }

  if (typeof obj === 'object') {
    const camelCaseObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        camelCaseObj[camelKey] = keysToCamelCase(obj[key]);
      }
    }
    return camelCaseObj as T;
  }

  return obj;
}

/**
 * Recursively converts object keys from camelCase to snake_case
 */
export function keysToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnakeCase(item)) as T;
  }

  if (typeof obj === 'object') {
    const snakeCaseObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = toSnakeCase(key);
        snakeCaseObj[snakeKey] = keysToSnakeCase(obj[key]);
      }
    }
    return snakeCaseObj as T;
  }

  return obj;
}


export function getTimeRemaining(validTo?: string | null): string | null {
  if (!validTo) return null;
  const target = new Date(validTo);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  // Show countdown for all future passes
  if (target > now) {
    return `Expires ${formatDistanceToNow(target, { addSuffix: true })}`;
  }
  return null;
}

export function formatPassWindow(
  validFrom?: string | null,
  validTo?: string | null
): string {
  const from = safeFormatDateTime(validFrom);
  const to = safeFormatDateTime(validTo);

  if (!from && !to) {
    return "No time limit";
  }

  if (from && to) {
    return `${from} – ${to}`;
  }

  if (from) {
    return `Starts ${from}`;
  }

  return `Ends ${to}`;
}

export function safeFormatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateTime(parsed);
}
