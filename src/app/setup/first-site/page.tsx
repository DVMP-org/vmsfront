"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert } from "@/components/ui/InlineAlert";
import { Button } from "@/components/ui/Button";
import { SetupSkeleton } from "@/features/organization-onboarding/components/SetupSkeleton";
import { OnboardingShell } from "@/features/organization-onboarding/components/OnboardingShell";
import { OnboardingSidebar } from "@/features/organization-onboarding/components/OnboardingSidebar";
import { FirstSiteForm } from "@/features/organization-onboarding/components/FirstSiteForm";
import { SiteHierarchyCard } from "@/features/organization-onboarding/components/SiteHierarchyCard";
import { stepCounter } from "@/features/organization-onboarding/lib";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { Header } from "@/components/layout/Header";
import Link from "next/link";

export default function FirstSiteSetupPage() {
  const router = useRouter();
    const { organization, isPending, isError, refetch } = useCurrentOrganization();
  const needsFirstSite = organization?.needs_first_site === true;

  useEffect(() => {
    if (!isPending && organization && !needsFirstSite) {
      router.replace("/?lobby=1");
    }
  }, [isPending, needsFirstSite, organization, router]);

  if (isPending) {
      return <SetupSkeleton label="Loading first-Site setup" />;
  }

  if (isError || !organization) {
    return (
      <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
        <Header type="select" />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <InlineAlert
            tone="danger"
            title="Setup context is unavailable"
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            We could not load the organization that is waiting for its first
            Site.
          </InlineAlert>
        </main>
      </div>
    );
  }

  if (!needsFirstSite) {
    return (
        <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
        <Header type="select" />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <InlineAlert
            tone="success"
            title="Your organization already has a Site"
            action={
              <Button asChild size="sm">
                    <Link href="/?lobby=1">Open workspaces</Link>
              </Button>
            }
          >
            First-Site setup is complete. Choose a permitted workspace to
            continue.
          </InlineAlert>
        </main>
      </div>
    );
  }

  return (
      <OnboardingShell
          step="site"
          eyebrow={stepCounter("site")}
          title="Create your first Site"
          description={
              <>
                  {organization.name}&apos;s plan is active. Add the top-level Site and
                  its administrator, and we will open a management workspace provisioned
                  for the operating type you choose.
              </>
          }
          back={{ href: "/plans?setup=first-site", label: "Back to plan" }}
          aside={
              <>
                  <OnboardingSidebar
                      current="site"
                      footer="Sites can be nested later. This one is the top-level Site for the organization."
                  />
              <InlineAlert tone="info" title="Management stays Site-scoped">
                  Organization membership does not create a management workspace. Work
                  modes appear once this Site exists and access is assigned.
              </InlineAlert>
                  <SiteHierarchyCard organizationName={organization.name} />
              </>
          }
      >
          <FirstSiteForm organization={organization} />
      </OnboardingShell>
  );
}
