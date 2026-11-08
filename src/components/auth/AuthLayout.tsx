"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, Check, ShieldCheck, Sparkles } from "lucide-react";

import { VmsWordmark } from "@/components/brand/VmsBrand";
import { OperationsIllustration } from "@/components/illustrations/OperationsIllustration";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

const assurances = [
  [
    Building2,
    "One place for every property",
    "Organization, place and workspace stay distinct.",
  ],
  [
    ShieldCheck,
    "Role-aware by default",
    "People only enter contexts they actually own.",
  ],
] as const;

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <header className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="VMS Core home">
          <VmsWordmark size="md" />
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex min-h-10 items-center rounded-[var(--vms-radius-control)] px-3 text-xs font-semibold text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          Need an account?
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1440px] overflow-hidden border-t border-[var(--vms-line)] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <aside className="relative hidden overflow-hidden border-r border-[var(--vms-line)] bg-[var(--vms-surface)] px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(31,41,51,.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,41,51,.045) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "linear-gradient(to bottom right, black, transparent 74%)",
            }}
          />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--vms-coral)]" />
              Operations, in context
            </span>
            <h1 className="mt-7 text-[clamp(2.4rem,4.6vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
              The calm control room for every property.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--vms-ink-muted)]">
              Move from organization administration into the property workspace
              that belongs to your real role, with the next decision already in
              view.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-end">
            <div className="grid gap-2.5">
              {assurances.map(([Icon, itemTitle, detail]) => (
                <div
                  key={itemTitle}
                  className="flex items-center gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]/90 px-3.5 py-3 backdrop-blur"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {itemTitle}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                      {detail}
                    </span>
                  </span>
                  <Check className="ml-auto h-4 w-4 shrink-0 text-[var(--vms-success)]" />
                </div>
              ))}
            </div>
            <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-canvas)] p-4">
              <OperationsIllustration
                variant="property"
                className="max-w-full"
              />
              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                Built around how places actually work
              </p>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[27rem]">
            <div className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--vms-ink-muted)]">
                Secure workspace access
              </p>
              <h2 className="mt-2.5 text-[30px] font-semibold leading-9 tracking-[-0.045em] sm:text-[34px] sm:leading-10">
                {title}
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-[var(--vms-ink-muted)]">
                {description}
              </p>
            </div>
            {children}
            <p className="mt-9 border-t border-[var(--vms-line)] pt-5 text-center text-[11px] leading-5 text-[var(--vms-ink-muted)]">
              &copy; {new Date().getFullYear()} VMS Core. Property operations,
              kept in context.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
