"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { getFullName } from "@/lib/utils";
import { VmsWordmark } from "../brand/VmsBrand";
import { Avatar } from "../ui/Avatar";
import { NotificationDropdown } from "./NotificationDropdown";

export function WorkspaceLobbyHeader({
  canSwitchOrganization = false,
}: {
  canSwitchOrganization?: boolean;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const currentUser = user || profile;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = getFullName(
    currentUser?.first_name,
    currentUser?.last_name,
    currentUser?.email,
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[var(--vms-ink)] text-white shadow-[var(--vms-shadow-raised)]">
      <div className="mx-auto flex h-14 w-full max-w-[1220px] items-center justify-between gap-3 px-4 sm:px-8">
        <Link
          href="/"
          aria-label="VMS Core workspace lobby"
          className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-coral-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vms-ink)]"
        >
          <VmsWordmark size="md" />
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
            <NotificationDropdown />
          </div>

          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={`Open account menu for ${displayName}`}
                className="flex min-h-10 items-center gap-1 rounded-[var(--vms-radius-control)] px-1 text-sm font-medium text-white transition-colors duration-[var(--vms-motion)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-coral-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vms-ink)]"
              >
                <Avatar
                  name={displayName}
                  size="sm"
                  tone="coral"
                  decorative
                  className="ring-2 ring-white/20"
                />
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/60 transition ${
                    menuOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-[calc(100vw-1.5rem)] rounded-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 text-sm text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)] sm:w-64"
                >
                  <div className="mb-2 flex items-center gap-3 border-b border-[var(--vms-line)] px-2 py-3">
                    <Avatar name={displayName} size="md" tone="coral" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[var(--vms-radius-control)] px-2 text-left transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                  >
                    <User className="h-4 w-4" />
                    Account settings
                  </button>

                  {canSwitchOrganization ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/organizations");
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-[var(--vms-radius-control)] px-2 text-left transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                      <Building2 className="h-4 w-4" />
                      Switch organization
                    </button>
                  ) : null}

                  <div className="my-2 border-t border-[var(--vms-line)]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[var(--vms-radius-control)] px-2 text-left text-[var(--vms-danger)] transition-colors hover:bg-[var(--vms-danger-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
