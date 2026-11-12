import { formatDate } from "@/lib/datetime";

import type { Contractor, ContractorStatus } from "./api";

const STATUS_LABELS: Record<ContractorStatus, string> = {
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
  expired: "Window ended",
  revoked: "Revoked",
};

export function contractorStatusLabel(status: ContractorStatus) {
  return STATUS_LABELS[status] ?? status;
}

export type ContractorTone = "success" | "warning" | "danger" | "neutral";

export function contractorStatusTone(status: ContractorStatus): ContractorTone {
  switch (status) {
    case "active":
      return "success";
    case "invited":
      return "warning";
    case "expired":
      return "neutral";
    case "suspended":
      return "warning";
    case "revoked":
      return "danger";
    default:
      return "neutral";
  }
}

/** `11 Nov 2026 – 25 Nov 2026`, collapsing a same-day window. */
export function contractorWindow(contractor: Contractor): string {
  const start = formatDate(contractor.access_from);
  const end = formatDate(contractor.access_to);
  const sameDay =
    new Date(contractor.access_from).toDateString() ===
    new Date(contractor.access_to).toDateString();
  return sameDay ? start : `${start} – ${end}`;
}

export type PermitState = "not_required" | "missing" | "expired" | "valid";

export function contractorPermitState(contractor: Contractor): PermitState {
  if (!contractor.requires_permit) return "not_required";
  if (!contractor.permit_reference || !contractor.permit_expires_at) {
    return "missing";
  }
  return new Date(contractor.permit_expires_at).getTime() < Date.now()
    ? "expired"
    : "valid";
}

export function contractorPermitSummary(contractor: Contractor): string {
  switch (contractorPermitState(contractor)) {
    case "not_required":
      return "No permit required";
    case "missing":
      return "Permit details missing";
    case "expired":
      return `Permit expired ${formatDate(contractor.permit_expires_at)}`;
    case "valid":
      return `${contractor.permit_reference} · to ${formatDate(
        contractor.permit_expires_at,
      )}`;
  }
}

/** Contractors whose window ends inside a week, or whose permit is expiring. */
export function contractorNeedsAttention(contractor: Contractor): boolean {
  const state = contractorPermitState(contractor);
  if (state === "missing" || state === "expired") return true;
  const end = new Date(contractor.access_to).getTime();
  return contractor.status !== "revoked" && end - Date.now() < 7 * 86_400_000;
}

export function contractorMeta(contractor: Contractor): string {
  return [contractor.company_name, contractor.purpose]
    .filter(Boolean)
    .join(" · ");
}
