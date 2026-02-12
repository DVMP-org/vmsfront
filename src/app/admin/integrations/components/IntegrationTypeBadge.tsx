"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import {
    IntegrationType,
    IntegrationCapability,
    INTEGRATION_TYPE_LABELS,
    INTEGRATION_CAPABILITY_LABELS,
} from "@/types/integration";
import {
    MessageSquare,
    CreditCard,
    Shield,
    BarChart3,
    Bell,
    HardDrive,
    UserCheck,
    Puzzle,
} from "lucide-react";

interface IntegrationTypeBadgeProps {
    type: IntegrationType;
    showIcon?: boolean;
}

const TYPE_ICONS: Record<IntegrationType, React.ElementType> = {
    messaging: MessageSquare,
    payment: CreditCard,
    access_control: Shield,
    analytics: BarChart3,
    notification: Bell,
    storage: HardDrive,
    identity: UserCheck,
    other: Puzzle,
};

export function IntegrationTypeBadge({
    type,
    showIcon = true,
}: IntegrationTypeBadgeProps) {
    const Icon = TYPE_ICONS[type] || Puzzle;
    const label = INTEGRATION_TYPE_LABELS[type] || "Other";

    return (
        <Badge variant="secondary" className="gap-1 text-xs">
            {showIcon && <Icon className="h-3 w-3" />}
            {label}
        </Badge>
    );
}

interface IntegrationCapabilityBadgesProps {
    capabilities: IntegrationCapability[];
    maxShow?: number;
}

export function IntegrationCapabilityBadges({
    capabilities,
    maxShow = 3,
}: IntegrationCapabilityBadgesProps) {
    const displayCapabilities = capabilities.slice(0, maxShow);
    const remaining = capabilities.length - maxShow;

    return (
        <div className="flex flex-wrap gap-1">
            {displayCapabilities.map((capability) => (
                <Badge
                    key={capability}
                    variant="outline"
                    className="text-[10px] py-0 px-1.5"
                >
                    {INTEGRATION_CAPABILITY_LABELS[capability] || capability}
                </Badge>
            ))}
            {remaining > 0 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    +{remaining} more
                </Badge>
            )}
        </div>
    );
}
