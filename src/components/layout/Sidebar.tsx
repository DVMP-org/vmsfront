"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Home,
  Users,
  CreditCard,
  Building2,
  BarChart3,
  Settings,
  Shield,
  Scan,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  UserCog,
  Puzzle,
  Wallet,
  Receipt,
  Palette,
  FolderTree,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAppStore } from "@/store/app-store";
import { loadPlugins, getPluginRoutesForUserType } from "@/lib/plugin_loader";
import type { LoadedPlugin } from "@/types/plugin";
import {
  buildPluginPath,
  extractRoutePath,
  isPluginPath,
  findMatchingRoute,
  findPluginRouteAndType,
} from "@/lib/plugin-utils";
import { useAuthStore } from "@/store/auth-store";
import { useResidentResidency } from "@/hooks/use-resident-data";
import { useAdminProfile } from "@/hooks/use-admin";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { canOpenManagementDashboard } from "@/features/workspaces/catalog";
import { hasAdminPermission } from "@/lib/permissions";
import { contextualAdminLinks } from "@/config/admin-routes";
import { useActiveBrandingTheme } from "@/hooks/use-admin-branding";
import { LogoFull } from "../LogoFull";
import { SidebarOrganizationHeader } from "./SidebarOrganizationHeader";

interface SidebarProps {
  type: "resident" | "admin";
  onMobileClose?: () => void;
}

function buildResidentLinks(
  residencyId?: string,
  isSuperUser: boolean = false,
) {
  const base = residencyId ? `/residency/${residencyId}` : "/select";
  const links = [
    { href: residencyId ? base : "/select", label: "Dashboard", icon: Home },
    {
      href: residencyId ? `${base}/passes` : "/select",
      label: "My Passes",
      icon: CreditCard,
    },
    {
      href: residencyId ? `${base}/visitors` : "/select",
      label: "Visitors",
      icon: Users,
    },
    {
      href: residencyId ? `${base}/forum` : "/select",
      label: "Forum",
      icon: MessageSquare,
    },
    {
      href: residencyId ? `${base}/visit-requests` : "/select",
      label: "Visit Requests",
      icon: Building2,
    },
    {
      href: residencyId ? `${base}/dues` : "/select",
      label: "Dues",
      icon: Receipt,
    },
    { href: "/resident/wallet", label: "Wallet", icon: Wallet },
    { href: "/resident/profile", label: "Profile", icon: UserCog }, // Changed icon to UserCog to match profile better, kept label
  ];

  if (isSuperUser) {
    links.push({
      href: residencyId ? `${base}/settings` : "/select",
      label: "Settings",
      icon: Settings,
    });
  }

  return links;
}

const SidebarLink = memo(function SidebarLink({
  link,
  isActive,
  collapsed,
  isMobile,
  onClick,
}: {
  link: any;
  isActive: boolean;
  collapsed: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-md text-sm font-medium transition-all duration-300",
        "group relative mt-0.5",
        isMobile || !collapsed
          ? "gap-3 px-3 py-2.5"
          : "justify-center px-2 py-2.5",
        isActive
          ? "bg-[rgb(var(--brand-primary,#2563eb)/0.08)] text-[rgb(var(--brand-primary,#2563eb))] shadow-[inset_0_0_0_1px_rgba(var(--brand-primary),0.12)]"
          : "text-[#667085] hover:bg-[#f4f7fb] hover:text-[#0f1b31]",
      )}
      title={collapsed && !isMobile ? link.label : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className={cn(
            "absolute left-0 w-1 h-3/5 rounded-full",
            "bg-[rgb(var(--brand-primary,#213928))]",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
          isActive ? "text-[rgb(var(--brand-primary,#213928))]" : "",
        )}
      />

      {(isMobile || !collapsed) && (
        <span className={cn("flex-1 truncate", isActive && "font-bold")}>
          {link.label}
        </span>
      )}

      {collapsed && !isMobile && (
        <div className="absolute left-full ml-4 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-popover rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl translate-x-1 group-hover:translate-x-0 border border-border">
          {link.label}
        </div>
      )}
    </Link>
  );
});

function WorkspaceContextPanel({
  collapsed,
  isMobile,
  propertyName,
  useCase,
  hasError,
  onReset,
  onRetry,
}: {
  collapsed: boolean;
  isMobile: boolean;
  propertyName?: string;
  useCase?: string;
  hasError: boolean;
  onReset: () => void;
  onRetry: () => void;
}) {
  if (collapsed && !isMobile) {
    return (
      <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--brand-primary,#213928)/0.18)] bg-[rgb(var(--brand-primary,#213928)/0.06)] text-[rgb(var(--brand-primary,#213928))] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        <ShieldCheck className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-lg border border-[#dce3ee] bg-[#f8faff] p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[rgb(var(--brand-primary,#2563eb))] shadow-sm">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
            Workspace
          </span>
          <span className="block truncate text-sm font-semibold text-[#0f1b31]">
            {propertyName || "Organization"}
          </span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold capitalize text-[#475467] ring-1 ring-[#dce3ee]">
          {useCase || "Loading context"}
        </span>
        {propertyName ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-[rgb(var(--brand-primary,#2563eb))] hover:underline"
          >
            Organization view
          </button>
        ) : null}
      </div>
      {hasError ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700"
        >
          <RefreshCw className="h-3 w-3" />
          Retry workspace
        </button>
      ) : null}
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = memo(function Sidebar({
  type,
  onMobileClose,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [mounted, setMounted] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(
    new Set(),
  );
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const pathname = usePathname();
  const { selectedResidency, selectedProperty, setSelectedProperty } =
    useAppStore();
  const workspaceContext = useWorkspaceContext();
  const user = useAuthStore((state) => state.user);
  const { data: adminProfile, isPending: isAdminProfilePending } =
    useAdminProfile();
  const { data: activeTheme } = useActiveBrandingTheme();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // Initialize dark mode from root element class
    const root = document.documentElement;
    setIsDarkMode(root.classList.contains("dark"));

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const logoUrl = useMemo(() => {
    if (!activeTheme) return null;
    return isDarkMode && activeTheme.dark_logo_url
      ? activeTheme.dark_logo_url
      : activeTheme.logo_url;
  }, [activeTheme, isDarkMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to determine active state consistently
  const isLinkActive = useCallback(
    (href: string) => {
      if (!pathname || !href) return false;
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname],
  );

  // Load plugins from cache first, then refresh from API in background
  useEffect(() => {
    let isMounted = true;
    let hasSetInitialPlugins = false;

    // Load cached plugins immediately for instant rendering
    loadPlugins(true)
      .then((loadedPlugins) => {
        if (isMounted && !hasSetInitialPlugins) {
          console.log("Sidebar: Loaded plugins (cached):", loadedPlugins);
          setPlugins(loadedPlugins);
          hasSetInitialPlugins = true;
        }
      })
      .catch((error) => {
        console.error("Sidebar: Failed to load cached plugins:", error);
        // Try to load from API without cache
        return loadPlugins(false);
      })
      .then((loadedPlugins) => {
        // Only update if plugins have changed and we're still mounted
        if (loadedPlugins && isMounted) {
          setPlugins((prevPlugins) => {
            // Only update if the plugins actually changed (by comparing names)
            const prevNames = new Set(prevPlugins.map((p) => p.name));
            const newNames = new Set(loadedPlugins.map((p) => p.name));

            if (
              prevNames.size !== newNames.size ||
              Array.from(prevNames).some((name) => !newNames.has(name))
            ) {
              return loadedPlugins;
            }
            return prevPlugins;
          });
        }
      })
      .catch((error) => {
        console.error("Sidebar: Failed to load plugins:", error);
        if (isMounted && !hasSetInitialPlugins) {
          setPlugins([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const routeResidencyId = useMemo(() => {
    const match = pathname?.match(/^\/residency\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  // Determine actual type based on which plugin routes array contains the active route
  // This ensures we show the correct sidebar based on the plugin's route definitions
  const actualType = useMemo<"resident" | "admin">(() => {
    // For non-plugin routes, use the type prop
    if (!pathname?.startsWith("/plugins/") || plugins.length === 0) {
      return type;
    }

    for (const plugin of plugins) {
      const result = findPluginRouteAndType(pathname, plugin);
      if (result) {
        return result.layoutType;
      }
    }

    return type;
  }, [pathname, type, plugins]);

  // Helper function to get routes for a plugin based on user type - memoized
  // Strictly filters by type - no fallback to avoid showing wrong routes
  const getPluginRoutesMemoized = useMemo(() => {
    return (plugin: (typeof plugins)[0]): typeof plugin.adminRoutes => {
      // Strict type-based filtering - only return routes for the current sidebar type
      // Use actualType to ensure consistency with pathname
      if (actualType === "admin") {
        return (plugin.adminRoutes || []) as typeof plugin.adminRoutes;
      }
      if (actualType === "resident") {
        return (plugin.residentRoutes || []) as typeof plugin.adminRoutes;
      }
      // Should never reach here, but return empty array as fallback
      return [] as typeof plugin.adminRoutes;
    };
  }, [actualType]);

  // Filter plugins to only show those that have routes for the current sidebar type
  // This ensures plugins only appear in the correct sidebar context
  // Also deduplicates by plugin name to prevent duplicates
  const filteredPlugins = useMemo(() => {
    const seen = new Set<string>();
    return plugins.filter((plugin) => {
      // Deduplicate by name first
      if (seen.has(plugin.name)) {
        return false;
      }
      seen.add(plugin.name);

      // Only show plugin if it has routes for the current sidebar type
      // Use actualType to ensure consistency with pathname
      if (actualType === "admin") {
        return plugin.adminRoutes && plugin.adminRoutes.length > 0;
      }
      if (actualType === "resident") {
        return plugin.residentRoutes && plugin.residentRoutes.length > 0;
      }
      return false;
    });
  }, [plugins, actualType]);

  // Memoize effectiveResidencyId to prevent unnecessary recalculations
  const effectiveResidencyId = useMemo(() => {
    if (actualType !== "resident") return undefined;
    return selectedResidency?.id ?? routeResidencyId;
  }, [actualType, selectedResidency?.id, routeResidencyId]);

  const { data: residentResidency } = useResidentResidency(
    effectiveResidencyId ?? null,
  );
  const isSuperUser = residentResidency?.is_super_user ?? false;

  const links = useMemo(() => {
    let baseLinks =
      actualType === "resident"
        ? buildResidentLinks(effectiveResidencyId, isSuperUser)
        : contextualAdminLinks(
            workspaceContext.isError
              ? undefined
              : workspaceContext.data?.modules,
            workspaceContext.data?.module_groups,
          );

    // Priority for role data: Fresh API Profile > Local Storage Fallback > Auth Store User
    const activeRole = actualType === "admin" ? adminProfile : null;
    const managementDashboardAvailable = canOpenManagementDashboard(
      selectedProperty?.id,
      workspaceContext.data?.management?.is_administrator,
    );

    if (actualType === "admin") {
      baseLinks = baseLinks.filter(
        (link: any) =>
          link.href !== "/admin" || managementDashboardAvailable,
      );
      // If we are not mounted yet (SSR) or have no role data AND are definitively loading fresh,
      // only show non-permission links to avoid flickering.
      if (!mounted || (!activeRole && isAdminProfilePending)) {
        return baseLinks.filter((link: any) => !link.permission);
      }

      // If we are mounted but have no activeRole (unauthorized or logged out), restrict strictly.
      if (!activeRole) {
        return baseLinks.filter((link: any) => !link.permission);
      }

      baseLinks = baseLinks
        .filter((link: any) => {
          if (
            link.managementOnly &&
            !workspaceContext.data?.management?.is_administrator &&
            !hasAdminPermission(activeRole, [
              "parties.create",
              "place_relationships.create",
            ])
          )
            return false;
          if (!link.permission) return true;
          if (!activeRole) return false;
          return hasAdminPermission(activeRole, link.permission);
        })
        .map((link: any) => {
          const l = link as any;
          if (!l.children) return link;
          return {
            ...link,
            children: l.children.filter((child: any) => {
              if (!child.permission) return true;
              return hasAdminPermission(activeRole, child.permission);
            }),
          };
        })
        .filter((link: any) => {
          const l = link as any;
          return l.href || (l.children && l.children.length > 0);
        });
    }

    // Deduplicate links by href
    const seenHrefs = new Set<string>();
    return baseLinks.filter((link) => {
      if (seenHrefs.has(link.href)) return false;
      seenHrefs.add(link.href);
      return true;
    });
  }, [
    actualType,
    effectiveResidencyId,
    isSuperUser,
    adminProfile,
    user,
    isAdminProfilePending,
    mounted,
    selectedProperty,
    workspaceContext.data,
    workspaceContext.isError,
  ]);
  // Flatten and sort links for precise matching
  const activeLink = useMemo(() => {
    if (!pathname) return null;

    const flattened: any[] = [];
    links.forEach((l) => {
      const linkItem = l as any;
      flattened.push(linkItem);
      if (linkItem.children) flattened.push(...linkItem.children);
    });

    // Sort by length descending to match most specific route first
    const sorted = [...flattened].sort(
      (a, b) => (b.href?.length || 0) - (a.href?.length || 0),
    );
    return (
      sorted.find(
        (l) =>
          l.href && (pathname === l.href || pathname.startsWith(l.href + "/")),
      ) || null
    );
  }, [links, pathname]);

  // Auto-collapse on smaller screens, but keep sidebar visible
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On mobile/tablet (< 1024px), always show expanded
      if (mobile) {
        setCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleCollapse = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
  };

  const handleLinkClick = () => {
    // Close mobile sidebar when link is clicked
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const togglePlugin = (pluginName: string) => {
    setExpandedPlugins((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pluginName)) {
        newSet.delete(pluginName);
      } else {
        newSet.add(pluginName);
      }
      return newSet;
    });
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  // Pre-calculate active routes for all plugins to avoid redundant checks during render
  // returns Map<PluginName, ActiveRoutePath | null>
  const activeRoutesMap = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!pathname) return map;

    for (const plugin of plugins) {
      if (!isPluginPath(pathname, plugin.basePath)) {
        continue;
      }

      const routes = getPluginRoutesMemoized(plugin) || [];
      if (routes?.length === 0) continue;

      const routePath = extractRoutePath(pathname, plugin.basePath);
      const matchingRoute = findMatchingRoute(routePath, routes, {
        checkPrefix: true,
      });

      if (matchingRoute) {
        map.set(plugin.name, matchingRoute.path);
      }
    }
    return map;
  }, [pathname, plugins, getPluginRoutesMemoized]);

  // Check if a specific plugin route is active (strict matching)
  const isPluginRouteActive = (
    pluginName: string,
    routePath: string,
  ): boolean => {
    const activeRoute = activeRoutesMap.get(pluginName);
    return activeRoute === routePath;
  };

  // Check if any route in a plugin is active
  const isPluginActive = (pluginName: string) => {
    return activeRoutesMap.has(pluginName);
  };

  // Auto-expand plugins with active routes
  // Only checks filteredPlugins which already ensures correct type
  // Auto-expand plugins and menus with active routes - Consolidated
  useEffect(() => {
    if (!pathname || (filteredPlugins.length === 0 && links.length === 0))
      return;

    let expandedNeedsUpdate = false;
    const nextExpandedPlugins = new Set(expandedPlugins);
    const nextExpandedMenus = new Set(expandedMenus);

    // Auto-expand plugins
    filteredPlugins.forEach((plugin) => {
      if (
        activeRoutesMap.has(plugin.name) &&
        !nextExpandedPlugins.has(plugin.name)
      ) {
        nextExpandedPlugins.add(plugin.name);
        expandedNeedsUpdate = true;
      }
    });

    // Auto-expand admin menus
    if (actualType === "admin") {
      links.forEach((link) => {
        const l = link as any;
        const hasActiveInMenu = l.children?.some(
          (child: any) => child.href === activeLink?.href,
        );
        if (hasActiveInMenu && !nextExpandedMenus.has(l.label)) {
          nextExpandedMenus.add(l.label);
          expandedNeedsUpdate = true;
        }
      });
    }

    if (expandedNeedsUpdate) {
      setExpandedPlugins(nextExpandedPlugins);
      setExpandedMenus(nextExpandedMenus);
    }
  }, [
    pathname,
    actualType,
    filteredPlugins,
    activeRoutesMap,
    links,
    isLinkActive,
  ]);

  return (
    <motion.aside
      animate={{
        width: !isMobile && collapsed ? 80 : 256,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
      style={{ willChange: "width" }}
      className={cn(
        "sticky top-0 flex flex-col border-r border-[#dce3ee] bg-white overflow-hidden",
        "h-screen flex-shrink-0 z-30",
      )}
    >
      {/* Organization Header (Admin only) or Logo Header */}
      <div className="border-b border-[#dce3ee]">
        <SidebarOrganizationHeader
          collapsed={collapsed}
          onToggleCollapse={!isMobile ? toggleCollapse : undefined}
          onMobileClose={onMobileClose}
          isMobile={isMobile}
        />
      </div>

      <LayoutGroup>
        {/* Navigation Links */}
        <nav
          className={cn(
            "flex-1 min-h-0 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar",
            isMobile || !collapsed ? "p-3" : "py-4 px-0",
          )}
        >
          {actualType === "admin" ? (
            <WorkspaceContextPanel
              collapsed={collapsed}
              isMobile={isMobile}
              propertyName={selectedProperty?.name}
              useCase={workspaceContext.data?.effective_use_case?.replaceAll(
                "_",
                " ",
              )}
              hasError={workspaceContext.isError}
              onReset={() => setSelectedProperty(null)}
              onRetry={() => workspaceContext.refetch()}
            />
          ) : null}
          {links.map((link: any, index: number) => {
            const Icon = link.icon;
            const isParentActive =
              activeLink?.href === link.href ||
              link.children?.some(
                (child: any) => child.href === activeLink?.href,
              );

            const isActive = activeLink?.href === link.href;
            const isExpanded = expandedMenus.has(link.label);
            const hasChildren = link.children && link.children.length > 0;

            // Use a stable key that combines href and label to ensure uniqueness
            const linkKey = `${link.href}-${link.label}`;

            if (hasChildren) {
              const activeChild = link.children.find(
                (child: any) => child.href === activeLink?.href,
              );
              return (
                <div key={linkKey} className="mb-0.5">
                  <button
                    onClick={() => toggleMenu(link.label)}
                    className={cn(
                      "flex items-center w-full rounded-xl text-sm font-medium transition-all duration-300 ease-out",
                      "group relative",
                      isMobile || !collapsed
                        ? "gap-3 px-3 py-2.5 justify-between"
                        : "justify-center px-2 py-2.5",
                      activeChild
                        ? "bg-[rgb(var(--brand-primary,#213928)/0.06)] text-[rgb(var(--brand-primary,#213928))]"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900",
                    )}
                    title={collapsed && !isMobile ? link.label : undefined}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 min-w-0",
                        (isMobile || !collapsed) && "flex-1",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                          activeChild &&
                            "text-[rgb(var(--brand-primary,#213928))]",
                        )}
                      />
                      {(isMobile || !collapsed) && (
                        <span
                          className={cn(
                            "flex-1 truncate text-left",
                            activeChild && "font-bold",
                          )}
                        >
                          {link.label}
                        </span>
                      )}
                    </div>
                    {(isMobile || !collapsed) && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                      </motion.div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (isMobile || !collapsed) && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 35,
                          mass: 0.5,
                        }}
                        className="mt-1 ml-4 space-y-0.5 overflow-hidden border-l border-zinc-200 dark:border-zinc-800"
                      >
                        {link.children.map((child: any) => {
                          const ChildIcon = child.icon;
                          const isChildActive = child.href === activeLink?.href;

                          return (
                            <li key={child.href} className="pl-3 py-0.5">
                              <Link
                                href={child.href}
                                onClick={handleLinkClick}
                                className={cn(
                                  "flex items-center rounded-lg text-[13px] font-medium transition-all duration-300",
                                  "gap-3 px-3 py-2",
                                  isChildActive
                                    ? "bg-[rgb(var(--brand-primary,#213928)/0.08)] text-[rgb(var(--brand-primary,#213928))]"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900",
                                )}
                              >
                                <ChildIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 truncate">
                                  {child.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <div key={linkKey}>
                {actualType === "admin" &&
                  (!collapsed || isMobile) &&
                  link.group !== (links[index - 1] as any)?.group && (
                  <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                      {link.group}
                    </p>
                  )}
                <SidebarLink
                  link={link}
                  isActive={isActive}
                  collapsed={collapsed}
                  isMobile={isMobile}
                  onClick={handleLinkClick}
                />
              </div>
            );
          })}
          <>
            {filteredPlugins.map((plugin) => {
              const isExpanded = expandedPlugins.has(plugin.name);
              const hasActiveRoute = isPluginActive(plugin.name);
              const pluginIcon = plugin.manifest.icon
                ? `fa fa-${plugin.manifest.icon}`
                : "fa fa-cube";

              return (
                <div key={plugin.name} className="mb-0.5">
                  {/* Plugin Dropdown Header */}
                  <button
                    onClick={() => togglePlugin(plugin.name)}
                    className={cn(
                      "flex items-center w-full rounded-xl text-sm font-medium transition-all duration-300",
                      "group relative",
                      isMobile || !collapsed
                        ? "gap-3 px-3 py-2.5 justify-between"
                        : "justify-center px-2 py-2.5",
                      hasActiveRoute
                        ? "bg-[rgb(var(--brand-primary,#213928))]/5 text-[rgb(var(--brand-primary,#213928))]"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900",
                    )}
                    title={
                      collapsed && !isMobile ? plugin.manifest.title : undefined
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 min-w-0",
                        (isMobile || !collapsed) && "flex-1",
                      )}
                    >
                      <i
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                          pluginIcon,
                          hasActiveRoute &&
                            "text-[rgb(var(--brand-primary,#213928))]",
                        )}
                      />
                      {(isMobile || !collapsed) && (
                        <span
                          className={cn(
                            "flex-1 truncate text-left",
                            hasActiveRoute && "font-bold",
                          )}
                        >
                          {plugin.manifest.title}
                        </span>
                      )}
                    </div>
                    {(isMobile || !collapsed) && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                      </motion.div>
                    )}
                  </button>

                  {/* Plugin Routes Submenu */}
                  <AnimatePresence>
                    {isExpanded && (isMobile || !collapsed) && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 35,
                          mass: 0.5,
                        }}
                        className="mt-1 ml-4 space-y-0.5 overflow-hidden border-l border-zinc-200 dark:border-zinc-800"
                      >
                        {getPluginRoutesMemoized(plugin)?.map((route) => {
                          const isActive = isPluginRouteActive(
                            plugin.name,
                            route.path,
                          );
                          const routeHref = buildPluginPath(
                            plugin.basePath,
                            route.path,
                          );
                          const routeTitle =
                            route.title || route.path || "Route";
                          const routeIcon = route.icon || "circle";
                          return (
                            <li key={route.path} className="pl-3 py-0.5">
                              <Link
                                onClick={handleLinkClick}
                                className={cn(
                                  "flex items-center rounded-lg text-[13px] font-medium transition-all duration-300",
                                  "group relative",
                                  "gap-3 px-3 py-2",
                                  isActive
                                    ? "bg-[rgb(var(--brand-primary,#213928)/0.08)] text-[rgb(var(--brand-primary,#213928))]"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900",
                                )}
                                href={routeHref}
                              >
                                <i
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0",
                                    `fa fa-${routeIcon}`,
                                    isActive && "text-primary-foreground",
                                  )}
                                />
                                <span className="flex-1 truncate">
                                  {routeTitle}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        </nav>
      </LayoutGroup>

      {actualType === "admin" && (isMobile || !collapsed) ? (
        <div className="border-t border-[#dce3ee] p-3">
          <p className="px-2 text-[10px] leading-4 text-[#98a2b3]">
            Organization access only. Occupant and staff workspaces remain
            separate.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Link
              href="/admin/organization"
              className="rounded-md px-2 py-2 text-xs font-medium text-[#475467] transition hover:bg-[#f4f7fb] hover:text-[#0f1b31]"
            >
              Settings
            </Link>
            <a
              href="mailto:support@vmscore.to"
              className="rounded-md px-2 py-2 text-xs font-medium text-[#475467] transition hover:bg-[#f4f7fb] hover:text-[#0f1b31]"
            >
              Help & support
            </a>
          </div>
        </div>
      ) : null}
    </motion.aside>
  );
});
