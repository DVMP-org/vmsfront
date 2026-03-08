"use client";

import { Emergency } from "@/types";
import { EmergencyStatusBadge, EmergencySeverityBadge, EmergencyTypeLabel } from "./EmergencyBadge";
import { formatDistanceToNow } from "date-fns";
import { MapPin, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAcknowledgeEmergency, useResolveEmergency } from "@/hooks/use-emergency";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface EmergencyCardProps {
    emergency: Emergency;
    showActions?: boolean;
}

export function EmergencyCard({ emergency, showActions = true }: EmergencyCardProps) {
    const router = useRouter();
    const acknowledge = useAcknowledgeEmergency();
    const resolve = useResolveEmergency();

    const triggeredName = emergency.triggered_by
        ? `${emergency.triggered_by.first_name ?? ""} ${emergency.triggered_by.last_name ?? ""}`.trim() ||
        emergency.triggered_by.email
        : "Unknown";

    return (
        <div
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/admin/emergencies/${emergency.id}`)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <EmergencyTypeLabel type={emergency.type} />
                        <EmergencyStatusBadge status={emergency.status} />
                        <EmergencySeverityBadge severity={emergency.severity} />
                    </div>

                    {emergency.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {emergency.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {triggeredName}
                        </span>
                        {emergency.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {emergency.location}
                            </span>
                        )}
                        {emergency.residency && (
                            <span className="text-gray-400">
                                {emergency.residency.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(emergency.created_at), {
                                addSuffix: true,
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {showActions && emergency.status !== "resolved" && (
                <div
                    className="flex gap-2 mt-3 pt-3 border-t"
                    onClick={(e) => e.stopPropagation()}
                >
                    {emergency.status === "active" && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={acknowledge.isPending}
                            onClick={() => acknowledge.mutate(emergency.id)}
                        >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acknowledge
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-300 hover:bg-green-50"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate(emergency.id)}
                    >
                        <XCircle className="w-4 h-4 mr-1" />
                        Resolve
                    </Button>
                </div>
            )}
        </div>
    );
}
