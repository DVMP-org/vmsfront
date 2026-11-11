import Link from "next/link";

const sections = [
  { id: "general", label: "General details", href: "/organization/settings" },
  {
    id: "administrators",
    label: "Administrators",
    href: "/organization/settings/administrators",
  },
  {
    id: "roles",
    label: "Roles & permissions",
    href: "/organization/settings/roles",
  },
  {
    id: "branding",
    label: "Branding",
    href: "/organization/settings/branding",
  },
  {
    id: "payment",
    label: "Payments",
    href: "/organization/settings/payment",
  },
  {
    id: "mailer",
    label: "Mail delivery",
    href: "/organization/settings/mailer",
  },
  {
    id: "subscription",
    label: "Subscription",
    href: "/organization/settings/subscription",
  },
  {
    id: "plugins",
    label: "Plugins",
    href: "/organization/plugins",
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/organization/settings/integrations",
  },
] as const;

export type OrganizationSettingsSection = (typeof sections)[number]["id"];

export function OrganizationSettingsTabs({
  active,
}: {
  active: OrganizationSettingsSection;
}) {
  return (
    <nav
      aria-label="Organization configuration sections"
      className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)]"
    >
      <div className="flex min-w-max gap-1 px-1">
        {sections.map((section) => {
          const selected = section.id === active;
          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={selected ? "page" : undefined}
              className={[
                "relative inline-flex min-h-11 items-center px-3 text-sm font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-inset",
                selected
                  ? "text-[var(--vms-ink)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[var(--vms-active-accent)]"
                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
              ].join(" ")}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function organizationSettingsSectionFromPath(
  pathname: string | null,
): OrganizationSettingsSection {
  if (pathname?.startsWith("/organization/settings/administrators")) {
    return "administrators";
  }
  if (pathname?.startsWith("/organization/settings/roles")) return "roles";
  if (pathname?.startsWith("/organization/settings/branding"))
    return "branding";
  if (pathname?.startsWith("/organization/settings/payment")) return "payment";
  if (pathname?.startsWith("/organization/settings/mailer")) return "mailer";
  if (pathname?.startsWith("/organization/settings/subscription")) {
    return "subscription";
  }
  if (pathname?.startsWith("/organization/settings/plugins")) return "plugins";
  if (pathname?.startsWith("/organization/plugins")) return "plugins";
  if (pathname?.startsWith("/organization/settings/integrations")) {
    return "integrations";
  }
  return "general";
}
