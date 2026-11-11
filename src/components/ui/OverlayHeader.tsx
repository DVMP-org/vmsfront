import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

export function OverlayHeader({
  title, titleId, description, descriptionId, icon: Icon, eyebrow, onClose, closeLabel,
}: {
  title?: string;
  titleId: string;
  description?: string;
  descriptionId: string;
  icon?: LucideIcon;
  eyebrow?: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <header className="flex shrink-0 items-start gap-3 border-b border-[var(--vms-line)] px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      {Icon ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">{eyebrow}</p> : null}
        {title ? <h2 id={titleId} className="text-lg font-semibold leading-6 tracking-tight">{title}</h2> : null}
        {description ? <p id={descriptionId} className="mt-1.5 text-sm leading-5 text-[var(--vms-ink-muted)]">{description}</p> : null}
      </div>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition-colors hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </header>
  );
}
