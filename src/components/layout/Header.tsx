"use client";

import { useEffect, useRef, useState, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  Settings,
  User,
  ChevronDown,
  ChevronsUpDown,
  Building2,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { Button } from "../ui/Button";
import { cn, getFullName, getInitials } from "@/lib/utils";
import { LogoFull } from "../LogoFull";
import { useAdminProfile } from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { CommandNavigation } from "./CommandNavigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { hasAdminPermission } from "@/lib/permissions";
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
  const { data: profileData, isLoading: isProfileLoading } = useProfile();
  const currentUser = user || profileData;

  const { organization } = useAppStore();
  const pathname = usePathname();
  const workspaceContext = useWorkspaceContext();
  const router = useRouter();

  const isAdminRoute = type == "admin" || pathname?.startsWith("/admin");
  const isResidencyRoute =
    type == "resident" || pathname?.startsWith("/residency");
  const isSelectRoute = type == "select" || pathname?.startsWith("/select");
  const isAdminUser = useAdminProfile();
  const commandProfile = useQuery({
    queryKey: ["command-profile", organization?.id, currentUser?.id],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled: isAdminRoute && !!organization?.id && !!currentUser?.id,
    staleTime: 0,
  });
  const profileHref = isAdminUser ? "/admin/profile" : "/resident/profile";
  const dashboardHref = "/select";
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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#1F2933] text-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="h-11 w-11 flex-shrink-0 p-0 text-white hover:bg-white/10 hover:text-white focus-visible:ring-[#E85D3F] lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            href="/organizations"
            aria-label="VMSCore organizations"
            className="hidden shrink-0 items-center sm:flex"
          >
            <LogoFull width={88} height={30} color="#FFFFFF" />
          </Link>
          {currentUser ? (
            <div className="hidden min-w-0 sm:block">
              <OrganizationSwitcher />
            </div>
          ) : null}
        </div>

        {currentUser && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isAdminRoute && (
              <CommandNavigation
                modules={workspaceContext.data?.modules || []}
                moduleGroups={workspaceContext.data?.module_groups || []}
                canManage={
                  !!workspaceContext.data?.management?.is_administrator ||
                  hasAdminPermission(commandProfile.data, [
                    "parties.create",
                    "place_relationships.create",
                  ])
                }
                role={
                  commandProfile.isFetchedAfterMount && !commandProfile.isError
                    ? commandProfile.data
                    : null
                }
                contextKey={`${organization?.id}:${currentUser?.id}:${pathname}`}
                navigate={(href) => router.push(href)}
              />
            )}
            <div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <NotificationDropdown />
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D3F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F2933] sm:gap-2 sm:px-3"
                id="profile_dropdown_button"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E85D3F] text-[10px] font-bold text-white sm:hidden">
                  {getInitials(currentUser.first_name, currentUser.last_name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="max-w-[120px] truncate text-[12px] font-semibold text-white xl:max-w-none">
                    {getFullName(
                      currentUser.first_name,
                      currentUser.last_name,
                      currentUser.email,
                    )}
                  </span>
                  {!isSelectRoute && (
                    <span className="text-[9px] uppercase text-white/55">
                      {isAdminUser ? "Admin" : "Resident"}
                    </span>
                  )}
                </div>
                <ChevronsUpDown
                  className={cn(
                    "h-4 w-4 text-white/60 transition sm:h-5 sm:w-5",
                    menuOpen && "rotate-180 text-white",
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-1.5rem)] rounded-lg border border-[#DDE2E6] bg-white p-2 text-sm text-[#1F2933] shadow-xl sm:w-64">
                  <div className="mb-2 flex items-center gap-3 border-b border-[#E5E7EB] px-2 py-3 sm:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E85D3F] font-bold text-white">
                      {getInitials(
                        currentUser.first_name,
                        currentUser.last_name,
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {getFullName(
                          currentUser.first_name,
                          currentUser.last_name,
                          currentUser.email,
                        )}
                      </span>
                      <span className="text-xs text-[#667280]">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                  <MenuAction
                    icon={User}
                    label="Profile settings"
                    onClick={() => {
                      router.push(profileHref);
                      setMenuOpen(false);
                    }}
                    description={currentUser.email}
                  />
                  <MenuAction
                    icon={Settings}
                    label="Dashboard preferences"
                    onClick={() => {
                      router.push(dashboardHref);
                      setMenuOpen(false);
                    }}
                    description="Your dashboard prefs"
                  />
                  <MenuAction
                    icon={Building2}
                    label="Switch organization"
                    onClick={() => {
                      router.push("/organizations");
                      setMenuOpen(false);
                    }}
                    description="Open another organization"
                  />
                  <div className="my-2 border-t border-[#E5E7EB]" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-[#B42318] transition hover:bg-[#FEF0EE]"
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
      className="flex min-h-11 w-full items-start gap-3 rounded-md px-2 py-2 text-left transition hover:bg-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8402A]"
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1F3] text-[#1F2933]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1F2933]">{label}</p>
        <p className="text-xs text-[#667280]">{description}</p>
      </div>
    </button>
  );
});
