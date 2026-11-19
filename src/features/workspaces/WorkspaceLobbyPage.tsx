"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Home, Layers3, RefreshCw } from "lucide-react";
import { useAuth, useVerifyToken } from "@/hooks/use-auth";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";
import {
  useCurrentOrganization,
  useMyOrganizations,
} from "@/hooks/use-organization";
import { useAppStore } from "@/store/app-store";
import { getFullName } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";
import { WorkspaceLobbyHeader } from "@/components/layout/WorkspaceLobbyHeader";
import { LobbyWorkspaceCard } from "./LobbyWorkspaceCard";
import {
  buildLobbyWorkspaces,
  resolveLobbyWorkspaces,
  type LobbyWorkspace,
} from "./lobby";

function initials(name: string | null | undefined): string {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "VM";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function LobbySkeleton() {
  return (
    <div role="status" aria-label="Loading workspaces" className="space-y-5">
      <span className="sr-only">Loading workspaces</span>
      <div className="mx-auto h-9 w-72 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]" />
      <div className="mx-auto h-4 w-full max-w-md animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]" />
      <div className="mt-8 h-[92px] animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
      <div className="space-y-4 pt-4">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-[136px] animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]"
          />
        ))}
      </div>
    </div>
  );
}

function LobbyPanel({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-8 text-center sm:p-10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
        <Building2 className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--vms-ink-muted)]">
        {detail}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function WorkspaceLobbyPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const context = useVerifyToken();
  const { organization } = useCurrentOrganization();
  const { data: organizations = [] } = useMyOrganizations();
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  useRequireEmailVerification(true);

  const [allowPicker, setAllowPicker] = useState(false);
  const redirectedTo = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAllowPicker(params.get("lobby") === "1");
  }, []);

  const workspaces = useMemo(
    () =>
      context.data
        ? buildLobbyWorkspaces({ context: context.data, organization })
        : [],
    [context.data, organization],
  );
  const resolution = useMemo(
    () => resolveLobbyWorkspaces(workspaces),
    [workspaces],
  );
  const workspaceGroups = [
    {
      id: "organization-workspaces",
      title: "Organization",
      description: "Organization-wide administration and settings.",
      icon: Layers3,
      items: workspaces.filter(
        (workspace) => workspace.type === "organization",
      ),
    },
    {
      id: "site-workspaces",
      title: "Properties you manage",
      description: "Choose a property to open its operations.",
      icon: Building2,
      items: workspaces.filter((workspace) => workspace.type === "site_admin"),
    },
    {
      id: "place-workspaces",
      title: "My workspaces",
      description: "Access linked to your home, stay or business space.",
      icon: Home,
      items: workspaces.filter((workspace) => workspace.type === "party"),
    },
  ].filter((group) => group.items.length > 0);

  const openWorkspace = useCallback(
    (workspace: LobbyWorkspace) => {
      if (workspace.selection) {
        setSelectedSite(workspace.selection);
      }
      router.push(workspace.destination);
    },
    [router, setSelectedSite],
  );

  useEffect(() => {
    if (!context.isSuccess) return;
    // Read the URL directly: the redirect decision must not depend on a state
    // update that a later effect has not committed yet.
    const pickerRequested =
      new URLSearchParams(window.location.search).get("lobby") === "1";
    if (pickerRequested) return;
    if (resolution.kind !== "redirect") return;
    if (redirectedTo.current === resolution.workspace.id) return;
    redirectedTo.current = resolution.workspace.id;
    openWorkspace(resolution.workspace);
  }, [context.isSuccess, openWorkspace, resolution]);

  const redirecting =
    context.isSuccess && resolution.kind === "redirect" && !allowPicker;
  const canSwitchOrganization = organizations.length > 1;
  const credential = context.data?.user;
  const signedInName =
    getFullName(
      credential?.first_name,
      credential?.last_name,
      credential?.email || "",
    ) ||
    context.data?.party?.display_name ||
    "your account";
  const organizationName = organization?.name || "your organization";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--vms-canvas)] text-[var(--vms-ink)]"
      style={{
        backgroundImage:
          "radial-gradient(55rem 35rem at 105% 4%, color-mix(in srgb, var(--vms-coral-accent) 7%, transparent), transparent 72%), radial-gradient(43rem 30rem at -10% 100%, color-mix(in srgb, var(--vms-coral-accent) 5%, transparent), transparent 74%)",
      }}
    >
      <WorkspaceLobbyHeader canSwitchOrganization={canSwitchOrganization} />

      <main className="relative mx-auto w-full max-w-[1220px] flex-1 px-4 pb-12 pt-8 sm:px-8 sm:pt-9">
        {context.isPending || redirecting ? <LobbySkeleton /> : null}

        {context.isError && !context.isPending ? (
          <LobbyPanel
            title="Your workspaces could not be loaded"
            detail={parseApiError(context.error).message}
            action={
              <button
                type="button"
                onClick={() => context.refetch()}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] bg-[var(--vms-action)] px-4 text-sm font-semibold text-[var(--vms-on-action)] transition-colors hover:bg-[var(--vms-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            }
          />
        ) : null}

        {context.isSuccess && !redirecting ? (
          <div className="mx-auto w-full max-w-[980px]">
            <header className="text-center">
              <span
                aria-hidden="true"
                className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-[var(--vms-coral-accent)]"
              />
              <h1 className="text-[32px] font-semibold tracking-[-0.045em] sm:text-[40px] sm:leading-[1.1]">
                Choose your workspace
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)] sm:text-base">
                Continue to the workspace you need to manage your places, people
                and operations.
              </p>
            </header>

            <section aria-labelledby="available-workspaces" className="mt-7">
              <h2 id="available-workspaces" className="sr-only">
                Available workspaces
              </h2>

              {resolution.kind === "empty" ? (
                <div className="mt-4">
                  <LobbyPanel
                    title="No workspace access yet"
                    detail={`Your account has no active organization, site or place role in ${organizationName}. Ask an organization administrator to grant access.`}
                    action={
                      canSwitchOrganization ? (
                        <Link
                          href="/organizations"
                          className="inline-flex min-h-11 items-center justify-center rounded-[var(--vms-radius-control)] bg-[var(--vms-action)] px-4 text-sm font-semibold text-[var(--vms-on-action)] transition-colors hover:bg-[var(--vms-action-hover)]"
                        >
                          Change organization
                        </Link>
                      ) : null
                    }
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {workspaceGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                      <section key={group.id} aria-labelledby={group.id}>
                        <div className="mb-3 flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="grid size-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[color-mix(in_srgb,var(--vms-coral-accent)_10%,white)] text-[var(--vms-coral-accent)]"
                          >
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3
                              id={group.id}
                              className="text-lg font-semibold tracking-[-0.03em] leading-5"
                            >
                              {group.title}
                            </h3>
                            <p className="mt-0.5 text-xs leading-4 text-[var(--vms-ink-muted)] sm:text-sm">
                              {group.description}
                            </p>
                          </div>
                          <span className="hidden shrink-0 rounded-full bg-[var(--vms-surface-subtle)] px-3 py-1 text-xs text-[var(--vms-ink-muted)] sm:inline-flex">
                            {group.items.length}{" "}
                            {group.items.length === 1
                              ? "workspace"
                              : "workspaces"}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {group.items.map((workspace) => (
                            <li key={workspace.id}>
                              <LobbyWorkspaceCard
                                workspace={workspace}
                                emphasized={workspace.type === "organization"}
                                onOpen={openWorkspace}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </section>

            <footer className="mt-12 flex flex-col gap-3 border-t border-[var(--vms-line)] pt-6 text-sm text-[var(--vms-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Signed in as{" "}
                <span className="font-medium text-[var(--vms-ink)]">
                  {signedInName}
                </span>
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex min-h-11 items-center font-semibold text-[var(--vms-ink)] transition-colors hover:text-[var(--vms-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
              >
                Sign out
              </button>
            </footer>
          </div>
        ) : null}
      </main>
    </div>
  );
}
