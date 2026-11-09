"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  DoorOpen,
  Home,
  Megaphone,
  ReceiptText,
  ScanLine,
  Shield,
  Ticket,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { domainExperiences } from "@/config/domains";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  home: Home,
  building: Building2,
  users: UsersRound,
  receipt: ReceiptText,
  wrench: Wrench,
  shield: DoorOpen,
  megaphone: Megaphone,
  scan: ScanLine,
  ticket: Ticket,
};

const sections = Array.from(
  new Map(
    domainExperiences.residential.navigation
      .flatMap((group) => group.items)
      .map((item) => [item.href, item]),
  ).values(),
).map((item) => ({
  href: item.href,
  label: item.label,
  icon: icons[item.icon] ?? Shield,
}));

export function ResidentialModuleNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Residential operations"
      className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)] pb-2"
    >
      <ul className="flex min-w-max gap-1 px-1">
        {sections.map((section) => {
          const active =
            section.href === "/admin/residential"
              ? pathname === section.href
              : section.href === "/admin/checkpoints"
                ? pathname === section.href ||
                  pathname?.startsWith(`${section.href}/`)
                : pathname === section.href ||
                  pathname?.startsWith(`${section.href}/`);
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
