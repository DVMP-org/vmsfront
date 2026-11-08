import { notFound } from "next/navigation";
import { BrandingSection } from "@/app/admin/settings/components/BrandingSection";
import IntegrationsSection from "@/app/admin/settings/components/IntegrationsSection";
import { MailerSettingsSection } from "@/app/admin/settings/components/MailerSettingsSection";
import { PaymentGatewaysSection } from "@/app/admin/settings/components/PaymentGatewaysSection";
import { SubscriptionSection } from "@/app/admin/settings/components/SubscriptionSection";
import {
  OrganizationSettingsTabs,
  type OrganizationSettingsSection,
} from "@/components/settings/OrganizationSettingsTabs";

const sections: Record<
  OrganizationSettingsSection,
  { title: string; description: string; component: React.ComponentType }
> = {
  branding: {
    title: "Brand and theme",
    description:
      "Control organization marks, identity accents and the accessible light brand kit.",
    component: BrandingSection,
  },
  payment: {
    title: "Payment gateways",
    description:
      "Configure the providers used to collect organization and property payments.",
    component: PaymentGatewaysSection,
  },
  integrations: {
    title: "Integrations",
    description:
      "Connect external services and review their credentials and connection state.",
    component: IntegrationsSection,
  },
  mailer: {
    title: "Mail delivery",
    description:
      "Configure delivery infrastructure and the organization's transactional email.",
    component: MailerSettingsSection,
  },
  subscription: {
    title: "Subscription and billing",
    description:
      "Review the organization's plan, invoices and billing configuration.",
    component: SubscriptionSection,
  },
};

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default function OrganizationConfigurationPage({
  params,
}: {
  params: { section: string };
}) {
  const section = params.section as OrganizationSettingsSection;
  const config = sections[section];
  if (!config) notFound();

  const Content = config.component;
  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          Organization administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          {config.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
          {config.description}
        </p>
      </header>
      <OrganizationSettingsTabs active={section} />
      <Content />
    </main>
  );
}
