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
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAppStore } from "@/store/app-store";
import { loadPlugins, getPluginRoutesForUserType } from "@/lib/plugin_loader";
import type { LoadedPlugin } from "@/types/plugin";
import { buildPluginPath } from "@/lib/plugin-utils";
import { useAuthStore } from "@/store/auth-store";

interface SidebarProps {
  type: "resident" | "admin";
  onMobileClose?: () => void;
}

function buildResidentLinks(houseId?: string) {
  const base = houseId ? `/house/${houseId}` : "/select";
  return [
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
    { href: "/profile", label: "Profile", icon: Settings },
  ];
}

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/gate", label: "Gate Console", icon: Scan },
  { href: "/admin/gate/passes", label: "Gate Passes", icon: CreditCard },
  { href: "/admin/gate/events", label: "Gate Events", icon: Activity },
  { href: "/admin/houses", label: "Houses", icon: Building2 },
  { href: "/admin/residents", label: "Residents", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/forums", label: "Forums", icon: MessageSquare },
  { href: "/admin/plugins", label: "Plugins", icon: Puzzle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/admin/profile", label: "Profile", icon: Settings },
];

export function Sidebar({ type, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const pathname = usePathname();
  const { selectedHouse } = useAppStore();
  const user = useAuthStore((state) => state.user);

  // Load plugins from API on mount
  useEffect(() => {
    loadPlugins()
      .then((loadedPlugins) => {
        console.log("Sidebar: Loaded plugins:", loadedPlugins);
        setPlugins(loadedPlugins);
      })
      .catch((error) => {
        console.error("Sidebar: Failed to load plugins:", error);
        setPlugins([]);
      });
  }, []);

  // Helper function to get routes for a plugin based on user type
  // Now uses routes from routes.js instead of manifest
  const getPluginRoutes = (plugin: typeof plugins[0]) => {
    // Get routes from plugin loader (routes.js) based on user type
    if (type === "admin" && plugin.adminRoutes && plugin.adminRoutes.length > 0) {
      return plugin.adminRoutes;
    }
    if (type === "resident" && plugin.residentRoutes && plugin.residentRoutes.length > 0) {
      return plugin.residentRoutes;
    }
    // Fallback to legacy routes
    return plugin.routes || [];
  };

  const routeHouseId = useMemo(() => {
    const match = pathname.match(/^\/house\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  const effectiveHouseId =
    type === "resident" ? selectedHouse?.id ?? routeHouseId : undefined;

  const links = useMemo(
    () =>
      type === "resident" ? buildResidentLinks(effectiveHouseId) : adminLinks,
    [type, effectiveHouseId]
  );
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

  // Auto-expand plugins with active routes
  useEffect(() => {
    const activePlugins = new Set<string>();
    plugins.forEach((plugin) => {
      // Use the same strict matching logic
      if (findActivePluginRoute(plugin) !== null) {
        activePlugins.add(plugin.name);
      }
    });
    if (activePlugins.size > 0) {
      setExpandedPlugins((prev) => {
        const newSet = new Set(prev);
        activePlugins.forEach((name) => newSet.add(name));
        return newSet;
      });
    }
  }, [pathname, type]);

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

  // Find the most specific active route for a plugin
  // Returns the route path if active, null otherwise
  const findActivePluginRoute = (plugin: typeof plugins[0]): string | null => {
    const routes = getPluginRoutes(plugin);
    if (routes.length === 0 || !pathname) return null;

    // Sort routes by path length (longer/more specific first)
    // This ensures we check the most specific routes first
    const sortedRoutes = [...routes].sort((a, b) => {
      const aPath = a.path === "/" ? "" : a.path.replace(/^\/+|\/+$/g, "");
      const bPath = b.path === "/" ? "" : b.path.replace(/^\/+|\/+$/g, "");
      return bPath.length - aPath.length;
    });

    // Find the most specific matching route
    for (const route of sortedRoutes) {
      const fullPath = buildPluginPath(plugin.basePath, route.path);

      // Exact match - highest priority
      if (pathname === fullPath) {
        return route.path;
      }

      // Check if pathname is a child of this route (strict matching)
      // Only match if pathname starts with fullPath + "/" (not just fullPath)
      // This ensures /admin doesn't match /admin-residents
      if (pathname.startsWith(fullPath + "/")) {
        // This is a child route, so this parent route is active
        // But we check more specific routes first, so if we get here,
        // it means no more specific route matched
        return route.path;
      }
    }

    return null;
  };

  // Check if a specific plugin route is active (strict matching)
  const isPluginRouteActive = (plugin: typeof plugins[0], routePath: string): boolean => {
    const activeRoute = findActivePluginRoute(plugin);
    return activeRoute === routePath;
  };

  // Check if any route in a plugin is active
  const isPluginActive = (plugin: typeof plugins[0]) => {
    return findActivePluginRoute(plugin) !== null;
  };

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
            {type === "resident" ? "Resident" : "Admin"}
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
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = mostSpecificMatch?.href === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                "group relative",
                isMobile || !collapsed
                  ? "gap-3 px-3 py-2.5"
                  : "justify-center px-2 py-2.5",
                isActive
                  ? "bg-[var(--brand-primary,#2563eb)] text-white shadow-sm"
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
                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {link.label}
                </span>
              )}
            </Link>

          );
        })}
        <>

          {plugins.map(plugin => {
            const isExpanded = expandedPlugins.has(plugin.name);
            const hasActiveRoute = isPluginActive(plugin);
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
                      ? "bg-[var(--brand-primary,#2563eb)] text-white shadow-sm"
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
                    <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {plugin.manifest.title}
                    </span>
                  )}
                </button>

                {/* Plugin Routes Submenu */}
                {isExpanded && (isMobile || !collapsed) && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-muted pl-2">
                    {getPluginRoutes(plugin).map(route => {
                      const isActive = isPluginRouteActive(plugin, route.path);
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
                                ? "bg-[var(--brand-primary,#2563eb)] text-white shadow-sm"
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
