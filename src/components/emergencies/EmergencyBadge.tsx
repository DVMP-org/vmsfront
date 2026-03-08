import { EmergencySeverity, EmergencyStatus, EmergencyType } from "@/types";
import { cn } from "@/lib/utils";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<EmergencyStatus, string> = {
    active: "bg-red-100 text-red-800 border-red-200",
    acknowledged: "bg-yellow-100 text-yellow-800 border-yellow-200",
    resolved: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<EmergencyStatus, string> = {
    active: "Active",
    acknowledged: "Acknowledged",
    resolved: "Resolved",
};

export function EmergencyStatusBadge({ status }: { status: string }) {
    const s = status as EmergencyStatus;
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                STATUS_STYLES[s] ?? "bg-gray-100 text-gray-700 border-gray-200"
            )}
        >
            {STATUS_LABELS[s] ?? status}
        </span>
    );
}

// ── Severity badge ────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<EmergencySeverity, string> = {
    low: "bg-blue-50 text-blue-700 border-blue-200",
    medium: "bg-orange-50 text-orange-700 border-orange-200",
    high: "bg-red-50 text-red-700 border-red-200",
    critical: "bg-red-600 text-white border-red-700",
};

const SEVERITY_LABELS: Record<EmergencySeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "🔴 Critical",
};

export function EmergencySeverityBadge({ severity }: { severity: string }) {
    const s = severity as EmergencySeverity;
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                SEVERITY_STYLES[s] ?? "bg-gray-100 text-gray-700 border-gray-200"
            )}
        >
            {SEVERITY_LABELS[s] ?? severity}
        </span>
    );
}

// ── Type label ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<EmergencyType, string> = {
    fire: "🔥 Fire",
    medical: "🏥 Medical",
    security: "🚨 Security",
    natural_disaster: "🌪 Natural Disaster",
    other: "⚠️ Other",
};

export function EmergencyTypeLabel({ type }: { type: string }) {
    const t = type as EmergencyType;
    return <span className="font-medium">{TYPE_LABELS[t] ?? type}</span>;
}
