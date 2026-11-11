"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { hasAdminPermission } from "@/lib/permissions";

/**
 * Organization management is an owner/delegated-administrator surface.
 *
 * Membership alone is not enough: a Site administrator is still an
 * organization member, but they must not inherit organization ownership or
 * portfolio administration. The server enforces the same grants on every
 * organization endpoint; this guard only prevents a confusing empty shell.
 */
export function OrganizationAccessGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = useAdminProfile();
    const organization = useCurrentOrganization();

    if (profile.isPending || organization.isPending) {
        return (
            <div role="status" className="space-y-4">
                <span className="sr-only">Checking organization administration access</span>
                <div className="h-8 w-56 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-64 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
            </div>
        );
    }

    const canManage =
        !profile.isError &&
        hasAdminPermission(profile.data, ["organizations.show", "admins.list"]);

    if (!canManage) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="w-full max-w-lg rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6 text-center sm:p-8">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]">
                        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
                        Organization management is restricted
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-[var(--vms-ink-muted)]">
                        Only organization owners and explicitly delegated administrators can
                        open this workspace. Site administration remains available inside the
                        Site workspaces you are authorized to manage.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                Open Workspaces
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
