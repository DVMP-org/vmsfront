import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { InfoHint } from "./Tooltip";

/** Compact summary metric for workspace dashboards. */
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
    /** What the number counts and how it is derived; shown on hover/focus. */
    hint?: string;
}) {
  return (
    <Card className="flex min-h-[88px] items-center gap-5 px-5 py-4">
      <Icon
        className="h-7 w-7 shrink-0 text-[var(--vms-ink-muted)]"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-[26px] font-semibold leading-8 tracking-[-0.04em] tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--vms-ink-muted)]">
          <span className="truncate">{label}</span>
          {hint ? <InfoHint content={hint} label={`About ${label}`} /> : null}
        </p>
      </div>
    </Card>
  );
}
