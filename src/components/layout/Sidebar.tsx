"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { useResidentHouse } from "@/hooks/use-resident";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasPermission } from "@/lib/permissions";
import { adminLinks } from "@/config/admin-routes";

interface SidebarProps {
  type: "resident" | "admin";
  onMobileClose?: () => void;
}

function buildResidentLinks(houseId?: string, isSuperUser: boolean = false) {
  const base = houseId ? `/house/${houseId}` : "/select";
  const links = [
    { href: houseId ? base : "/select", label: "Dashboard", icon: Home },
    {
      href: houseId ? `${base}/passes` : "/select",
      label: "My Passes",
      icon: CreditCard,
    },
    {
      href: houseId ? `${base}/visitors` : "/select",
      label: "Visitors",
      icon: Users,
    },
    {
      href: houseId ? `${base}/forum` : "/select",
      label: "Forum",
      icon: MessageSquare,
    },
    {
      href: houseId ? `${base}/dues` : "/select",
      label: "Dues",
      icon: Receipt,
    },
    { href: "/resident/wallet", label: "Wallet", icon: Wallet },
    { href: "/resident/profile", label: "Profile", icon: UserCog }, // Changed icon to UserCog to match profile better, kept label
  ];

  if (isSuperUser) {
    links.push({
      href: houseId ? `${base}/settings` : "/select",
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
        "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        "group relative",
        isMobile || !collapsed ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5",
        isActive
          ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      title={collapsed && !isMobile ? link.label : undefined}
    >
      <Icon
        className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")}
      />
      {(isMobile || !collapsed) && <span className="flex-1 truncate">{link.label}</span>}
      {collapsed && !isMobile && (
        <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-foreground bg-popover border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {link.label}
        </span>
      )}
    </Link>
  );
});

export const Sidebar = memo(function Sidebar({ type, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const pathname = usePathname();
  const { selectedHouse } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const { data: adminProfile, isLoading: isAdminProfileLoading } = useAdminProfile();

  useEffect(() => {
    setMounted(true);
  }, []);


  // Helper to determine active state consistently
  const isLinkActive = useCallback((href: string) => {
    if (!pathname || !href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }, [pathname]);

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
            const prevNames = new Set(prevPlugins.map(p => p.name));
            const newNames = new Set(loadedPlugins.map(p => p.name));

            if (prevNames.size !== newNames.size ||
              Array.from(prevNames).some(name => !newNames.has(name))) {
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

  const routeHouseId = useMemo(() => {
    const match = pathname.match(/^\/house\/([^/]+)/);
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
    return (plugin: typeof plugins[0]): typeof plugin.adminRoutes => {
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

  // Memoize effectiveHouseId to prevent unnecessary recalculations
  const effectiveHouseId = useMemo(() => {
    if (actualType !== "resident") return undefined;
    return selectedHouse?.id ?? routeHouseId;
  }, [actualType, selectedHouse?.id, routeHouseId]);

  const { data: residentHouse } = useResidentHouse(effectiveHouseId ?? null);
  const isSuperUser = residentHouse?.is_super_user ?? false;

  const links = useMemo(() => {
    let baseLinks =
      actualType === "resident"
        ? buildResidentLinks(effectiveHouseId, isSuperUser)
        : [...adminLinks];

    // Priority for role data: Fresh API Profile > Auth Store User > Null (restricted)
    const activeRole = actualType === "admin" ? (adminProfile?.role || user?.admin?.role) : null;

    if (actualType === "admin") {
      // If we are not mounted yet (SSR) or have no role data while loading, only show non-permission links
      if (!mounted || (!activeRole && isAdminProfileLoading)) {
        return baseLinks.filter((link: any) => !link.permission);
      }

      baseLinks = baseLinks
        .filter((link: any) => {
          if (!link.permission) return true;
          if (!activeRole) return false;
          return hasPermission(activeRole, link.permission);
        })
        .map((link: any) => {
          const l = link as any;
          if (!l.children) return link;
          return {
            ...link,
            children: l.children.filter((child: any) => {
              if (!child.permission) return true;
              return hasPermission(activeRole, child.permission);
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
  }, [actualType, effectiveHouseId, isSuperUser, adminProfile, user, isAdminProfileLoading, mounted]);
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
    const sorted = [...flattened].sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0));
    return sorted.find(l => l.href && (pathname === l.href || pathname.startsWith(l.href + "/"))) || null;
  }, [links, pathname]);

  // Auto-collapse on smaller screens, but keep sidebar visible
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On mobile/tablet (< 1024px), always show expanded
      if (mobile) {
        setCollapsed(false);
      } else {
        // On desktop, start expanded
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

      const routes = getPluginRoutesMemoized(plugin);
      if (routes.length === 0) continue;

      const routePath = extractRoutePath(pathname, plugin.basePath);
      const matchingRoute = findMatchingRoute(routePath, routes, { checkPrefix: true });

      if (matchingRoute) {
        map.set(plugin.name, matchingRoute.path);
      }
    }
    return map;
  }, [pathname, plugins, getPluginRoutesMemoized]);

  // Check if a specific plugin route is active (strict matching)
  const isPluginRouteActive = (pluginName: string, routePath: string): boolean => {
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
    if (!pathname || (filteredPlugins.length === 0 && links.length === 0)) return;

    let expandedNeedsUpdate = false;
    const nextExpandedPlugins = new Set(expandedPlugins);
    const nextExpandedMenus = new Set(expandedMenus);

    // Auto-expand plugins
    filteredPlugins.forEach((plugin) => {
      if (activeRoutesMap.has(plugin.name) && !nextExpandedPlugins.has(plugin.name)) {
        nextExpandedPlugins.add(plugin.name);
        expandedNeedsUpdate = true;
      }
    });

    // Auto-expand admin menus
    if (actualType === "admin") {
      links.forEach(link => {
        const l = link as any;
        const hasActiveInMenu = l.children?.some((child: any) => child.href === activeLink?.href);
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
  }, [pathname, actualType, filteredPlugins, activeRoutesMap, links, isLinkActive]);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        "h-full w-64",
        "flex-shrink-0 z-30",
        // On desktop, support collapsed state
        !isMobile && collapsed && "w-16"
      )}
    >
      {/* Header with Close/Collapse Button */}
      <div
        className={cn(
          "flex items-center border-b bg-muted/50",
          isMobile
            ? "justify-between p-3"
            : collapsed
              ? "justify-center p-2"
              : "justify-between p-3"
        )}
      >
        {(!collapsed || isMobile) && (
          <span className="text-sm font-semibold text-foreground">
            {actualType === "resident" ? "Resident" : "Admin"}
          </span>
        )}
        <div className="flex items-center gap-2">
          {isMobile && onMobileClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileClose}
              className="h-8 w-8 p-0"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className={cn("h-8 w-8 p-0", collapsed ? "mx-auto" : "ml-auto")}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto overflow-x-hidden">
        {links.map((link: any) => {
          const Icon = link.icon;
          const isParentActive = activeLink?.href === link.href ||
            link.children?.some((child: any) => child.href === activeLink?.href);

          const isActive = activeLink?.href === link.href;
          const isExpanded = expandedMenus.has(link.label);
          const hasChildren = link.children && link.children.length > 0;

          // Use a stable key that combines href and label to ensure uniqueness
          const linkKey = `${link.href}-${link.label}`;

          if (hasChildren) {
            // Find if any child is the current active link
            const activeChild = link.children.find((child: any) =>
              child.href === activeLink?.href
            );

            // Re-sort children to ensure strictness if needed, but usually simple match is fine
            // if we are in a child route.

            return (
              <div key={linkKey} className="mb-1">
                <button
                  onClick={() => toggleMenu(link.label)}
                  className={cn(
                    "flex items-center w-full rounded-lg text-sm font-medium transition-all duration-200",
                    "group relative",
                    isMobile || !collapsed
                      ? "gap-3 px-3 py-2.5 justify-between"
                      : "justify-center px-2 py-2.5",
                    activeChild
                      ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed && !isMobile ? link.label : undefined}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        activeChild && "text-primary-foreground"
                      )}
                    />
                    {(isMobile || !collapsed) && (
                      <span className="flex-1 truncate text-left">{link.label}</span>
                    )}
                  </div>
                  {(isMobile || !collapsed) && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>

                {isExpanded && (isMobile || !collapsed) && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-muted pl-2">
                    {link.children.map((child: any) => {
                      const ChildIcon = child.icon;
                      const isChildActive = child.href === activeLink?.href;

                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={handleLinkClick}
                            className={cn(
                              "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                              "gap-3 px-3 py-2.5",
                              isChildActive
                                ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{child.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }

          return (
            <SidebarLink
              key={linkKey}
              link={link}
              isActive={isActive}
              collapsed={collapsed}
              isMobile={isMobile}
              onClick={handleLinkClick}
            />
          );
        })}
        <>

          {filteredPlugins.map(plugin => {
            const isExpanded = expandedPlugins.has(plugin.name);
            const hasActiveRoute = isPluginActive(plugin.name);
            const pluginIcon = plugin.manifest.icon
              ? `fa fa-${plugin.manifest.icon}`
              : 'fa fa-cube';

            return (
              <div key={plugin.name} className="mb-1">
                {/* Plugin Dropdown Header */}
                <button
                  onClick={() => togglePlugin(plugin.name)}
                  className={cn(
                    "flex items-center w-full rounded-lg text-sm font-medium transition-all duration-200",
                    "group relative",
                    isMobile || !collapsed
                      ? "gap-3 px-3 py-2.5 justify-between"
                      : "justify-center px-2 py-2.5",
                    hasActiveRoute
                      ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed && !isMobile ? plugin.manifest.title : undefined}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <i
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        pluginIcon,
                        hasActiveRoute && "text-primary-foreground"
                      )}
                    />
                    {(isMobile || !collapsed) && (
                      <span className="flex-1 truncate text-left">{plugin.manifest.title}</span>
                    )}
                  </div>
                  {(isMobile || !collapsed) && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  {collapsed && !isMobile && (
                    <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-foreground bg-popover border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {plugin.manifest.title}
                    </span>
                  )}
                </button>

                {/* Plugin Routes Submenu */}
                {isExpanded && (isMobile || !collapsed) && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-muted pl-2">
                    {getPluginRoutesMemoized(plugin).map(route => {
                      const isActive = isPluginRouteActive(plugin.name, route.path);
                      const routeHref = buildPluginPath(plugin.basePath, route.path);
                      // Get title and icon from route (routes.js) or fallback to path
                      const routeTitle = route.title || route.path || "Route";
                      const routeIcon = route.icon || "circle";
                      return (
                        <li key={route.path}>
                          <Link
                            onClick={handleLinkClick}
                            className={cn(
                              "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                              "group relative",
                              "gap-3 px-3 py-2.5",
                              isActive
                                ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            href={routeHref}
                          >
                            <i
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                `fa fa-${routeIcon}`,
                                isActive && "text-primary-foreground"
                              )}
                            />
                            <span className="flex-1 truncate">{routeTitle}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </>
      </nav>
    </aside>
  );
});
