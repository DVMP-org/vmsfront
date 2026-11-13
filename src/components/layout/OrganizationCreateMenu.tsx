"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, UserCog, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { hasAdminPermission } from "@/lib/permissions";

interface OrganizationCreateMenuProps {
  permissions?: string[] | null;
}

const createActions = [
  {
    label: "Site",
    description: "Add an operating boundary",
    href: "/organization/sites?create=site",
    permission: "places.create",
    icon: Building2,
  },
  {
    label: "Site manager",
    description: "Assign local management authority",
    href: "/organization/managers?create=manager",
    permission: "admins.create",
    icon: UserCog,
  },
  {
    label: "Organization administrator",
    description: "Grant organization-level access",
    href: "/organization/administrators?create=administrator",
    permission: "admins.create",
    icon: UserPlus,
  },
] as const;

export function OrganizationCreateMenu({
  permissions,
}: OrganizationCreateMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const actions = useMemo(
    () =>
      createActions.filter((action) =>
        hasAdminPermission(
          permissions ? { effective_permissions: permissions } : null,
          action.permission,
        ),
      ),
    [permissions],
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Create a resource"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) requestAnimationFrame(() => firstItemRef.current?.focus());
        }}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full text-white/80 transition-[background-color,color,transform] duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-coral-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vms-ink)] motion-reduce:transition-none",
          open && "bg-white/15 text-white",
        )}
      >
        <Plus
          className={cn(
            "h-5 w-5 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-45",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Create a resource"
          className="fixed left-3 right-3 top-[3.75rem] z-50 max-h-[calc(100dvh-4.5rem)] w-auto origin-top-right animate-[vms-menu-in_160ms_cubic-bezier(0.22,1,0.36,1)] overflow-y-auto rounded-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)] motion-reduce:animate-none sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(22rem,calc(100vw-1.5rem))] sm:overflow-hidden"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
              Create
            </p>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              Start a new organization resource
            </p>
          </div>
          <div className="border-t border-[var(--vms-line)] pt-1.5">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  ref={index === 0 ? firstItemRef : undefined}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    router.push(action.href);
                  }}
                  className="group flex min-h-14 w-full items-center gap-3 rounded-[var(--vms-radius-control)] px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] motion-reduce:transition-none"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] transition-colors duration-150 group-hover:border-[var(--vms-ink)] group-hover:text-[var(--vms-ink)] motion-reduce:transition-none">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {action.label}
                    </span>
                    <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
                      {action.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
