import { type ClassValue, clsx } from "clsx";
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

export function isPassValid(validFrom: string, validTo: string): boolean {
  const now = new Date();
  const from = new Date(validFrom);
  const to = new Date(validTo);
  return now >= from && now <= to;
}

export function getPassStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "text-green-600 bg-green-50";
    case "expired":
      return "text-red-600 bg-red-50";
    case "revoked":
      return "text-gray-600 bg-gray-50";
    case "draft":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

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

  // Convert to title case
  return v
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
