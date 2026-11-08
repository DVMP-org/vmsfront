"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Shield,
  X,
} from "lucide-react";
import { useAdminProfile } from "@/hooks/use-admin";
import { useVerifyToken } from "@/hooks/use-auth";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import {
  buildWorkspaceCards,
  workspaceAreaMeta,
  type WorkspaceArea,
  type WorkspaceCard,
} from "@/features/workspaces/catalog";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onToggleCollapse?: () => void;
  onMobileClose?: () => void;
}

export function WorkspaceSwitcher({
  collapsed = false,
  isMobile = false,
  onToggleCollapse,
  onMobileClose,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const setSelectedProperty = useAppStore(
    (state) => state.setSelectedProperty,
  );
  const admin = useAdminProfile();
  const currentUser = useVerifyToken();
  const workspaceContext = useWorkspaceContext();

  const adminProfile = admin.isError ? null : admin.data;
  const managementPlace = workspaceContext.data?.management?.is_administrator
    ? workspaceContext.data.management.authoritative_place
    : null;
  const cards = buildWorkspaceCards(
    adminProfile,
    currentUser.data?.workspaces || [],
    managementPlace,
  );
  const management = cards.find((card) => card.area === "management");
  const personalGroups = (["occupancy", "staff", "guest"] as WorkspaceArea[])
    .map((area) => ({
      area,
      cards: cards.filter((card) => card.area === area),
    }))
    .filter((group) => group.cards.length > 0);

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

  function chooseWorkspace(card: WorkspaceCard) {
    const place =
      card.area === "management" ? card.place : card.relationship?.place;
    setSelectedProperty(place ? { id: place.id, name: place.name } : null);
    setOpen(false);
    onMobileClose?.();
    router.push(card.href);
  }

  if (collapsed && !isMobile) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-3">
        <Link
          href="/select"
          aria-label="Switch workspace"
          className="grid h-10 w-10 place-items-center rounded-md border border-[#E5E7EB] bg-[#F5F7F8] text-[#1F2933] transition hover:bg-[#EEF1F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
        >
          <LayoutGrid className="h-4 w-4" />
        </Link>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-8 w-8 place-items-center rounded-md text-[#667280] transition hover:bg-[#EEF1F3] hover:text-[#1F2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative p-3" ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="place-workspace-switcher"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-[#E5E7EB] bg-[#F5F7F8] px-2.5 text-left transition hover:border-[#C7CDD3] hover:bg-[#EEF1F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[#1F2933] ring-1 ring-[#E5E7EB]">
            {management ? (
              <Shield className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667280]">
              Workspace
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-[#1F2933]">
              {selectedProperty?.name || "Choose a property"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[#667280] transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {!isMobile && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#667280] transition hover:bg-[#EEF1F3] hover:text-[#1F2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        {isMobile && onMobileClose ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-[#667280] transition hover:bg-[#EEF1F3] hover:text-[#1F2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id="place-workspace-switcher"
          className="absolute left-3 right-3 z-50 mt-2 max-h-[min(30rem,calc(100vh-8rem))] overflow-y-auto rounded-lg border border-[#DDE2E6] bg-white p-2 shadow-xl"
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667280]">
            Place-backed workspaces
          </p>

          {management ? (
            <button
              type="button"
              onClick={() => chooseWorkspace(management)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-md border-l-2 border-[#E85D3F] bg-[#F5F7F8] px-2 text-left transition hover:bg-[#EEF1F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
            >
              <Shield className="h-4 w-4 shrink-0 text-[#1F2933]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#1F2933]">
                  {management.title}
                </span>
                <span className="block truncate text-[10px] text-[#667280]">
                  {management.roleLabel}
                </span>
              </span>
            </button>
          ) : null}

          {personalGroups.map((group) => (
            <div key={group.area}>
              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667280]">
                {workspaceAreaMeta[group.area].title}
              </p>
              {group.cards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => chooseWorkspace(card)}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-[#596675]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#1F2933]">
                      {card.title}
                    </span>
                    <span className="block truncate text-[10px] text-[#667280]">
                      {card.roleLabel}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {!management && personalGroups.length === 0 ? (
            <p className="px-2 py-3 text-xs leading-5 text-[#667280]">
              No active place relationships were found in this organization.
            </p>
          ) : null}

          <div className="my-2 border-t border-[#E5E7EB]" />
          <Link
            href="/select"
            onClick={() => {
              setOpen(false);
              onMobileClose?.();
            }}
            className="flex min-h-11 items-center justify-between rounded-md px-2 text-xs font-semibold text-[#1F2933] transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
          >
            View all workspaces
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
