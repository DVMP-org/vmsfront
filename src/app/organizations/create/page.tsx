import { OnboardingShell } from "@/features/organization-onboarding/components/OnboardingShell";
import { OnboardingSidebar } from "@/features/organization-onboarding/components/OnboardingSidebar";
import { OrganizationIdentityForm } from "@/features/organization-onboarding/components/OrganizationIdentityForm";
import { stepCounter } from "@/features/organization-onboarding/lib";

export default function CreateOrganizationPage() {
  return (
    <OnboardingShell
      step="organization"
      eyebrow={stepCounter("organization")}
      title="Create your organization"
      description={
        <>
          Start with the tenant everything else belongs to: Sites, people,
          charges and invoices. Your plan and first Site come next, and you pick
          that Site&apos;s operating type when you create it.
        </>
      }
      back={{ href: "/organizations", label: "Organizations" }}
      aside={
        <OnboardingSidebar
          current="organization"
          footer="Your draft stays in this browser until the organization is created, so you can leave and come back."
        />
      }
    >
      <OrganizationIdentityForm />
    </OnboardingShell>
  );
}
