"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  UserCog,
  Puzzle,
  Wallet,
  Palette,
  FolderTree,
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
import { useResidentResidency } from "@/hooks/use-resident-data";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { workspacePermissions } from "@/features/context/api";
import { canOpenManagementDashboard } from "@/features/workspaces/catalog";
import { contextualAdminLinks } from "@/config/admin-routes";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

interface SidebarProps {
  type: "resident" | "admin";
  onMobileClose?: () => void;
}

function buildResidentLinks(
  _residencyId?: string,
  isSuperUser: boolean = false,
) {
  const links = [
    { href: "/resident/wallet", label: "Wallet", icon: Wallet },
    { href: "/profile?context=resident", label: "Profile", icon: UserCog }, // Changed icon to UserCog to match profile better, kept label
  ];

  if (isSuperUser) {
    links.push({
      href: "/organization/settings",
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
        "flex items-center rounded-[var(--vms-radius-control)] text-sm font-medium transition-colors duration-[var(--vms-motion)]",
        "group relative mt-0.5",
        isMobile || !collapsed
          ? "gap-3 px-3 py-2.5"
          : "justify-center px-2 py-2.5",
        isActive
          ? "bg-transparent font-semibold text-[var(--vms-ink)]"
          : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
      )}
      title={collapsed && !isMobile ? link.label : undefined}
    >
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute left-0 h-3/5 w-0.5 rounded-full bg-[var(--vms-active-accent)]"
        />
      ) : null}

      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-[var(--vms-ink)]" : "",
        )}
      />

      {(isMobile || !collapsed) && (
        <span className={cn("flex-1 truncate", isActive && "font-semibold")}>
          {link.label}
        </span>
      )}

      {collapsed && !isMobile && (
        <div className="pointer-events-none absolute left-full z-[100] ml-3 translate-x-1 whitespace-nowrap rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--vms-ink)] opacity-0 shadow-[var(--vms-shadow-overlay)] transition-[opacity,transform] duration-[var(--vms-motion)] group-hover:translate-x-0 group-hover:opacity-100">
          {link.label}
        </div>
      )}
    </Link>
  );
});

export const Sidebar: React.FC<SidebarProps> = memo(function Sidebar({
  type,
  onMobileClose,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(
    new Set(),
  );
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const pathname = usePathname();
  const { selectedResidency, selectedProperty } = useAppStore();
  const workspaceContext = useWorkspaceContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to determine active state consistently
  const isLinkActive = useCallback(
    (href: string) => {
      if (!pathname || !href) return false;
      const target = href.split("?")[0];
      return (
        pathname === target ||
        (target !== "/admin" && pathname.startsWith(target + "/"))
      );
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
            workspaceContext.data?.effective_use_case ?? undefined,
          );

    const managementDashboardAvailable = canOpenManagementDashboard(
      selectedProperty?.id,
      workspaceContext.data?.management?.is_administrator,
    );

    if (actualType === "admin") {
      const workspaceGrants = workspacePermissions(workspaceContext.data);
      const workspaceAllows = (permission?: string | string[]) => {
        if (!permission) return true;
        const permissions = Array.isArray(permission)
          ? permission
          : [permission];
        return permissions.some((required) =>
          workspaceGrants.some((grant) => {
            if (grant === "*") return true;
            if (grant.endsWith(".*")) {
              return required.startsWith(grant.slice(0, -1));
            }
            return grant === required;
          }),
        );
      };
      baseLinks = baseLinks.filter(
        (link: any) => link.href !== "/admin" || managementDashboardAvailable,
      );
      // Site navigation is derived exclusively from Site RBAC. Organization
      // grants must not leak into this management shell.
      if (!mounted || workspaceContext.isPending) {
        return baseLinks.filter(
          (link: any) => !link.permission && !link.managementOnly,
        );
      }

      if (!workspaceContext.data?.management?.is_administrator) {
        return baseLinks.filter(
          (link: any) => !link.permission && !link.managementOnly,
        );
      }

      baseLinks = baseLinks
        .filter((link: any) => {
          if (
            link.managementOnly &&
            !workspaceContext.data?.management?.is_administrator
          )
            return false;
          if (!link.permission) return true;
          return workspaceAllows(link.permission);
        })
        .map((link: any) => {
          const l = link as any;
          if (!l.children) return link;
          return {
            ...link,
            children: l.children.filter((child: any) => {
              if (!child.permission) return true;
              return workspaceAllows(child.permission);
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
    mounted,
    selectedProperty,
    workspaceContext.data,
    workspaceContext.isError,
    workspaceContext.isPending,
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
      sorted.find((l) => {
        if (!l.href) return false;
        const target = l.href.split("?")[0];
        return (
          pathname === target ||
          (target !== "/admin" && pathname.startsWith(target + "/"))
        );
      }) || null
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
    activeLink?.href,
    expandedMenus,
    expandedPlugins,
    isLinkActive,
  ]);

  return (
    <motion.aside
      animate={{
        width: !isMobile && collapsed ? 72 : 256,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
      style={{ willChange: "width" }}
      className={cn(
        "sticky top-0 flex flex-col overflow-hidden border-r border-[var(--vms-line)] bg-[var(--vms-surface)]",
        "h-full flex-shrink-0 z-30",
      )}
    >
      <div className="border-b border-[var(--vms-line)]">
        <WorkspaceSwitcher
          collapsed={collapsed}
          onToggleCollapse={!isMobile ? toggleCollapse : undefined}
          onMobileClose={onMobileClose}
          isMobile={isMobile}
        />
      </div>

      <nav
        className={cn(
          "flex-1 min-h-0 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar",
          isMobile || !collapsed ? "p-3" : "py-4 px-0",
        )}
      >
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
                {actualType === "admin" &&
                  (!collapsed || isMobile) &&
                  link.group !== (links[index - 1] as any)?.group && (
                    <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                      {link.group}
                    </p>
                  )}
                <div
                  className={cn(
                    "flex w-full items-center rounded-[var(--vms-radius-control)] text-sm font-medium transition-colors duration-[var(--vms-motion)]",
                    "group relative",
                    isMobile || !collapsed ? "gap-1" : "justify-center",
                    activeChild || isActive
                      ? "bg-transparent font-semibold text-[var(--vms-ink)]"
                      : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
                  )}
                >
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed && !isMobile ? link.label : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-3 rounded-[var(--vms-radius-control)] py-2.5",
                      isMobile || !collapsed ? "flex-1 px-3" : "px-2",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        (activeChild || isActive) && "text-[var(--vms-ink)]",
                      )}
                    />
                    {(isMobile || !collapsed) && (
                      <span
                        className={cn(
                          "flex-1 truncate text-left",
                          (activeChild || isActive) && "font-bold",
                        )}
                      >
                        {link.label}
                      </span>
                    )}
                  </Link>
                  {(isMobile || !collapsed) && (
                    <button
                      type="button"
                      onClick={() => toggleMenu(link.label)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${link.label}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </motion.div>
                    </button>
                  )}
                </div>

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
                      className="ml-4 mt-1 space-y-0.5 overflow-hidden "
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
                                "flex items-center  text-[13px] font-medium transition-colors duration-[var(--vms-motion)]",
                                "gap-3 px-3 py-2",
                                isChildActive
                                  ? " border-[var(--vms-active-accent)] bg-transparent pl-[10px] font-semibold text-[var(--vms-ink)]"
                                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
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
                  <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
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
                    "flex w-full items-center rounded-[var(--vms-radius-control)] text-sm font-medium transition-colors duration-[var(--vms-motion)]",
                    "group relative",
                    isMobile || !collapsed
                      ? "gap-3 px-3 py-2.5 justify-between"
                      : "justify-center px-2 py-2.5",
                    hasActiveRoute
                      ? "bg-transparent font-semibold text-[var(--vms-ink)]"
                      : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
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
                        "h-5 w-5 flex-shrink-0",
                        pluginIcon,
                        hasActiveRoute && "text-[var(--vms-action)]",
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
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--vms-ink-muted)]" />
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
                      className="ml-4 mt-1 space-y-0.5 overflow-hidden border-l border-[var(--vms-line)]"
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
                        const routeTitle = route.title || route.path || "Route";
                        const routeIcon = route.icon || "circle";
                        return (
                          <li key={route.path} className="pl-3 py-0.5">
                            <Link
                              onClick={handleLinkClick}
                              className={cn(
                                "flex items-center rounded-[var(--vms-radius-control)] text-[13px] font-medium transition-colors duration-[var(--vms-motion)]",
                                "group relative",
                                "gap-3 px-3 py-2",
                                isActive
                                  ? "border-l-2 border-[var(--vms-active-accent)] bg-transparent pl-[10px] font-semibold text-[var(--vms-ink)]"
                                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
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

      {actualType === "admin" && (isMobile || !collapsed) ? (
        <div className="border-t border-[var(--vms-line)] p-3">
          <Link
            href="/organization"
            className="flex min-h-11 items-center rounded-[var(--vms-radius-control)] px-2 text-xs font-medium text-[var(--vms-ink-muted)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            Organization home
          </Link>
        </div>
      ) : null}
    </motion.aside>
  );
});
