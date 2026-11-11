"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SetupProgress } from "@/components/onboarding/SetupProgress";
import {
  generateSlugFromName,
  useCheckSlugAvailability,
  useCreateOrganization,
} from "@/hooks/use-organization";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "organization-create-draft-v1";
const SLUG_UNAVAILABLE_MESSAGE =
  "This workspace URL is already in use. Choose a different URL.";

interface OrganizationDraft {
  name: string;
  slug: string;
  description: string;
  slugManuallyEdited: boolean;
}

const emptyDraft: OrganizationDraft = {
  name: "",
  slug: "",
  description: "",
  slugManuallyEdited: false,
};

export default function CreateOrganizationPage() {
  const [draft, setDraft] = useState<OrganizationDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugCheckPending, setSlugCheckPending] = useState(false);
  const { createOrganization, isLoading, error, fieldErrors } =
    useCreateOrganization({
      redirectTo: "/plans?setup=first-site",
      onSuccess: () => {
        window.localStorage.removeItem(DRAFT_KEY);
      },
    });
  const { checkSlug, isChecking } = useCheckSlugAvailability();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<OrganizationDraft>;
      const restored = { ...emptyDraft, ...parsed };
      if (restored.name || restored.slug || restored.description) {
        setDraft(restored);
        setDraftRestored(true);
      }
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, draftReady]);

  useEffect(() => {
    if (!draft.slugManuallyEdited && draft.name) {
      setDraft((current) => ({
        ...current,
        slug: generateSlugFromName(current.name),
      }));
    }
  }, [draft.name, draft.slugManuallyEdited]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      if (draft.slug.length >= 2) {
        setSlugCheckPending(true);
        const available = await checkSlug(draft.slug);
        if (cancelled) return;
        setSlugCheckPending(false);
        setSlugAvailable(available);
        setErrors((current) => {
          if (available) {
            if (current.slug !== SLUG_UNAVAILABLE_MESSAGE) return current;
            const next = { ...current };
            delete next.slug;
            return next;
          }
          return { ...current, slug: SLUG_UNAVAILABLE_MESSAGE };
        });
      } else {
        setSlugCheckPending(false);
        setSlugAvailable(null);
        setErrors((current) => {
          if (current.slug !== SLUG_UNAVAILABLE_MESSAGE) return current;
          const next = { ...current };
          delete next.slug;
          return next;
        });
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [draft.slug, checkSlug]);

  const update = <Key extends keyof OrganizationDraft>(
    key: Key,
    value: OrganizationDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = "Organization name is required";
    if (draft.slug.length < 2) {
      nextErrors.slug = "Slug must be at least 2 characters";
    }
    if (!/^[a-z0-9-]+$/.test(draft.slug)) {
      nextErrors.slug =
        "Slug can only contain lowercase letters, numbers and hyphens";
    }
    if (slugAvailable === false) {
      nextErrors.slug = "This slug is already taken";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    createOrganization({
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim() || undefined,
    });
  };

  const combinedErrors = { ...errors, ...fieldErrors };

  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          href="/organizations"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink-muted)] transition hover:text-[var(--vms-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Organizations
        </Link>

        <header className="mb-7">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            <Sparkles className="h-4 w-4" />
            Set up your workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Create your organization
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Start with your organization. Your plan and first property follow,
            and you choose that property&apos;s operating type when you create
            it.
          </p>
        </header>

        <SetupProgress currentStep="organization" />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
            {draftRestored ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 text-sm">
                <span className="font-medium text-[var(--vms-ink)]">
                  Draft restored from this browser.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(emptyDraft);
                    setDraftRestored(false);
                    setSlugAvailable(null);
                    window.localStorage.removeItem(DRAFT_KEY);
                  }}
                  className="text-xs font-semibold text-[var(--vms-action)] hover:underline"
                >
                  Start over
                </button>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-6">
              {error ? (
                <div
                  role="alert"
                  className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] px-4 py-3 text-sm text-[var(--vms-danger)]"
                >
                  {error}
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[var(--vms-ink)]"
                  >
                    Organization name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Harbour Operations"
                    value={draft.name}
                    onChange={(event) => update("name", event.target.value)}
                    error={combinedErrors.name}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-[var(--vms-ink)]"
                  >
                    Workspace URL
                  </label>
                  <div className="relative">
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="harbour-operations"
                      value={draft.slug}
                      onChange={(event) => {
                        update(
                          "slug",
                          event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        );
                        update("slugManuallyEdited", true);
                      }}
                      error={combinedErrors.slug}
                      disabled={isLoading}
                      aria-describedby="slug-help"
                    />
                    {isChecking ? (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[var(--vms-ink-muted)] motion-reduce:animate-none" />
                    ) : null}
                  </div>
                  <p
                    id="slug-help"
                    className="mt-2 truncate text-xs text-[var(--vms-ink-muted)]"
                  >
                    {draft.slug || "your-organization"}.
                    {process.env.NEXT_PUBLIC_BASE_DOMAIN || "yourdomain.com"}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[var(--vms-ink)]"
                >
                  Description{" "}
                  <span className="font-normal text-[var(--vms-ink-muted)]">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={draft.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  disabled={isLoading}
                  rows={4}
                  placeholder="What does this organization operate?"
                  className="mt-2 w-full resize-none rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2.5 text-base text-[var(--vms-ink)] outline-none focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--vms-focus)_20%,transparent)] sm:text-sm"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--vms-line)] pt-5 sm:flex-row sm:justify-end">
                <Link
                  href="/organizations"
                  className="inline-flex h-10 items-center justify-center rounded-[var(--vms-radius-control)] px-4 text-sm font-semibold text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    isChecking ||
                    slugCheckPending ||
                    slugAvailable === false
                  }
                >
                  {isLoading
                    ? "Creating organization…"
                    : isChecking || slugCheckPending
                      ? "Checking workspace URL…"
                      : "Continue to plan"}
                </Button>
              </div>
            </form>
          </section>

          <aside className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4">
              <NextStep
                number="1"
                title="Organization"
                detail="Set the organization identity and tenant URL."
                active
              />
              <NextStep
                number="2"
                title="Plan"
                detail="Choose the capabilities available to the organization."
              />
              <NextStep
                number="3"
                title="First workspace"
                detail="Open the management workspace and add the first property."
              />
            </ol>
            <div className="mt-5 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
              Your draft is kept in this browser until the organization is
              created.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function NextStep({
  number,
  title,
  detail,
  active = false,
}: {
  number: string;
  title: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
          active
            ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
            : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
        )}
      >
        {number}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
          {detail}
        </span>
      </span>
    </li>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1.5 text-xs text-[var(--vms-danger)]">
      {message}
    </p>
  ) : null;
}
