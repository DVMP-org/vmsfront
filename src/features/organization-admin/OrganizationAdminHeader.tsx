import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function OrganizationAdminHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="border-b border-[var(--vms-line)] pb-5">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vms-ink-muted)] transition-colors hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel || "Back"}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-8 tracking-[-0.03em] text-[var(--vms-ink)] sm:text-[28px] sm:leading-9">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
