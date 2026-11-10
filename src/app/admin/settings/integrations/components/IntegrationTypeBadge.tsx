"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import {
  IntegrationType,
  IntegrationCapability,
  INTEGRATION_TYPE_LABELS,
  INTEGRATION_CAPABILITY_LABELS,
} from "@/types/integration";
import { cn } from "@/lib/utils";
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

export const INTEGRATION_TYPE_ICONS: Record<IntegrationType, React.ElementType> = {
  messaging: MessageSquare,
  payment: CreditCard,
  access_control: Shield,
  analytics: BarChart3,
  notification: Bell,
  storage: HardDrive,
  identity: UserCheck,
  other: Puzzle,
};

/**
 * Provider-mark tile used by the integrations catalog. Falls back to the
 * category icon when the provider has no logo, so every card keeps a stable
 * leading visual.
 */
export function IntegrationTypeIcon({
  type,
  logoUrl,
  className,
}: {
  type: IntegrationType;
  logoUrl?: string | null;
  className?: string;
}) {
  const Icon = INTEGRATION_TYPE_ICONS[type] ?? Puzzle;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[var(--vms-radius-control)]",
        "border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider logos are remote marks
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain p-2"
          loading="lazy"
        />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </span>
  );
}

export function IntegrationTypeBadge({
  type,
  showIcon = true,
}: IntegrationTypeBadgeProps) {
  const Icon = INTEGRATION_TYPE_ICONS[type] || Puzzle;
  const label = INTEGRATION_TYPE_LABELS[type] || "Other";

  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
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
