"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MoveRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";

import { parentSiteOptions, subtreeSiteIds } from "../lib";
import {
    useMoveOrganizationSite,
    useOrganizationSite,
    useOrganizationSites,
} from "../queries";
import { SectionHeading, SurfaceCard } from "./organization-ui";

export function OrganizationSiteMove({ siteId }: { siteId: string }) {
    const router = useRouter();
    const { organization } = useCurrentOrganization();
    const slug = organization?.slug ?? null;
    const detail = useOrganizationSite(slug, siteId);
    const portfolio = useOrganizationSites(slug);
    const profile = useAdminProfile();
    const move = useMoveOrganizationSite(slug);
    const [parentId, setParentId] = useState<string>("");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (detail.data && !initialized) {
            setParentId(detail.data.parent_site_id ?? "");
            setInitialized(true);
        }
    }, [detail.data, initialized]);

    const options = useMemo(() => {
        const excluded = subtreeSiteIds(portfolio.data ?? [], siteId);
        return parentSiteOptions(portfolio.data ?? [], excluded);
    }, [portfolio.data, siteId]);

    const canMove =
        profile.isSuccess &&
        !profile.isError &&
        hasAdminPermission(profile.data, "places.move");

    if (detail.isPending) {
        return (
            <div role="status" className="space-y-4">
                <span className="sr-only">Loading Site</span>
                <div className="h-9 w-72 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-56 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
            </div>
        );
    }

    if (detail.isError || !detail.data) {
        return (
            <div className="space-y-4">
                <OrganizationAdminHeader
                    eyebrow="Portfolio"
                    title="Site unavailable"
                    description="This Site could not be loaded for the current organization."
                    backHref="/organization/sites"
                    backLabel="Back to Sites"
                />
                <InlineAlert
                    tone="danger"
                    title="Site could not be loaded"
                    action={
                        <Button size="sm" variant="outline" onClick={() => detail.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(detail.error).message}
                </InlineAlert>
            </div>
        );
    }

    const site = detail.data;
    const currentParent = site.parent_site_id
        ? portfolio.data?.find((item) => item.id === site.parent_site_id) ?? null
        : null;

    if (!canMove) {
        return (
            <div className="space-y-4">
                <OrganizationAdminHeader
                    eyebrow="Portfolio"
                    title={`Move ${site.name}`}
                    description="Change the Site's position in the organization hierarchy."
                    backHref={`/organization/sites/${site.id}`}
                    backLabel="Back to Site"
                />
                <InlineAlert tone="warning" title="Moving unavailable">
                    Your current role cannot move organization Sites.
                </InlineAlert>
            </div>
        );
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        move.mutate(
            {
                siteId: site.id,
                parentSiteId: parentId || null,
            },
            {
                onSuccess: () => {
                    router.push(`/organization/sites/${site.id}`);
                },
            },
        );
    }

    const serverError = move.isError ? parseApiError(move.error).message : null;

    return (
        <div className="space-y-5">
            <OrganizationAdminHeader
                eyebrow="Portfolio"
                title={`Move ${site.name}`}
                description={
                    currentParent
                        ? `Currently nested under ${currentParent.name}.`
                        : "Currently at the organization root."
                }
                backHref={`/organization/sites/${site.id}`}
                backLabel="Back to Site"
            />

            <form onSubmit={submit} className="space-y-5">
                <SurfaceCard>
                    <SectionHeading
                        title="New position"
                        description="Choose the Site that should contain this Site. The organization root is available for top-level Sites."
                    />
                    <div className="space-y-5 px-4 py-4 sm:px-5">
                        {serverError ? (
                            <InlineAlert tone="danger" title="Site could not be moved">
                                {serverError}
                            </InlineAlert>
                        ) : null}
                        <Field
                            id="site-parent"
                            label="Parent Site"
                            description="A Site cannot be moved beneath itself or one of its own child Sites."
                        >
                            {(control) => (
                                <select
                                    {...control}
                                    value={parentId}
                                    onChange={(event) => setParentId(event.target.value)}
                                    className={fieldControlClassName}
                                >
                                    <option value="">Organization root</option>
                                    {options.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </Field>
                    </div>
                </SurfaceCard>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" asChild>
                        <Link href={`/organization/sites/${site.id}`}>
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={move.isPending}>
                        {move.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <MoveRight className="h-4 w-4" aria-hidden="true" />
                        )}
                        {move.isPending ? "Moving" : "Move Site"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
