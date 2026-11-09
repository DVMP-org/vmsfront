import Link from "next/link";
import { ArrowUpRight, Building2, ShieldCheck, Users } from "lucide-react";
import type { WorkspaceContext } from "@/features/context/api";

export function ManagementAuthorityCard({
  management,
}: {
  management: WorkspaceContext["management"];
}) {
  if (!management?.is_administrator || !management.authoritative_site) {
    return null;
  }

  const inherited = management.mode === "inherited";
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface)] text-[var(--vms-action)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-action)]">
              {inherited ? "Inherited administration" : "Local administration"}
            </p>
            <h2 className="mt-1 text-base font-semibold">
              {inherited
                ? `Managed by ${management.authoritative_site.name}`
                : `${management.authoritative_site.name} management`}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 ">
              {inherited
                ? "This site uses its nearest managing site without duplicating an admin workspace."
                : "This site has its own management and occupancy authority."}
            </p>
          </div>
        </div>
        <Link
          href="/admin"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-xs font-semibold text-[var(--vms-action)] hover:bg-[var(--vms-surface-subtle)]"
        >
          Open management
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--vms-line)] pt-3 text-xs text-[var(--vms-ink-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Site
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {management.administrators.length} administrator
          {management.administrators.length === 1 ? "" : "s"}
        </span>
        {management.administrators[0]?.display_name ? (
          <span>{management.administrators[0].display_name}</span>
        ) : null}
      </div>
    </section>
  );
}
