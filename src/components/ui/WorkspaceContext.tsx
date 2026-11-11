import { Building2 } from "lucide-react";
import { Card } from "./Card";

export function WorkspaceContext({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  return (
    <Card className="flex items-center gap-3 px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
        <Building2 className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          Property workspace
        </p>
        <p className="truncate text-sm">
          <strong>{name}</strong>
          {description && (
            <span className="text-[var(--vms-ink-muted)]">
              {" "}
              · {description}
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
