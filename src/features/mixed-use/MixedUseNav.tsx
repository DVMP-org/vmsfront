"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Scale,
  ScanLine,
  Share2,
  Ticket,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

const sections = [
  {
    href: "/admin/mixed-use",
    label: "Property overview",
    icon: Building2,
  },
  {
    href: "/admin/mixed-use/maintenance",
    label: "Maintenance",
    icon: Wrench,
  },
  {
    href: "/admin/mixed-use/facilities",
    label: "Shared facilities",
    icon: Share2,
  },
  {
    href: "/admin/mixed-use/expenses",
    label: "Expense allocation",
    icon: Scale,
  },
  {
    href: "/admin/checkpoints",
    label: "Gate & check-in",
    icon: ScanLine,
  },
  {
    href: "/admin/invitations",
    label: "Invitations",
    icon: Ticket,
  },
];

export function MixedUseNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mixed-use operations"
      className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)] pb-2"
    >
      <ul className="flex min-w-max gap-1 px-1">
        {sections.map((section) => {
          const active =
            section.href === "/admin/mixed-use"
              ? pathname === section.href
              : pathname?.startsWith(section.href);
          const Icon = section.icon;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                  active
                    ? "bg-[var(--vms-ink)] text-[var(--vms-surface)]"
                    : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
