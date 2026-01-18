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
  Moon,
  Sun,
  Bell,
  Shield,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { Button } from "../ui/Button";
import { cn, getFullName, getInitials } from "@/lib/utils";
import { LogoFull } from "../LogoFull";
import { useResidentDashboardSelect } from "@/hooks/use-resident";
import { useAdminProfile } from "@/hooks/use-admin";
import { motion, AnimatePresence } from "framer-motion";
import type { House } from "@/types";

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
  type: "resident" | "admin" | "select" | "auth";
}

export const Header = memo(function Header({ onMenuClick, sidebarOpen, type }: HeaderProps) {
  const { user, logout } = useAuth();
  const { selectedHouse, branding } = useAppStore();
  const { data: activeTheme } = useActiveBrandingTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isAdminRoute = type == 'admin' || pathname?.startsWith("/admin");
  const isHouseRoute = type == 'resident' || pathname?.startsWith("/house");
  const isSelectRoute = type == 'select' || pathname?.startsWith("/select");
  const isAdminUser = useMemo(() => {
    if (!user) return false;
    const type = `${user.user_type ?? ""}`.toLowerCase();
    return user.is_admin || type === "admin";
  }, [user]);
  const profileHref = isAdminUser ? "/admin/profile" : "resident/profile";
  const dashboardHref = "/select";
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const newDarkMode = !root.classList.contains("dark");

    if (newDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }

    setIsDarkMode(newDarkMode);
  };

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

  useEffect(() => {
    const root = document.documentElement;

    // Initial check just in case
    setIsDarkMode(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDarkMode(root.classList.contains("dark"));
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const logoUrl = useMemo(() => {
    if (!activeTheme) return null;
    return isDarkMode && activeTheme.dark_logo_url
      ? activeTheme.dark_logo_url
      : activeTheme.logo_url;
  }, [activeTheme, isDarkMode]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur">
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
            {!isSelectRoute && user && (
              <WorkspaceSwitcher
                selectedHouse={selectedHouse}
                isAdminRoute={isAdminRoute}
              />
            )}
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-9 w-9 p-0 rounded-full hover:bg-muted/50 transition-colors"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 relative rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </Button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 px-2 py-1.5 sm:px-3 sm:py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))] text-[10px] font-bold sm:hidden">
                  {getInitials(user.first_name, user.last_name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[12px] font-semibold text-foreground truncate max-w-[120px] xl:max-w-none">
                    {getFullName(user.first_name, user.last_name)}
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
                    menuOpen && "rotate-180 text-foreground"
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-64 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl p-3 text-sm shadow-2xl z-50 ring-1 ring-black/5">
                  <div className="flex items-center gap-3 px-2 py-3 border-b border-border/40 mb-2 sm:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))] font-bold">
                      {getInitials(user.first_name, user.last_name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">
                        {getFullName(user.first_name, user.last_name)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
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
                    description={user.email}
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
  selectedHouse,
  isAdminRoute,
}: {
  selectedHouse: House | null;
  isAdminRoute: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const { setSelectedHouse } = useAppStore();

  const { data: dashboardData } = useResidentDashboardSelect();
  const { data: adminProfile, isError: isAdminError } = useAdminProfile();

  const houses = dashboardData?.houses ?? [];
  const isAdmin = !!adminProfile && !isAdminError;

  const currentWorkspaceName = isAdminRoute
    ? "Admin Console"
    : selectedHouse?.name || "Select Estate";

  const currentWorkspaceIcon = isAdminRoute ? (
    <Shield className="h-4 w-4 text-indigo-600" />
  ) : (
    <Building2 className="h-4 w-4 text-[rgb(var(--brand-primary,#213928))]" />
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const handleSwitch = (house: House | null) => {
    if (house) {
      setSelectedHouse(house);
      router.push(`/house/${house.id}`);
    } else {
      setSelectedHouse(null);
      router.push("/admin");
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={switcherRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 transition-all hover:bg-muted/50",
          open && "ring-2 ring-[rgb(var(--brand-primary,#213928))]/20 border-[rgb(var(--brand-primary,#213928))]/40"
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
            className="absolute left-0 mt-3 w-64 rounded-xl border border-border/60 bg-background p-2 shadow-xl z-50 ring-1 ring-black/5"
          >
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Switch Workspace
              </p>
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {houses.length > 0 && (
                <>
                  <div className="px-2 pt-1 pb-0.5">
                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">Properties</p>
                  </div>
                  {houses.map((house) => (
                    <button
                      key={house.id}
                      type="button"
                      onClick={() => handleSwitch(house)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50",
                        selectedHouse?.id === house.id && !isAdminRoute && "bg-[rgb(var(--brand-primary,#213928))]/5  border-[rgb(var(--brand-primary,#213928))]"
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))]">
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {house.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {house.address}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {isAdmin && (
                <>
                  <div className="px-2 pt-2 pb-0.5 border-t border-border/40 mt-1">
                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">Management</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitch(null)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50",
                      isAdminRoute && "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-600"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Admin Console
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Estate Operations
                      </p>
                    </div>
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-border/60 my-2" />
            <Link
              href="/select"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-[rgb(var(--brand-primary,#213928))] transition hover:bg-[rgb(var(--brand-primary,#213928))]/5 w-full"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Manage Workspaces
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
