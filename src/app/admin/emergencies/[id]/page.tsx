"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useAdminEmergency,
    useAcknowledgeEmergency,
    useResolveEmergency,
} from "@/hooks/use-emergency";
import {
    EmergencyStatusBadge,
    EmergencySeverityBadge,
    EmergencyTypeLabel,
} from "@/components/emergencies/EmergencyBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    MapPin,
    User,
    Building,
    XCircle,
} from "lucide-react";
import { format } from "date-fns";

function Detail({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
        </div>
    );
}

export default function AdminEmergencyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: emergency, isLoading } = useAdminEmergency(id);
    const acknowledge = useAcknowledgeEmergency();
    const resolve = useResolveEmergency();

    if (isLoading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!emergency) {
        return (
            <div className="p-6 text-center text-gray-500">Emergency not found.</div>
        );
    }

    const triggeredName = emergency.triggered_by
        ? `${emergency.triggered_by.first_name ?? ""} ${emergency.triggered_by.last_name ?? ""}`.trim() ||
        emergency.triggered_by.email
        : "Unknown";

    const acknowledgedName = emergency.acknowledged_by?.user
        ? `${emergency.acknowledged_by.user.first_name ?? ""} ${emergency.acknowledged_by.user.last_name ?? ""}`.trim() ||
        emergency.acknowledged_by.user.email
        : null;

    const resolvedName = emergency.resolved_by?.user
        ? `${emergency.resolved_by.user.first_name ?? ""} ${emergency.resolved_by.user.last_name ?? ""}`.trim() ||
        emergency.resolved_by.user.email
        : null;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to emergencies
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Emergency Detail
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <EmergencyTypeLabel type={emergency.type} />
                        <EmergencyStatusBadge status={emergency.status} />
                        <EmergencySeverityBadge severity={emergency.severity} />
                    </div>
                </div>

                {emergency.status !== "resolved" && (
                    <div className="flex gap-2">
                        {emergency.status === "active" && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={acknowledge.isPending}
                                onClick={() => acknowledge.mutate(emergency.id)}
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Acknowledge
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={resolve.isPending}
                            onClick={() => resolve.mutate(emergency.id)}
                        >
                            <XCircle className="w-4 h-4 mr-1" />
                            Resolve
                        </Button>
                    </div>
                )}
            </div>

            {/* Details card */}
            <Card>
                <CardContent className="p-5">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Detail label="Description" value={emergency.description} />
                        <Detail label="Location" value={emergency.location} />
                        <Detail label="Triggered By" value={triggeredName} />
                        <Detail
                            label="Residency"
                            value={emergency.residency?.name ?? "Community-wide"}
                        />
                        <Detail
                            label="Triggered At"
                            value={format(new Date(emergency.created_at), "PPpp")}
                        />
                        {emergency.acknowledged_at && (
                            <Detail
                                label="Acknowledged At"
                                value={`${format(new Date(emergency.acknowledged_at), "PPpp")}${acknowledgedName ? ` by ${acknowledgedName}` : ""}`}
                            />
                        )}
                        {emergency.resolved_at && (
                            <Detail
                                label="Resolved At"
                                value={`${format(new Date(emergency.resolved_at), "PPpp")}${resolvedName ? ` by ${resolvedName}` : ""}`}
                            />
                        )}
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}
