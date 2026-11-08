"use client";

import { ReactNode } from "react";
import { LogoFull } from "@/components/LogoFull";
import { Building2, ShieldCheck, Waypoints } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
            <header className="border-b border-[var(--vms-line)] bg-[var(--vms-action)] px-4 py-3 text-[var(--vms-on-action)] sm:px-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <LogoFull width={112} height={38} color="#ffffff" />
                    <p className="hidden text-xs font-medium text-white/70 sm:block">
                        Property operations, kept in context
                    </p>
                </div>
            </header>

            <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
                <aside className="hidden border-r border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-10 py-14 lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                            VMSCore / Operations Hub
                        </p>
                        <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.045em]">
                            One operating context for every property, role and decision.
                        </h1>
                        <p className="mt-5 max-w-lg text-base leading-7 text-[var(--vms-ink-muted)]">
                            Move between organization administration and the property
                            workspace that belongs to your actual relationship.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {[
                            [Building2, "Property context", "Places, buildings and spaces remain distinct from the organization."],
                            [Waypoints, "Role-aware access", "Management, occupancy, staff and guest access stay separate."],
                            [ShieldCheck, "Tenant boundaries", "Context is verified before protected records or actions load."],
                        ].map(([Icon, itemTitle, detail]) => {
                            const ItemIcon = Icon as typeof Building2;
                            return (
                                <div
                                    key={String(itemTitle)}
                                    className="flex gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                                >
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                                        <ItemIcon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-semibold">{String(itemTitle)}</h2>
                                        <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
                                            {String(detail)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                                Secure account access
                            </p>
                            <h2 className="mt-2 text-[28px] font-semibold leading-9 tracking-[-0.035em]">
                                {title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--vms-ink-muted)]">
                                {description}
                            </p>
                        </div>
                        {children}
                        <p className="mt-10 text-center text-xs text-[var(--vms-ink-muted)]">
                            &copy; {new Date().getFullYear()} VMSCore. All rights reserved.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
