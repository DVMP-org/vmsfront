import { notFound } from "next/navigation";
import { BrandingSection } from "@/app/admin/settings/components/BrandingSection";
import { SubscriptionSection } from "@/app/admin/settings/components/SubscriptionSection";
import { type OrganizationSettingsSection } from "@/components/settings/OrganizationSettingsTabs";
import { EmailTemplatesSection } from "@/features/email-templates/components/EmailTemplatesSection";

const sections: Partial<
  Record<
    OrganizationSettingsSection,
    { title: string; description: string; component: React.ComponentType }
  >
> = {
  branding: {
    title: "Brand and theme",
    description:
      "Control organization marks, identity accents and the accessible light brand kit.",
    component: BrandingSection,
  },
  templates: {
    title: "Email templates",
    description:
      "Customize transactional email content. SMTP delivery is configured as an integration.",
    component: EmailTemplatesSection,
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

export default async function OrganizationConfigurationPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const routeParams = await params;
  const section = routeParams.section as OrganizationSettingsSection;
  const config = sections[section];
  if (!config) notFound();

  const Content = config.component;
  return <Content />;
}
