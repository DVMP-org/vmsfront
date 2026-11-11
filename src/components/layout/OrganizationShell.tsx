"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Settings, Puzzle } from "lucide-react";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasAdminPermission } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";

// Keep anchor attributes stable when the surrounding host editor annotates
// navigation before React hydrates, as it does for the shared header link.
const navigationAnchorProps = {
  contentEditable: false,
  style: { cursor: "pointer" },
} as const;

const links = [
  { href: "/organization", label: "Home", icon: Home },
  { href: "/organization/properties", label: "Properties", icon: Building2 },
  { href: "/organization/plugins", label: "Plugins", icon: Puzzle },
  {
    href: "/organization/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function OrganizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const organization = useAppStore((state) => state.organization);
  const profile = useAdminProfile();
  const visibleLinks = links.filter(
    (link) =>
      (link.href !== "/organization/plugins" ||
        hasAdminPermission(profile.data, "admins.list")) &&
      (link.href !== "/organization/properties" ||
        hasAdminPermission(profile.data, "places.list")),
  );

  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--vms-line)] bg-[var(--vms-surface)] lg:block">
          <div className="border-b border-[var(--vms-line)] px-4 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
              Organization
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {organization?.name || "Current organization"}
            </p>
          </div>
          <nav aria-label="Organization navigation" className="space-y-1 p-3">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/organization" &&
                  pathname?.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  {...navigationAnchorProps}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-[var(--vms-radius-control)] px-3 text-sm font-medium transition-colors duration-[var(--vms-motion)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                    active
                      ? "text-[var(--vms-ink)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--vms-active-accent)]"
                      : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mx-3 mt-4 border-t border-[var(--vms-line)] pt-3">
            <Link
              href="/organizations"
              {...navigationAnchorProps}
              className="flex min-h-11 items-center gap-3 rounded-[var(--vms-radius-control)] px-3 text-sm font-medium text-[var(--vms-ink-muted)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
            >
              <Building2 className="h-4 w-4" />
              All organizations
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <nav
              aria-label="Organization navigation"
              className="mb-5 flex gap-1 overflow-x-auto pb-1 lg:hidden"
            >
              {visibleLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/organization" &&
                    pathname?.startsWith(`${link.href}/`));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    {...navigationAnchorProps}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center rounded-[var(--vms-radius-control)] px-3 text-xs font-semibold",
                      active
                        ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                        : "bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] ring-1 ring-[var(--vms-line)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
