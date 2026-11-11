"use client";

import { useEffect, useRef, useState, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  User,
  ChevronDown,
  Building2,
  CircleHelp,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { Button } from "../ui/Button";
import { cn, getFullName } from "@/lib/utils";
import { VmsWordmark } from "../brand/VmsBrand";
import { Avatar } from "../ui/Avatar";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { CommandNavigation } from "./CommandNavigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
  type: "resident" | "admin" | "select" | "auth";
}

export const Header = memo(function Header({
  onMenuClick,
  sidebarOpen,
  type,
}: HeaderProps) {
  const { user, logout } = useAuth();
  // Fetch user profile if authenticated but user data is missing (cross-subdomain support)
  const { data: profileData } = useProfile();
  const currentUser = user || profileData;

  const { organization } = useAppStore();
  const pathname = usePathname();
  const workspaceContext = useWorkspaceContext();
  const router = useRouter();

  const isAdminRoute = type == "admin" || pathname?.startsWith("/admin");
  const isOrganizationsIndex =
    pathname === "/organizations" ||
    pathname === "/organizations/" ||
    pathname?.startsWith("/organizations/") === true;
  const displayName = getFullName(
    currentUser?.first_name,
    currentUser?.last_name,
    currentUser?.email,
  );
  const commandProfile = useQuery({
    queryKey: ["command-profile", organization?.id, currentUser?.id],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: isAdminRoute && !!organization?.id && !!currentUser?.id,
    staleTime: 0,
  });
  const placeWorkspaceRoot = pathname?.match(/^\/workspace\/[^/]+/)?.[0];
  // One shared profile route; the shell follows where it was opened from.
  const profileHref = placeWorkspaceRoot
    ? `${placeWorkspaceRoot}/profile`
    : `/profile?context=${isAdminRoute ? "admin" : "resident"}`;
  const roleLabel = isAdminRoute ? "Administrator" : "Workspace member";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[var(--vms-ink)] text-white shadow-[var(--vms-shadow-raised)]">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="h-11 w-11 flex-shrink-0 p-0 text-white hover:bg-white/10 hover:text-white focus-visible:ring-[var(--vms-coral-accent)] lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            href="/organizations"
            aria-label="VMSCore organizations"
            className="shrink-0 items-center"
          >
            <VmsWordmark compact size="md" className="sm:hidden" />
            <VmsWordmark size="md" className="hidden sm:inline-flex" />
          </Link>
          {currentUser && !isOrganizationsIndex ? (
            <div className="hidden min-w-0 md:block">
              <OrganizationSwitcher />
            </div>
          ) : null}
        </div>

        {currentUser && isAdminRoute ? (
          <div className="flex min-w-0 flex-1 justify-center px-1 sm:max-w-[34rem] sm:px-3">
            <div className="w-full max-w-[29rem]">
              <CommandNavigation
                modules={workspaceContext.data?.modules || []}
                moduleGroups={workspaceContext.data?.module_groups || []}
                useCase={workspaceContext.data?.effective_use_case}
                canManage={
                  !!workspaceContext.data?.management?.is_administrator
                }
                role={
                  commandProfile.isFetchedAfterMount && !commandProfile.isError
                    ? commandProfile.data
                    : null
                }
                contextKey={`${organization?.id}:${currentUser?.id}:${pathname}`}
                navigate={(href) => router.push(href)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1" aria-hidden="true" />
        )}

        {currentUser && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <NotificationDropdown />
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex min-h-10 items-center gap-1 rounded-[var(--vms-radius-control)] px-1 text-sm font-medium text-white transition-colors duration-[var(--vms-motion)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-coral-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vms-ink)]"
                id="profile_dropdown_button"
                aria-expanded={menuOpen}
                aria-label={`Open account menu for ${getFullName(
                  currentUser.first_name,
                  currentUser.last_name,
                  currentUser.email,
                )}`}
              >
                <Avatar
                  name={displayName}
                  size="sm"
                  tone="coral"
                  decorative
                  className="ring-2 ring-white/20"
                />
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-white/60 transition",
                    menuOpen && "rotate-180 text-white",
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-1.5rem)] rounded-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 text-sm text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)] sm:w-64">
                  <div className="mb-2 flex items-center gap-3 border-b border-[var(--vms-line)] px-2 py-3">
                    <Avatar name={displayName} size="md" tone="coral" />
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {getFullName(
                          currentUser.first_name,
                          currentUser.last_name,
                          currentUser.email,
                        )}
                      </span>
                      <span className="text-xs text-[var(--vms-ink-muted)]">
                        {currentUser.email}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <MenuAction
                    icon={User}
                    label="Account settings"
                    onClick={() => {
                      router.push(profileHref);
                      setMenuOpen(false);
                    }}
                    description="Profile, security and preferences"
                  />
                  <MenuAction
                    icon={CircleHelp}
                    label="Help & support"
                    onClick={() => {
                      window.location.href = "mailto:support@vmscore.to";
                      setMenuOpen(false);
                    }}
                    description="Get help with your workspace"
                  />
                  {!isOrganizationsIndex ? (
                    <MenuAction
                      icon={Building2}
                      label="Switch organization"
                      onClick={() => {
                        router.push("/organizations");
                        setMenuOpen(false);
                      }}
                      description="Open another organization"
                    />
                  ) : null}
                  <div className="my-2 border-t border-[var(--vms-line)]" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-[var(--vms-radius-control)] px-2 text-[var(--vms-danger)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-danger-subtle)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
});

const MenuAction = memo(function MenuAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-start gap-3 rounded-[var(--vms-radius-control)] px-2 py-2 text-left transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--vms-ink)]">{label}</p>
        <p className="text-xs text-[var(--vms-ink-muted)]">{description}</p>
      </div>
    </button>
  );
});
