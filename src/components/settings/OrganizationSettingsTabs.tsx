import Link from "next/link";

const sections = [
  { id: "branding", label: "Branding" },
  { id: "payment", label: "Payments" },
  { id: "integrations", label: "Integrations" },
  { id: "mailer", label: "Mail delivery" },
  { id: "subscription", label: "Subscription" },
] as const;

export type OrganizationSettingsSection = (typeof sections)[number]["id"];

export function OrganizationSettingsTabs({
  active,
}: {
  active?: OrganizationSettingsSection;
}) {
  return (
    <nav
      aria-label="Organization configuration sections"
      className="-mx-1 overflow-x-auto border-b border-[var(--vms-line)]"
    >
      <div className="flex min-w-max gap-1 px-1">
        <Link
          href="/organization/settings"
          aria-current={!active ? "page" : undefined}
          className={[
            "relative inline-flex min-h-11 items-center px-3 text-sm font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-inset",
            !active
              ? "text-[var(--vms-ink)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[var(--vms-active-accent)]"
              : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
          ].join(" ")}
        >
          General details
        </Link>
        {sections.map((section) => {
          const selected = section.id === active;
          return (
            <Link
              key={section.id}
              href={`/organization/settings/${section.id}`}
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
