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
      "Manage the identity, operating context and configuration above your properties and workspaces.",
  },
  administrators: {
    title: "Administrators",
    description:
      "Manage organization-level administrators without implying property occupancy or site administration.",
  },
  roles: {
    title: "Roles & permissions",
    description:
      "Review organization roles and explore permission composition in this release.",
  },
  plugins: {
    title: "Plugins",
    description:
      "Install, configure and enable organization capabilities within their entitlement and connection state.",
  },
  branding: {
    title: "Brand and theme",
    description:
      "Control organization marks, identity accents and the accessible light brand kit.",
  },
  payment: {
    title: "Payment gateways",
    description:
      "Configure providers used to collect organization and property payments.",
  },
  integrations: {
    title: "Integrations",
    description:
      "Connect external services and review credentials and connection state.",
  },
  mailer: {
    title: "Mail delivery",
    description:
      "Configure transactional email delivery for the organization.",
  },
  subscription: {
    title: "Subscription and billing",
    description:
      "Review the organization's plan, invoices and billing configuration.",
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
