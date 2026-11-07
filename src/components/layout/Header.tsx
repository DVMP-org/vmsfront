"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Home,
  Building2,
  LogOut,
  Settings,
  User,
  ChevronDown,
  ChevronsUpDown,
  Bell,
  Shield,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { Button } from "../ui/Button";
import { cn, getFullName, getInitials } from "@/lib/utils";
import { LogoFull } from "../LogoFull";
import { useResidentDashboardSelect } from "@/hooks/use-resident";
import { useAdminProfile } from "@/hooks/use-admin";
import { useVerifyToken } from "@/hooks/use-auth";
import {
  buildWorkspaceCards,
  workspaceAreaMeta,
  type WorkspaceArea,
  type WorkspaceCard,
} from "@/features/workspaces/catalog";
import { motion, AnimatePresence } from "framer-motion";
import type { Residency } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { CommandNavigation } from "./CommandNavigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { hasAdminPermission } from "@/lib/permissions";

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

  const { selectedResidency, branding, organization } = useAppStore();
  const { data: activeTheme } = useActiveBrandingTheme();
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
  const profileHref = isAdminUser ? "/admin/profile" : "resident/profile";
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

  const logoUrl = useMemo(() => {
    if (!activeTheme) return null;
    return activeTheme.logo_url;
  }, [activeTheme]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#dce3ee] bg-white/95 shadow-[0_1px_2px_rgba(15,27,49,0.04)] backdrop-blur">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 p-0 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {isSelectRoute ? (
              <Link
                href="/"
                aria-label="VMSCore home"
                className="flex items-center text-[#0f1b31]"
              >
                <LogoFull width={92} height={34} color="#0f1b31" />
              </Link>
            ) : null}
            {!isSelectRoute && currentUser && (
              <WorkspaceSwitcher
                selectedResidency={selectedResidency}
                isAdminRoute={isAdminRoute}
              />
            )}
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1 sm:gap-2">
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
            <NotificationDropdown />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:px-3 sm:py-2"
                id="profile_dropdown_button"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))] text-[10px] font-bold sm:hidden">
                  {getInitials(currentUser.first_name, currentUser.last_name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[12px] font-semibold text-foreground truncate max-w-[120px] xl:max-w-none">
                    {getFullName(
                      currentUser.first_name,
                      currentUser.last_name,
                      currentUser.email,
                    )}
                  </span>
                  {!isSelectRoute && (
                    <span className="text-[9px] uppercase text-muted-foreground">
                      {isAdminUser ? "Admin" : "Resident"}
                    </span>
                  )}
                </div>
                <ChevronsUpDown
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition",
                    menuOpen && "rotate-180 text-foreground",
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-64 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl p-3 text-sm shadow-2xl z-50 ring-1 ring-black/5">
                  <div className="flex items-center gap-3 px-2 py-3 border-b border-border/40 mb-2 sm:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))] font-bold">
                      {getInitials(
                        currentUser.first_name,
                        currentUser.last_name,
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">
                        {getFullName(
                          currentUser.first_name,
                          currentUser.last_name,
                          currentUser.email,
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
                  <div className="border-t border-border/60 my-2" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-destructive transition hover:bg-muted/50"
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
      className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted/50"
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
});

function WorkspaceSwitcher({
  selectedResidency,
  isAdminRoute,
}: {
  selectedResidency: Residency | null;
  isAdminRoute?: boolean | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const {
    setSelectedResidency,
    selectedProperty,
    setSelectedProperty,
    organization,
  } = useAppStore();

  const { data: dashboardData } = useResidentDashboardSelect(!isAdminRoute);
  const { data: adminProfile, isError: isAdminError } = useAdminProfile();
  const currentContext = useVerifyToken();

  const residencies = dashboardData?.residencies ?? [];
  const isAdmin = !!adminProfile && !isAdminError;
  const workspaceCards = buildWorkspaceCards(
    isAdmin ? adminProfile : null,
    currentContext.data?.workspaces || [],
  );
  const managementWorkspace = workspaceCards.find(
    (card) => card.area === "management",
  );
  const personalWorkspaces = workspaceCards.filter(
    (card) => card.area !== "management",
  );
  const personalGroups = (["occupancy", "staff", "guest"] as WorkspaceArea[])
    .map((area) => ({
      area,
      cards: personalWorkspaces.filter((card) => card.area === area),
    }))
    .filter((group) => group.cards.length > 0);

  const currentWorkspaceName = isAdminRoute
    ? selectedProperty?.name || "Management workspace"
    : selectedResidency?.name || "Select Estate";

  const currentWorkspaceIcon = isAdminRoute ? (
    <Shield className="h-4 w-4 text-indigo-600" />
  ) : (
    <Building2 className="h-4 w-4 text-[rgb(var(--brand-primary,#213928))]" />
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const handleSwitch = (residency: Residency | null) => {
    if (residency) {
      setSelectedResidency(residency);
      router.push(`/residency/${residency.id}`);
    } else {
      setSelectedResidency(null);
      router.push("/admin");
    }
    setOpen(false);
  };

  const handleWorkspaceSwitch = (card: WorkspaceCard) => {
    if (card.area === "management") {
      setSelectedProperty(null);
    } else if (card.relationship) {
      setSelectedProperty({
        id: card.relationship.place.id,
        name: card.relationship.place.name,
      });
    }
    setOpen(false);
    router.push(card.href);
  };

  return (
    <div className="relative" ref={switcherRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 max-w-[240px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
          open &&
            "border-indigo-300 ring-2 ring-indigo-100 dark:border-indigo-700 dark:ring-indigo-950",
        )}
      >
        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-background shadow-sm border border-border/40">
          {currentWorkspaceIcon}
        </div>
        <span className="hidden md:block text-xs font-bold text-foreground truncate max-w-[100px] xl:max-w-[150px]">
          {currentWorkspaceName}
        </span>
        <span className="hidden sm:block md:hidden text-[10px] font-bold text-foreground truncate max-w-[80px]">
          {currentWorkspaceName}
        </span>
        <ChevronsUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Organization / Property / Workspace
              </p>
            </div>

            <div className="space-y-1 max-h-[360px] overflow-y-auto custom-scrollbar">
              {isAdminRoute ? (
                <>
                  <div className="px-2 pb-0.5 pt-1">
                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                      Organization
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 px-3 py-2">
                    <p className="truncate text-sm font-semibold">
                      {organization?.name || "Current organization"}
                    </p>
                    <Link
                      href="/organizations"
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-flex text-[11px] font-semibold underline"
                    >
                      Switch organization
                    </Link>
                  </div>
                  {managementWorkspace && (
                    <>
                      <div className="mt-1 border-t border-border/40 px-2 pb-0.5 pt-2">
                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                          Management
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleWorkspaceSwitch(managementWorkspace)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-2 py-2 text-left transition-colors hover:bg-muted/50",
                          !selectedProperty
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
                            : "border-transparent",
                        )}
                      >
                        <Shield className="h-4 w-4 text-indigo-600" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {managementWorkspace.title}
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {managementWorkspace.roleLabel}
                          </span>
                        </span>
                      </button>
                    </>
                  )}
                  {personalGroups.map((group) => (
                    <div key={group.area}>
                      <div className="mt-1 border-t border-border/40 px-2 pb-0.5 pt-2">
                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                          {workspaceAreaMeta[group.area].title}
                        </p>
                      </div>
                      {group.cards.map((workspace) => (
                        <button
                          key={workspace.key}
                          type="button"
                          onClick={() => handleWorkspaceSwitch(workspace)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-2 py-2 text-left transition-colors hover:bg-muted/50",
                            selectedProperty?.id ===
                              workspace.relationship?.place.id
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
                              : "border-transparent",
                          )}
                        >
                          <Building2 className="h-4 w-4 text-indigo-600" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {workspace.title}
                            </span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {workspace.roleLabel} ·{" "}
                              {workspace.relationship?.place.kind}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                  <Link
                    href="/select"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex items-center justify-center rounded-lg border border-border/60 px-2 py-2 text-xs font-bold"
                  >
                    View all workspaces
                  </Link>
                </>
              ) : (
                <>
                  {residencies.length > 0 && (
                    <>
                      <div className="px-2 pb-0.5 pt-1">
                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                          Properties
                        </p>
                      </div>
                      {residencies.map((residency) => (
                        <button
                          key={residency.id}
                          type="button"
                          onClick={() => handleSwitch(residency)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50",
                            selectedResidency?.id === residency.id &&
                              "border-[rgb(var(--brand-primary,#213928))] bg-[rgb(var(--brand-primary,#213928))]/5",
                          )}
                        >
                          <Home className="h-4 w-4 text-[rgb(var(--brand-primary,#213928))]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {residency.name}
                            </span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {residency.address}
                            </span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleSwitch(null)}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-border/40 px-2 py-2 text-left hover:bg-muted/50"
                    >
                      <Shield className="h-4 w-4 text-indigo-600" />
                      Admin Console
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-border/60 my-2" />
            <Link
              href={isAdminRoute ? "/organizations" : "/select"}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-[rgb(var(--brand-primary,#213928))] transition hover:bg-[rgb(var(--brand-primary,#213928))]/5 w-full"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {isAdminRoute ? "Switch organization" : "Manage Workspaces"}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
