"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SetupProgress } from "@/components/onboarding/SetupProgress";
import { contextApi, type UseCase } from "@/features/context/api";
import {
  generateSlugFromName,
  useCheckSlugAvailability,
  useCreateOrganization,
} from "@/hooks/use-organization";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "organization-create-draft-v1";

interface OrganizationDraft {
  name: string;
  slug: string;
  description: string;
  use_case: UseCase | "";
  slugManuallyEdited: boolean;
}

const emptyDraft: OrganizationDraft = {
  name: "",
  slug: "",
  description: "",
  use_case: "",
  slugManuallyEdited: false,
};

export default function CreateOrganizationPage() {
  const [draft, setDraft] = useState<OrganizationDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const catalog = useQuery({
    queryKey: ["context-catalog"],
    queryFn: contextApi.catalog,
    retry: false,
  });
  const { createOrganization, isLoading, error, fieldErrors } =
    useCreateOrganization({
      redirectTo: "/plans?setup=first-workspace",
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
      if (
        restored.name ||
        restored.slug ||
        restored.description ||
        restored.use_case
      ) {
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
    const timeout = window.setTimeout(async () => {
      if (draft.slug.length >= 2) {
        setSlugAvailable(await checkSlug(draft.slug));
      } else {
        setSlugAvailable(null);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
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
    if (!draft.use_case) nextErrors.use_case = "Choose an operating use case";
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
      use_case: draft.use_case as UseCase,
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim() || undefined,
    });
  };

  const combinedErrors = { ...errors, ...fieldErrors };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-background dark:text-zinc-50">
      <Header type="select" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          href="/organizations"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Organizations
        </Link>

        <header className="mb-7">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--brand-primary,#213928))] dark:text-emerald-300">
            <Sparkles className="h-4 w-4" />
            Set up your operating workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Create your organization
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Start with the operating model. Your plan and first property
            workspace follow, and your setup remains available if you need to
            return.
          </p>
        </header>

        <SetupProgress currentStep="organization" />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
            {draftRestored ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[rgb(var(--brand-primary,#213928)/0.06)] px-4 py-3 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
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
                  className="text-xs font-semibold text-[rgb(var(--brand-primary,#213928))] hover:underline dark:text-emerald-300"
                >
                  Start over
                </button>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-6">
              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                >
                  {error}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="use_case"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Operating use case
                </label>
                <select
                  id="use_case"
                  value={draft.use_case}
                  onChange={(event) =>
                    update("use_case", event.target.value as UseCase | "")
                  }
                  disabled={isLoading}
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Choose your organization’s use case</option>
                  {catalog.data?.use_cases.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  This is fixed at creation and determines the available
                  modules. Mixed use allows properties with distinct contexts.
                </p>
                {catalog.isError ? (
                  <button
                    type="button"
                    onClick={() => catalog.refetch()}
                    className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300"
                  >
                    Could not load use cases. Retry
                  </button>
                ) : null}
                <FieldError message={combinedErrors.use_case} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-zinc-400" />
                    ) : null}
                  </div>
                  <p
                    id="slug-help"
                    className="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {draft.slug || "your-organization"}.
                    {process.env.NEXT_PUBLIC_BASE_DOMAIN || "yourdomain.com"}
                  </p>
                  <FieldError message={combinedErrors.slug} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Description{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
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
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:flex-row sm:justify-end">
                <Link
                  href="/organizations"
                  className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading || slugAvailable === false}
                >
                  {isLoading ? "Creating organization…" : "Continue to plan"}
                </Button>
              </div>
            </form>
          </section>

          <aside className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4">
              <NextStep
                number="1"
                title="Organization"
                detail="Set the operating model and tenant URL."
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
            <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
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
            ? "bg-[rgb(var(--brand-primary,#213928))] text-white"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
        )}
      >
        {number}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {detail}
        </span>
      </span>
    </li>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  ) : null;
}
