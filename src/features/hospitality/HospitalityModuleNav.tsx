"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  ClipboardCheck,
  ConciergeBell,
  ReceiptText,
  ScanLine,
  Ticket,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin",
    label: "Reservations",
    icon: ConciergeBell,
    exact: true,
  },
  { href: "/admin/hospitality/rooms", label: "Rooms", icon: BedDouble },
  {
    href: "/admin/hospitality/calendar",
    label: "Availability",
    icon: CalendarDays,
  },
  {
    href: "/admin/hospitality/housekeeping",
    label: "Housekeeping",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/hospitality/billing",
    label: "Guest billing",
    icon: ReceiptText,
  },
  {
    href: "/admin/hospitality/maintenance",
    label: "Maintenance",
    icon: Wrench,
  },
  { href: "/admin/checkpoints", label: "Gate & check-in", icon: ScanLine },
  { href: "/admin/invitations", label: "Invitations", icon: Ticket },
] as const;

export function HospitalityModuleNav() {
  const pathname = usePathname()?.replace(/\/+$/, "") || "";
  return (
    <nav
      aria-label="Hospitality modules"
      className="flex gap-1 overflow-x-auto border-b border-[var(--vms-line)] pb-2"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active =
          "exact" in link && link.exact
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[var(--vms-radius-control)] px-3 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--vms-ink)] text-[var(--vms-on-action)]"
                : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
