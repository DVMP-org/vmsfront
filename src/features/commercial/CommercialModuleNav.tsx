"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  ReceiptText,
} from "lucide-react";

import { cn } from "@/lib/utils";

const sections = [
  {
    href: "/admin/commercial",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/commercial/inventory",
    label: "Inventory",
    icon: Building2,
  },
  {
    href: "/admin/commercial/tenants",
    label: "Tenants & leases",
    icon: BriefcaseBusiness,
  },
  {
    href: "/admin/commercial/finance",
    label: "Rent & services",
    icon: ReceiptText,
  },
  {
    href: "/admin/commercial/access",
    label: "Staff & access",
    icon: DoorOpen,
  },
  {
    href: "/admin/commercial/maintenance",
    label: "Maintenance",
    icon: ClipboardList,
  },
];

export function CommercialModuleNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Commercial operations"
      className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)] pb-2"
    >
      <ul className="flex min-w-max gap-1 px-1">
        {sections.map((section) => {
          const active =
            section.href === "/admin/commercial"
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
                <Icon aria-hidden="true" className="h-4 w-4" />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
