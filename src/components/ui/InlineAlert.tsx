import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type InlineAlertTone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<InlineAlertTone, string> = {
  info: "border-[color-mix(in_srgb,var(--vms-info)_25%,transparent)] bg-[color-mix(in_srgb,var(--vms-info)_8%,white)] text-[var(--vms-info)]",
  success:
    "border-[color-mix(in_srgb,var(--vms-success)_25%,transparent)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--vms-warning)_30%,transparent)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
  danger:
    "border-[color-mix(in_srgb,var(--vms-danger)_25%,transparent)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]",
};

const icons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

export function InlineAlert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: InlineAlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-[var(--vms-radius-control)] border px-3 py-2.5 text-sm",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={cn("leading-5", title && "mt-0.5")}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
