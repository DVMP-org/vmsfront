import { notFound } from "next/navigation";
import { BrandingSection } from "@/app/admin/settings/components/BrandingSection";
import IntegrationsSection from "@/app/admin/settings/components/IntegrationsSection";
import { MailerSettingsSection } from "@/app/admin/settings/components/MailerSettingsSection";
import { PaymentGatewaysSection } from "@/app/admin/settings/components/PaymentGatewaysSection";
import { SubscriptionSection } from "@/app/admin/settings/components/SubscriptionSection";
import { type OrganizationSettingsSection } from "@/components/settings/OrganizationSettingsTabs";

const sections: Partial<Record<
  OrganizationSettingsSection,
  { title: string; description: string; component: React.ComponentType }
>> = {
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
  return <Content />;
}
