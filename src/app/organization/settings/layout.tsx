"use client";

import { usePathname } from "next/navigation";
import {
  OrganizationSettingsTabs,
  organizationSettingsSectionFromPath,
  type OrganizationSettingsSection,
} from "@/components/settings/OrganizationSettingsTabs";
import { PageHeader } from "@/components/ui/PageHeader";

const headings: Record<
  OrganizationSettingsSection,
  { title: string; description: string }
> = {
  general: {
    title: "Organization settings",
    description:
      "Manage the identity, operating context and configuration above your Sites and workspaces.",
  },
  branding: {
    title: "Brand and theme",
    description:
      "Control organization marks, identity accents and the accessible light brand kit.",
  },
  templates: {
    title: "Email templates",
    description:
      "Customize transactional email content. Delivery credentials live in the SMTP integration.",
  },
  subscription: {
    title: "Subscription and billing",
    description:
      "Review the organization's plan, invoices and billing configuration.",
  },
  plugins: {
    title: "Organization plugins",
    description:
      "Install, enable and configure plugins once for every Site in this organization.",
  },
  integrations: {
    title: "Organization integrations",
    description:
      "Configure organization-wide providers, credentials and shared integration availability.",
  },
};

export default function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const section = organizationSettingsSectionFromPath(pathname);
  const heading = headings[section];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Organization administration"
        title={heading.title}
        description={heading.description}
      />
      <OrganizationSettingsTabs active={section} />
      {children}
    </main>
  );
}
