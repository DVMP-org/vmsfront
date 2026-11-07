"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCurrentOrganization,
  useMyOrganizations,
} from "@/hooks/use-organization";
import { useAuthStore } from "@/store/auth-store";
import { buildSubdomainUrl } from "@/lib/subdomain-utils";

interface SidebarOrganizationHeaderProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function SidebarOrganizationHeader({
  collapsed = false,
  onToggleCollapse,
  onMobileClose,
  isMobile = false,
}: SidebarOrganizationHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const { data: organizations, isLoading } = useMyOrganizations();
  const user = useAuthStore((state) => state.user);
  const otherOrganizations =
    organizations?.filter((item) => item.slug !== organization?.slug) || [];

  const switchOrganization = (slug: string) => {
    window.location.href = buildSubdomainUrl(slug, "/admin");
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-3">
        <button
          type="button"
          onClick={() => {
            onToggleCollapse?.();
            setIsExpanded(true);
          }}
          className="relative rounded-xl transition hover:ring-2 hover:ring-[rgb(var(--brand-primary,#213928)/0.2)]"
          aria-label={`Open ${organization?.name || "organization"} switcher`}
        >
          <OrganizationLogo
            name={organization?.name}
            logoUrl={organization?.logo_url}
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
        </button>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative p-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          aria-controls="organization-switcher-panel"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition",
            isExpanded
              ? "border-[rgb(var(--brand-primary,#213928)/0.25)] bg-[rgb(var(--brand-primary,#213928)/0.06)]"
              : "border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60",
          )}
        >
          <div className="relative shrink-0">
            <OrganizationLogo
              name={organization?.name}
              logoUrl={organization?.logo_url}
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {organization?.name || "Organization"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {user?.email || "Signed in"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        {!isMobile && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        {isMobile && onMobileClose ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            id="organization-switcher-panel"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Current organization
              </p>
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-800/70">
                <OrganizationLogo
                  name={organization?.name}
                  logoUrl={organization?.logo_url}
                  size="small"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {organization?.name || "Organization"}
                </span>
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>

              {isLoading ? (
                <p className="px-2 py-2 text-xs text-zinc-500">
                  Loading organizations…
                </p>
              ) : null}
              {otherOrganizations.length ? (
                <>
                  <p className="px-2 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Switch organization
                  </p>
                  <div className="space-y-0.5">
                    {otherOrganizations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => switchOrganization(item.slug)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <OrganizationLogo
                          name={item.name}
                          logoUrl={item.logo_url}
                          size="small"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => router.push("/organizations/new")}
                className="mt-2 flex w-full items-center gap-2.5 rounded-lg border border-dashed border-zinc-300 px-2 py-2 text-sm font-medium text-zinc-600 transition hover:border-[rgb(var(--brand-primary,#213928)/0.35)] hover:bg-[rgb(var(--brand-primary,#213928)/0.04)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                Add organization
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function OrganizationLogo({
  name,
  logoUrl,
  size = "default",
}: {
  name?: string | null;
  logoUrl?: string | null;
  size?: "default" | "small";
}) {
  const dimensions = size === "small" ? "h-7 w-7" : "h-10 w-10";
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || "Organization"}
        className={cn(
          dimensions,
          "rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700",
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        dimensions,
        "grid place-items-center rounded-lg bg-[rgb(var(--brand-primary,#213928))] text-white",
      )}
    >
      <Building2 className={size === "small" ? "h-3.5 w-3.5" : "h-5 w-5"} />
    </span>
  );
}
