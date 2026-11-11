"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building2,
    CalendarClock,
    FileText,
    History,
    Home,
    LayoutGrid,
    Megaphone,
    MessageSquare,
    ReceiptText,
    Settings,
    ShieldCheck,
    Ticket,
    UserRound,
    Users,
    Wallet,
    Wrench,
} from "lucide-react";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { PlaceContext } from "./api";
import { placeWorkspaceNavigation } from "./navigation";
import { PlaceWorkspaceSwitcher } from "./PlaceWorkspaceSwitcher";

const icons: Record<string, typeof Home> = {
    home: Home,
    building: Building2,
    ticket: Ticket,
    users: Users,
    history: History,
    megaphone: Megaphone,
    message: MessageSquare,
    receipt: ReceiptText,
    wrench: Wrench,
    user: UserRound,
    settings: Settings,
    scan: ShieldCheck,
    calendar: CalendarClock,
    wallet: Wallet,
    document: FileText,
};

export function PlaceSidebar({
    placeId,
    placeName,
    context,
    onNavigate,
}: {
    placeId: string;
    placeName?: string;
    context?: PlaceContext;
    onNavigate?: () => void;
}) {
    const pathname = usePathname()?.replace(/\/+$/, "");
    const groups = context ? placeWorkspaceNavigation(context) : [];

    return (
        <div className="flex h-full flex-col gap-4 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <PlaceWorkspaceSwitcher
                placeId={placeId}
                fallbackName={placeName}
                onNavigate={onNavigate}
            />

            <nav
                aria-label="Place workspace navigation"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto"
            >
                {!context ? <NavSkeleton /> : null}
                {groups.map((group) => (
                    <div key={group.id}>
                        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                            {group.label}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = icons[item.icon] ?? Home;
                                const active = pathname === item.href.replace(/\/+$/, "");
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                "relative flex min-h-10 items-center gap-2.5 rounded-md px-3 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                                                active
                                                    ? "bg-[var(--vms-surface-subtle)] font-semibold text-[var(--vms-ink)]"
                                                    : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                                            )}
                                        >
                                            {active ? (
                                                <span
                                                    aria-hidden
                                                    className="absolute w-[3px] rounded-full bg-[var(--vms-active-accent)]"
                                                />
                                            ) : null}
                                            <Icon aria-hidden className="h-4 w-4 shrink-0" />
                                            <span className="min-w-0 truncate">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="mt-auto border-t border-[var(--vms-line)] pt-2">
                <Link
                    href="/?lobby=1"
                    onClick={onNavigate}
                    className="flex min-h-10 items-center gap-2.5 rounded-md px-3 text-[13px] font-semibold text-[var(--vms-ink)] transition hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                    <LayoutGrid aria-hidden className="h-4 w-4 shrink-0" />
                    All workspaces
                </Link>
            </div>
        </div>
    );
}

function NavSkeleton() {
    return (
        <div className="space-y-4" aria-hidden>
            {[0, 1, 2].map((group) => (
                <div key={group} className="space-y-1.5">
                    <Skeleton className="mx-3 h-2.5 w-20" />
                    {[0, 1].map((row) => (
                        <Skeleton key={row} className="h-10 w-full rounded-md" />
                    ))}
                </div>
            ))}
        </div>
    );
}
