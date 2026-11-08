"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const links = [
  { href: "/organization", label: "Home", icon: Home },
  { href: "/organization/workspaces", label: "Workspaces", icon: LayoutGrid },
  {
    href: "/organization/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function OrganizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const organization = useAppStore((state) => state.organization);

  return (
    <div className="min-h-screen bg-[#F5F7F8] text-[#1F2933]">
      <Header type="select" />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-64 shrink-0 border-r border-[#E5E7EB] bg-white lg:block">
          <div className="border-b border-[#E5E7EB] px-4 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667280]">
              Organization
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {organization?.name || "Current organization"}
            </p>
          </div>
          <nav aria-label="Organization navigation" className="space-y-1 p-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/organization" &&
                  pathname?.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]",
                    active
                      ? "text-[#1F2933] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[#E85D3F]"
                      : "text-[#596675] hover:bg-[#F5F7F8] hover:text-[#1F2933]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mx-3 mt-4 border-t border-[#E5E7EB] pt-3">
            <Link
              href="/organizations"
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#596675] transition hover:bg-[#F5F7F8] hover:text-[#1F2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
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
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/organization" &&
                    pathname?.startsWith(`${link.href}/`));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-xs font-semibold",
                      active
                        ? "bg-[#1F2933] text-white"
                        : "bg-white text-[#596675] ring-1 ring-[#E5E7EB]",
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
