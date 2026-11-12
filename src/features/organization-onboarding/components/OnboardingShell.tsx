"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { SetupProgress } from "@/components/onboarding/SetupProgress";

import type { OnboardingStepId } from "../lib";

/**
 * One shell for all three onboarding steps: same chrome, same progress rail,
 * same two-column rhythm. Pages only supply the copy and the step body.
 */
export function OnboardingShell({
    step,
    eyebrow,
    title,
    description,
    back,
    aside,
    children,
}: {
    step: OnboardingStepId;
    eyebrow: string;
    title: string;
    description: ReactNode;
    back?: { href: string; label: string };
    aside?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
            <Header type="select" />
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {back ? (
                    <Link
                        href={back.href}
                        className="mb-7 inline-flex items-center gap-2 rounded-[var(--vms-radius-control)] text-sm font-semibold text-[var(--vms-ink-muted)] transition hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {back.label}
                    </Link>
                ) : null}

                <header className="mb-7">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        {eyebrow}
                    </p>
                    <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                        {title}
                    </h1>
                    <div className="mt-3 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
                        {description}
                    </div>
                </header>

                <SetupProgress currentStep={step} />

                <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-5">{children}</div>
                    {aside ? (
                        <aside className="space-y-4 xl:sticky xl:top-6">{aside}</aside>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
