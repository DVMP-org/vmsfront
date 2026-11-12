"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { AllPlansInclude } from "@/features/organization-onboarding/components/AllPlansInclude";
import { OnboardingShell } from "@/features/organization-onboarding/components/OnboardingShell";
import { OnboardingSidebar } from "@/features/organization-onboarding/components/OnboardingSidebar";
import { PlanStep } from "@/features/organization-onboarding/components/PlanStep";
import { stepCounter } from "@/features/organization-onboarding/lib";
import { useCurrentOrganization } from "@/hooks/use-organization";

const SETUP_SESSION_KEY = "organization-setup-step";

export default function PlansPage() {
    const [setupMode, setSetupMode] = useState(false);
    const { organization } = useCurrentOrganization();

    useEffect(() => {
        const search = new URLSearchParams(window.location.search);
        const requested =
            search.get("setup") === "first-site" ||
            window.sessionStorage.getItem(SETUP_SESSION_KEY) === "first-site";
        if (!requested) return;
        setSetupMode(true);
        window.sessionStorage.setItem(SETUP_SESSION_KEY, "first-site");
    }, []);

    const organizationName = organization?.name || "your organization";

    if (setupMode) {
        return (
            <OnboardingShell
                step="plan"
                eyebrow={stepCounter("plan")}
                title="Choose a plan"
                description={
          <>
                Pick the capabilities {organizationName} may use. The plan applies to
                every Site you add, and you can change it later from organization
                settings. Your first Site comes next.
            </>
        }
            back={{ href: "/organizations/create", label: "Organization details" }}
            aside={
                <OnboardingSidebar
                    current="plan"
                    footer="The plan is organization-wide. Sites and people are created after this step."
                />
        }
        >
            <PlanStep mode="setup" />
            <AllPlansInclude />
        </OnboardingShell>
    );
  }

  return (
      <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />
          <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
              <header className="mx-auto max-w-2xl text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                      Plans
                  </p>
                  <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                      Choose Your Plan
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[var(--vms-ink-muted)]">
                      {organization?.name ? (
                          <>
                              Select a subscription plan for{" "}
                              <span className="font-semibold text-[var(--vms-ink)]">
                                  {organization.name}
                              </span>
                              . You can change it at any time.
                          </>
                      ) : (
                          "Select a subscription plan to get started with every core capability."
                      )}
                  </p>
              </header>

              <div className="mt-8">
                  <PlanStep mode="standalone" />
              </div>

              <div className="mt-8">
                  <AllPlansInclude />
        </div>
      </main>
    </div>
  );
}
