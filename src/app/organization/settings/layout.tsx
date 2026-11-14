"use client";

import { usePathname } from "next/navigation";
import {
  OrganizationSettingsTabs,
  organizationSettingsSectionFromPath,
  type OrganizationSettingsSection,
} from "@/components/settings/OrganizationSettingsTabs";

const headings: Record<
  OrganizationSettingsSection,
  { title: string; description: string }
> = {
  general: {
    title: "Organization settings",
    description:
      "Manage the identity, operating context and configuration above your Sites and workspaces.",
  },
  administrators: {
    title: "Administrators",
    description:
      "Manage organization-level administrators without implying Place occupancy or site administration.",
  },
  roles: {
    title: "Roles & permissions",
    description:
      "Review organization roles and explore permission composition in this release.",
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
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          Organization administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          {heading.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
          {heading.description}
        </p>
      </header>
      <OrganizationSettingsTabs active={section} />
      {children}
    </main>
  );
}
