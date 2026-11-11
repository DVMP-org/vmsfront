"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function OrganizationHeader({
    name,
    description,
    canCreate,
    onCreate,
}: {
    name: string;
    description?: string | null;
    canCreate: boolean;
    onCreate: () => void;
}) {
    return (
        <header className="border-b border-[var(--vms-line)] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                Organization
            </p>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[var(--vms-ink)] sm:text-[28px] sm:leading-9">
                        {name}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
                        {description ||
                            "Own the organization portfolio: Sites, operating boundaries, membership and shared integrations."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/">
                            Open Workspaces
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </Button>
                    {canCreate ? (
                        <Button onClick={onCreate}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Create Site
                        </Button>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
