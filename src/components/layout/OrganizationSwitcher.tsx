"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  useCurrentOrganization,
  useMyOrganizations,
} from "@/hooks/use-organization";
import { buildSubdomainUrl } from "@/lib/subdomain-utils";
import { cn } from "@/lib/utils";

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { organization } = useCurrentOrganization();
  const { data: organizations = [], isLoading } = useMyOrganizations();
  const otherOrganizations = organizations.filter(
    (item) => item.id !== organization?.id,
  );

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function switchOrganization(slug: string) {
    setOpen(false);
    window.location.assign(buildSubdomainUrl(slug, "/organization"));
  }

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="global-organization-switcher"
        className="flex h-10 max-w-[260px] items-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-2.5 text-left text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D3F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F2933]"
      >
        <OrganizationMark
          name={organization?.name}
          logoUrl={organization?.logo_url}
        />
        <span className="hidden min-w-0 flex-1 sm:block">
          <span className="block truncate text-xs font-semibold">
            {organization?.name || "Choose organization"}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-white/60">
            {organization?.slug || "Organization"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-white/60 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id="global-organization-switcher"
          className="absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[#DDE2E6] bg-white p-2 text-[#1F2933] shadow-xl"
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667280]">
            Current organization
          </p>
          <div className="flex items-center gap-2.5 rounded-md bg-[#F5F7F8] px-2.5 py-2">
            <OrganizationMark
              name={organization?.name}
              logoUrl={organization?.logo_url}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {organization?.name || "Organization"}
            </span>
            <Check className="h-4 w-4 text-[#137A4B]" aria-label="Selected" />
          </div>

          {isLoading ? (
            <p role="status" className="px-2 py-3 text-xs text-[#667280]">
              Loading organizations…
            </p>
          ) : null}

          {otherOrganizations.length > 0 ? (
            <>
              <p className="px-2 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667280]">
                Switch organization
              </p>
              <div className="space-y-0.5">
                {otherOrganizations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchOrganization(item.slug)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
                  >
                    <OrganizationMark
                      name={item.name}
                      logoUrl={item.logo_url}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="my-2 border-t border-[#E5E7EB]" />
          <Link
            href="/organizations"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />
            All organizations
          </Link>
          <Link
            href="/organizations/create"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add organization
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function OrganizationMark({
  name,
  logoUrl,
}: {
  name?: string | null;
  logoUrl?: string | null;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-white/20"
      />
    );
  }

  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#E85D3F] text-[10px] font-bold text-white">
      {initials(name || "Organization")}
    </span>
  );
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "O"
  );
}
