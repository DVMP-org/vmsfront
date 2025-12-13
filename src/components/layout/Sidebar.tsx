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
  X,
  MessageSquare,
  UserCog,
  Puzzle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAppStore } from "@/store/app-store";
import { loadPlugins } from "@/lib/plugin_loader";

interface SidebarProps {
  type: "resident" | "admin";
  onMobileClose?: () => void;
}

const plugins = loadPlugins();

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
  const pathname = usePathname();
  const { selectedHouse } = useAppStore();

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
          {plugins.map(plugin => (
            <div key={plugin.name}>
              <h4>{plugin.manifest.title}</h4>
              <ul>
                {plugin.manifest.frontend.routes.map(route => (
                  <li key={route.path}>
                    <Link
                      href={`/plugins/${plugin.basePath}/${route.path}`}
                    >
                      {route.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      </nav>
    </aside>
  );
}
