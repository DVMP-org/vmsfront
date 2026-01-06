"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { Button } from "../ui/Button";
import { cn, getFullName, getInitials } from "@/lib/utils";
import { LogoFull } from "../LogoFull";

interface HeaderProps {
  onMenuClick?: () => void;
  type: "resident" | "admin" | "select";
}

export function Header({ onMenuClick, type }: HeaderProps) {
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    // Initialize dark mode from localStorage or system preference
    const root = document.documentElement;
    const stored = localStorage.getItem("darkMode");

    if (stored === "true") {
      root.classList.add("dark");
      setIsDarkMode(true);
    } else if (stored === "false") {
      root.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      // Check system preference if no stored preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        setIsDarkMode(true);
      } else {
        root.classList.remove("dark");
        setIsDarkMode(false);
      }
    }

    // Check for dark mode class on html element
    const checkDarkMode = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
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

          <Link
            href={dashboardHref}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
          >
            {/* <Home className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
            <span className="truncate">
              {branding?.app_name || "VMSCORE"}
            </span> */}
            {/* <LogoFull /> */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={activeTheme?.name || "Logo"}
                className="h-5 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <LogoFull />
            )}
          </Link>

          {selectedHouse && !isAdminRoute && isHouseRoute && (
            <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Building2 className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
              <span className="font-semibold text-foreground">
                {selectedHouse.name}
              </span>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-9 w-9 p-0"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge can be added here later */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span> */}
            </Button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm font-medium"
              >
                {/* <div className="flex font-semibold text-3xl items-center justify-center rounded-full bg-[var(--primary,#213928)]/10 text-[var(--primary,#213928)] uppercase">
                {getInitials(user.first_name, user.last_name)}
              </div> */}
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
                    "h-6 w-6 text-muted-foreground transition",
                    menuOpen && "rotate-180 text-foreground"
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-60 rounded-xl border border-border/60 bg-background p-3 text-sm shadow-lg">
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
}

function MenuAction({
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
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
