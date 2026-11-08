"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Crown, Mail, Palette, Settings } from "lucide-react";
import { Suspense } from "react";

const settingsTabs = [
  { id: "payment", label: "Payment gateways", icon: CreditCard },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "mailer", label: "Mail delivery", icon: Mail },
  { id: "subscription", label: "Subscription", icon: Crown },
] as const;

type SettingsTab = (typeof settingsTabs)[number]["id"];

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab");
  const activeTab: SettingsTab = settingsTabs.some(
    (tab) => tab.id === requested,
  )
    ? (requested as SettingsTab)
    : "payment";

  return (
    <div className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="border-b border-[var(--vms-line)] pb-5">
        <div className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
          <Settings
            className="h-4 w-4 text-[var(--vms-action)]"
            aria-hidden="true"
          />
          Organization administration
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          Organization configuration
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
          Configure branding, mail delivery, payments and the organization
          subscription.
        </p>
      </header>

      <nav
        aria-label="Organization configuration sections"
        className="overflow-x-auto border-b border-[var(--vms-line)]"
      >
        <div className="flex min-w-max gap-1">
          {settingsTabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <Link
                key={id}
                href={`/admin/settings?tab=${id}`}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-inset",
                  active
                    ? "text-[var(--vms-ink)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[var(--vms-active-accent)]"
                    : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div>{children}</div>
    </div>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-48 items-center justify-center text-sm text-[var(--vms-ink-muted)]"
          role="status"
          aria-busy="true"
        >
          Loading configuration…
        </div>
      }
    >
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  );
}
