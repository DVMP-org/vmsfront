"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { SetupProgress } from "@/components/onboarding/SetupProgress";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { type Site, type SiteInput, sitesApi } from "@/features/sites/api";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";

export default function FirstPlaceSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const { organization, currentSlug, isPending, isError, refetch } =
    useCurrentOrganization();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsFirstPlace = organization?.needs_first_site === true;

  useEffect(() => {
    if (!isPending && organization && !needsFirstPlace) {
      router.replace("/?lobby=1");
    }
  }, [isPending, needsFirstPlace, organization, router]);

  const mutation = useMutation({
    mutationFn: (body: SiteInput) => sitesApi.create(body),
    onSuccess: (saved: Site) => {
      setSelectedProperty(saved);
      if (currentSlug) {
        queryClient.setQueryData(
          ["organization", currentSlug],
          organization
            ? {
                ...organization,
                needs_first_site: false,
              }
            : undefined,
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success(`${saved.name} is ready.`);
      router.replace("/?lobby=1&setup=complete");
    },
  });

  const serverError = mutation.error
    ? parseApiError(mutation.error).message
    : "";

  const useCaseLabel = useMemo(
    () =>
      organization?.use_case
        ? organization.use_case.replaceAll("_", " ")
        : "Organization default",
    [organization?.use_case],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors["first-place-name"] = "Enter a Site name.";
    if (!adminEmail.trim()) {
      nextErrors["first-place-admin-email"] =
        "Enter the Site administrator email.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    mutation.mutate({
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
      admin_email: adminEmail.trim(),
      admin_name: adminName.trim() || null,
      admin_phone: adminPhone.trim() || null,
      parent_site_id: null,
      use_case: organization?.use_case || null,
    });
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
        <Header type="select" />
        <main
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
          role="status"
          aria-label="Loading first-place setup"
        >
          <div className="h-5 w-32 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
          <div className="mt-5 h-10 w-80 max-w-full animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
          <div className="mt-8 h-16 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)]" />
          <div className="mt-6 h-[34rem] animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)]" />
        </main>
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
        <Header type="select" />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <InlineAlert
            tone="danger"
            title="Setup context is unavailable"
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            We could not load the organization that is waiting for its first
            Site.
          </InlineAlert>
        </main>
      </div>
    );
  }

  if (!needsFirstPlace) {
    return (
      <div className="min-h-screen bg-[var(--vms-canvas)]">
        <Header type="select" />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <InlineAlert
            tone="success"
            title="Your organization already has a Site"
            action={
              <Button asChild size="sm">
                <Link href="/?lobby=1">Open Workspaces</Link>
              </Button>
            }
          >
            First-Site setup is complete. Choose a permitted workspace to
            continue.
          </InlineAlert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          href="/plans?setup=first-workspace"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink-muted)] transition hover:text-[var(--vms-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plan
        </Link>

        <header className="mb-7">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            <Sparkles className="h-4 w-4" />
            Set up your operating workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Create your first Site
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Your plan is active. Add the top-level Site and its administrator
            before entering a management workspace.
          </p>
        </header>

        <SetupProgress currentStep="workspace" />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
            <div className="border-b border-[var(--vms-line)] p-5 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                {organization.name}
              </p>
              <h2 className="mt-1 text-xl font-semibold">Site identity</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                Start with the Site that operators recognize. You can add
                Places, buildings, units and rooms after this step.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5 p-5 sm:p-7" noValidate>
              <FormErrorSummary errors={errors} />
              {serverError ? (
                <InlineAlert tone="danger" title="First Site was not created">
                  {serverError}
                </InlineAlert>
              ) : null}

              <FormSection
                title="Core details"
                description="These details identify the first Site across the organization."
              >
                <Field
                  id="first-place-name"
                  label="Site name"
                  description="The name shown in the workspace switcher and Site register."
                  required
                  error={errors["first-place-name"]}
                >
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setErrors({});
                      }}
                      placeholder="e.g. Harbour Court"
                      autoComplete="organization"
                      autoFocus
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>

                <Field
                  id="first-place-address"
                  label="Address"
                  description="Street, building and locality used by operators."
                >
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="e.g. 19 Marina Road, Lagos"
                      autoComplete="street-address"
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>

                <Field
                  id="first-place-description"
                  label="Description"
                  description="Optional operational context for this Site."
                >
                  {(control) => (
                    <textarea
                      {...control}
                      className={fieldControlClassName}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="What does this Site operate?"
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>
              </FormSection>

              <FormSection
                title="Site administrator"
                description="We create or reuse the administrator User, grant Site management authority and send onboarding when required. No Place Party relationship is created."
              >
                <Field
                  id="first-place-admin-email"
                  label="Administrator email"
                  required
                  error={errors["first-place-admin-email"]}
                >
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={adminEmail}
                      onChange={(event) => {
                        setAdminEmail(event.target.value);
                        setErrors({});
                      }}
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>
                <Field id="first-place-admin-name" label="Administrator name">
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      autoComplete="name"
                      value={adminName}
                      onChange={(event) => setAdminName(event.target.value)}
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>
                <Field id="first-place-admin-phone" label="Phone number">
                  {(control) => (
                    <input
                      {...control}
                      className={fieldControlClassName}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={adminPhone}
                      onChange={(event) => setAdminPhone(event.target.value)}
                      disabled={mutation.isPending}
                    />
                  )}
                </Field>
              </FormSection>

              <dl className="grid gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-[var(--vms-ink-muted)]">
                    Structure
                  </dt>
                  <dd className="mt-1 font-semibold">Top-level Site</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--vms-ink-muted)]">
                    Operating context
                  </dt>
                  <dd className="mt-1 font-semibold capitalize">
                    {useCaseLabel}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" asChild>
                  <Link href="/plans?setup=first-workspace">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={
                    mutation.isPending || !name.trim() || !adminEmail.trim()
                  }
                  aria-busy={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {mutation.isPending ? "Creating Site…" : "Create first Site"}
                  {!mutation.isPending ? (
                    <ArrowRight className="h-4 w-4" />
                  ) : null}
                </Button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
              <h2 className="text-base font-semibold">What happens next</h2>
              <ol className="mt-4 space-y-4">
                <SetupFact
                  index="1"
                  title="Organization"
                  detail={`${organization.name} is configured.`}
                />
                <SetupFact
                  index="2"
                  title="Plan"
                  detail="The selected plan is active."
                />
                <SetupFact
                  index="3"
                  title="First Site"
                  detail="Create the Site that owns management context."
                  current
                />
              </ol>
            </section>

            <InlineAlert tone="info" title="Management stays Site-scoped">
              Organization membership does not create a management workspace.
              Work modes appear only after this Site exists and access is
              assigned.
            </InlineAlert>

            <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-[var(--vms-action)]" />
                Canonical hierarchy
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                This first record is a site. Add buildings, units, rooms or
                spaces from the Site workspace after setup.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SetupFact({
  index,
  title,
  detail,
  current = false,
}: {
  index: string;
  title: string;
  detail: string;
  current?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={
          current
            ? "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--vms-coral-soft)] text-xs font-semibold text-[var(--vms-focus)]"
            : "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--vms-success-subtle)] text-[var(--vms-success)]"
        }
      >
        {current ? index : <CheckCircle2 className="h-3.5 w-3.5" />}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
          {detail}
        </span>
      </span>
    </li>
  );
}
