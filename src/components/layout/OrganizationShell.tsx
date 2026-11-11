"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  Plug,
  Puzzle,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

interface OrganizationNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Any one of these organization-level grants reveals the link. */
  permissions?: string[];
  exact?: boolean;
  activePaths?: string[];
}

const navigationGroups: { label: string; items: OrganizationNavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/organization", label: "Home", icon: Home, exact: true }],
  },
  {
    label: "Portfolio",
    items: [
      {
        href: "/organization/sites",
        label: "Sites",
        icon: Building2,
        permissions: ["places.list"],
      },
      {
        href: "/organization/administrators",
        label: "Members & Roles",
        activePaths: ["/organization/roles"],
        icon: Users,
        permissions: ["admins.list"],
      },
      {
        href: "/organization/managers",
        label: "Site managers",
        icon: UserCog,
        permissions: ["admins.list"],
      },
      {
        href: "/organization/integrations",
        label: "Integrations",
        icon: Plug,
        permissions: ["admins.list", "organizations.show"],
      },
      {
        href: "/organization/plugins",
        label: "Plugins",
        icon: Puzzle,
        permissions: ["admins.list"],
      },
      {
        href: "/organization/settings",
        label: "Settings",
        icon: Settings,
        permissions: ["organizations.show"],
      },
    ],
  },
];

function isActiveLink(
  item: OrganizationNavItem,
  pathname: string | null | undefined,
) {
  if (!pathname) return false;
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  if (item.exact) return currentPath === item.href;
  return [item.href, ...(item.activePaths ?? [])].some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`),
  );
}

export function OrganizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const organization = useAppStore((state) => state.organization);
  const profile = useAdminProfile();
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.permissions ||
          hasAdminPermission(profile.data, item.permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const mobileItems = visibleGroups.flatMap((group) => group.items);

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
          <nav aria-label="Organization navigation" className="space-y-5 p-3">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveLink(item, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        {...navigationAnchorProps}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-11 items-center gap-3 rounded-[var(--vms-radius-control)] px-3 text-sm transition-colors duration-[var(--vms-motion)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                          active
                            ? "bg-[var(--vms-surface-subtle)] font-semibold text-[var(--vms-ink)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--vms-active-accent)]"
                            : "font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
              className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--vms-line)] pb-0 lg:hidden"
            >
              {mobileItems.map((item) => {
                const active = isActiveLink(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    {...navigationAnchorProps}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                      active
                        ? "border-[var(--vms-ink)] font-semibold text-[var(--vms-ink)]"
                        : "border-transparent font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                    )}
                  >
                    {item.label}
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
