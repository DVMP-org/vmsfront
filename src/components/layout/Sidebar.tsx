"use client";

import { useState, useEffect, useMemo } from "react";
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
import { buildPluginPath, extractRoutePath, normalizeRoutePath, isPluginPath, findMatchingRoute, findPluginRouteAndType } from "@/lib/plugin-utils";
import { useAuthStore } from "@/store/auth-store";
import { useResidentHouse } from "@/hooks/use-resident";

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

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/gate", label: "Gate Console", icon: Scan },
  { href: "/admin/gate/passes", label: "Gate Passes", icon: CreditCard },
  { href: "/admin/gate/events", label: "Gate Events", icon: Activity },
  { href: "/admin/houses", label: "Houses", icon: Building2 },
  { href: "/admin/house-groups", label: "House Groups", icon: FolderTree },
  {
    href: "/admin/dues",
    label: "Dues",
    icon: Receipt,
    children: [
      { href: "/admin/dues", label: "All Dues", icon: Receipt },
      { href: "/admin/dues/houses", label: "House Dues", icon: Building2 },
    ],
  },
  { href: "/admin/residents", label: "Residents", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/forums", label: "Forums", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/plugins", label: "Plugins", icon: Puzzle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/admin/profile", label: "Profile", icon: UserCog },
];

export function Sidebar({ type, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const pathname = usePathname();
  const { selectedHouse } = useAppStore();
  const user = useAuthStore((state) => state.user);

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
    const linkArray = actualType === "resident" ? buildResidentLinks(effectiveHouseId, isSuperUser) : adminLinks;

    // Deduplicate links by href AND label to prevent duplicates
    // Use Map to track both href and label for better deduplication
    const seen = new Map<string, Set<string>>(); // href -> Set of labels
    const uniqueLinks: typeof linkArray = [];

    for (const link of linkArray) {
      const labelsForHref = seen.get(link.href);
      if (!labelsForHref) {
        // First time seeing this href
        seen.set(link.href, new Set([link.label]));
        uniqueLinks.push(link);
      } else if (!labelsForHref.has(link.label)) {
        // Same href but different label - should not happen, but skip to be safe
        labelsForHref.add(link.label);
      }
      // If we've seen both this href and label, skip (duplicate)
    }

    // Double-check: ensure no duplicates by creating a final deduplicated array
    const finalLinks: typeof linkArray = [];
    const hrefSet = new Set<string>();
    for (const link of uniqueLinks) {
      if (!hrefSet.has(link.href)) {
        hrefSet.add(link.href);
        finalLinks.push(link);
      }
    }

    return finalLinks;
  }, [actualType, effectiveHouseId, isSuperUser]);
  const mostSpecificMatch = useMemo(() => {
    const sortedLinks = [...links].sort(
      (a, b) => b.href.length - a.href.length
    );
    return sortedLinks.find(
      (link) =>
        pathname === link.href ||
        (pathname && pathname.startsWith(link.href + "/"))
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
  useEffect(() => {
    // Only run when plugins are actually loaded
    if (filteredPlugins.length === 0) return;

    const activePlugins = new Set<string>();
    filteredPlugins.forEach((plugin) => {
      // Use the memoized map
      const activeRoute = activeRoutesMap.get(plugin.name);
      if (activeRoute) {
        activePlugins.add(plugin.name);
      }
    });

    // Only update if there are active plugins and they're not already in the set
    if (activePlugins.size > 0) {
      setExpandedPlugins((prev) => {
        // Check if we need to update at all
        let needsUpdate = false;
        activePlugins.forEach((name) => {
          if (!prev.has(name)) {
            needsUpdate = true;
          }
        });

        if (!needsUpdate) return prev; // Return same reference if no change

        const newSet = new Set(prev);
        activePlugins.forEach((name) => newSet.add(name));
        return newSet;
      });
    }

    // Auto-expand admin menus with active children
    if (actualType === "admin") {
      adminLinks.forEach(link => {
        if (link.children) {
          const hasActiveChild = link.children.some(child =>
            pathname === child.href || (pathname && pathname.startsWith(child.href + "/"))
          );
          if (hasActiveChild) {
            setExpandedMenus(prev => {
              if (prev.has(link.label)) return prev;
              const newSet = new Set(prev);
              newSet.add(link.label);
              return newSet;
            });
          }
        }
      });
    }
  }, [pathname, actualType, filteredPlugins, activeRoutesMap]);

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
          const isParentActive = link.children?.some((child: any) =>
            pathname === child.href || (pathname && pathname.startsWith(child.href + "/"))
          ) || (pathname === link.href || (pathname && pathname.startsWith(link.href + "/")));

          const isActive = mostSpecificMatch?.href === link.href;
          const isExpanded = expandedMenus.has(link.label);
          const hasChildren = link.children && link.children.length > 0;

          // Use a stable key that combines href and label to ensure uniqueness
          const linkKey = `${link.href}-${link.label}`;

          if (hasChildren) {
            // Find if any child is a more specific match than the parent's base href
            const activeChild = link.children.find((child: any) =>
              pathname === child.href || (pathname && pathname.startsWith(child.href + "/"))
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
                      // Strict child check: it is active if it's the exact match or the most specific start
                      // Given submenus, usually children are specific enough.
                      const isChildActive = pathname === child.href || (pathname && pathname.startsWith(child.href + "/"));

                      // Handle the case where "All Dues" is /admin/dues and "House Dues" is /admin/dues/houses
                      // If we are at /admin/dues/houses, both start with /admin/dues.
                      // We need to check if ANY OTHER child is a better match.
                      const isBestChildMatch = isChildActive && !link.children.some((otherChild: any) =>
                        otherChild !== child &&
                        otherChild.href.length > child.href.length &&
                        pathname.startsWith(otherChild.href)
                      );

                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={handleLinkClick}
                            className={cn(
                              "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                              "gap-3 px-3 py-2.5",
                              isBestChildMatch
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
            <Link
              key={linkKey}
              // ... unchanged
              href={link.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                "group relative",
                isMobile || !collapsed
                  ? "gap-3 px-3 py-2.5"
                  : "justify-center px-2 py-2.5",
                isActive
                  ? "bg-[rgb(var(--brand-primary,#213928))] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={collapsed && !isMobile ? link.label : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive && "text-primary-foreground"
                )}
              />
              {(isMobile || !collapsed) && (
                <span className="flex-1 truncate">{link.label}</span>
              )}
              {collapsed && !isMobile && (
                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-foreground bg-popover border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {link.label}
                </span>
              )}
            </Link>

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
}
