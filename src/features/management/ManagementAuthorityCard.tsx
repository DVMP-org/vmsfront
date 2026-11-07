import Link from "next/link";
import { ArrowUpRight, Building2, ShieldCheck, Users } from "lucide-react";
import type { WorkspaceContext } from "@/features/context/api";

export function ManagementAuthorityCard({
  management,
}: {
  management: WorkspaceContext["management"];
}) {
  if (!management?.is_administrator || !management.authoritative_place) {
    return null;
  }

  const inherited = management.mode === "inherited";
  return (
    <section className="rounded-xl border border-[rgb(var(--brand-primary,#213928)/0.18)] bg-[rgb(var(--brand-primary,#213928)/0.04)] p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[rgb(var(--brand-primary,#213928))] shadow-sm dark:bg-zinc-900 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--brand-primary,#213928))] dark:text-emerald-300">
              {inherited ? "Inherited administration" : "Local administration"}
            </p>
            <h2 className="mt-1 text-base font-semibold">
              {inherited
                ? `Managed by ${management.authoritative_place.name}`
                : `${management.authoritative_place.name} management`}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {inherited
                ? "This site uses its nearest managing site without duplicating an admin workspace."
                : "This site has its own management and occupancy authority."}
            </p>
          </div>
        </div>
        <Link
          href="/admin"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[rgb(var(--brand-primary,#213928)/0.25)] bg-white px-3 py-2 text-xs font-semibold text-[rgb(var(--brand-primary,#213928))] shadow-sm hover:bg-white/80 dark:border-emerald-900 dark:bg-zinc-900 dark:text-emerald-300"
        >
          Open management
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[rgb(var(--brand-primary,#213928)/0.12)] pt-3 text-xs text-zinc-600 dark:border-emerald-900 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          {management.authoritative_place.kind.replaceAll("_", " ")}
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
