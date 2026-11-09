import {
  Blocks,
  BriefcaseBusiness,
  DoorOpen,
  Home,
  MessageSquare,
  Puzzle,
  RadioTower,
  Receipt,
  Scan,
  Scale,
  Settings2,
  Share2,
  Shield,
  UserCog,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { ModuleGroup } from "@/features/context/api";
export interface AdminRoute {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string | string[];
  module?: string;
  group?: string;
  managementOnly?: boolean;
  children?: AdminRoute[];
}
export const adminLinks: AdminRoute[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: Home,
    module: "dashboard",
    group: "Workspace",
  },
  {
    href: "/admin/properties",
    label: "Properties",
    icon: Building2,
    permission: "places.list",
    module: "properties",
    group: "Workspace",
  },
  {
    href: "/admin/site/configuration",
    label: "Site configuration",
    icon: Settings2,
    permission: "places.show",
    module: "properties",
    group: "Workspace",
  },
  {
    href: "/admin/people",
    label: "People",
    icon: Users,
    module: "people",
    group: "Workspace",
    managementOnly: true,
  },
  {
    href: "/admin/checkpoints",
    label: "Check-in / check-out",
    icon: Scan,
    permission: "gates.list",
    module: "check_in_out",
    group: "Access",
  },
  {
    href: "/admin/invitations",
    label: "Invitations",
    icon: Shield,
    permission: "visit_authorizations.list",
    module: "check_in_out",
    group: "Access",
  },
  {
    href: "/admin/charges",
    label: "Charges",
    icon: Receipt,
    permission: "charges.list",
    module: "charges",
    group: "Finance",
  },
  {
    href: "/admin/forums",
    label: "Community",
    icon: MessageSquare,
    permission: "forum_posts.list",
    module: "forums",
    group: "Community",
  },
  {
    href: "/admin/gates",
    label: "Gates",
    icon: DoorOpen,
    permission: "gates.list",
    module: "gates",
    group: "Access",
  },
  {
    href: "/admin/gates/simulator",
    label: "Hardware lab",
    icon: RadioTower,
    permission: "gates.list",
    module: "gates",
    group: "Access",
  },
  {
    href: "/admin/hospitality",
    label: "Guest stays",
    icon: Building2,
    permission: "hospitality_stays.list",
    module: "hospitality",
    group: "Workflows",
  },
  {
    href: "/admin/residential",
    label: "Residential operations",
    icon: Home,
    permission: "places.list",
    module: "residential",
    group: "Workflows",
  },
  {
    href: "/admin/commercial",
    label: "Commercial operations",
    icon: BriefcaseBusiness,
    permission: "places.list",
    module: "commercial",
    group: "Workflows",
  },
  {
    href: "/admin/mixed-use/facilities",
    label: "Shared facilities",
    icon: Share2,
    permission: "places.list",
    module: "shared_facilities",
    group: "Mixed-use",
  },
  {
    href: "/admin/mixed-use/expenses",
    label: "Expense allocation",
    icon: Scale,
    permission: "charges.show",
    module: "expense_allocation",
    group: "Mixed-use",
  },
  {
    href: "/admin/integrations",
    label: "Integrations",
    icon: Blocks,
    permission: "admins.list",
    group: "Administration",
  },
  {
    href: "/admin/plugins",
    label: "Plugins",
    icon: Puzzle,
    permission: "admins.list",
    group: "Administration",
  },
  { href: "/admin/profile", label: "Profile", icon: UserCog, group: "Account" },
];
export function contextualAdminLinks(
  modules: readonly string[] | undefined,
  moduleGroups: readonly ModuleGroup[] = [],
): AdminRoute[] {
  const groupByModule = new Map(
    moduleGroups.flatMap((group, index) =>
      group.modules.map((module) => [module, { ...group, index }] as const),
    ),
  );
  const rank = (link: AdminRoute) => {
    if (link.href === "/organization/workspaces") return -1;
    return link.module
      ? (groupByModule.get(link.module)?.index ?? moduleGroups.length)
      : moduleGroups.length + 1;
  };
  return adminLinks
    .filter((link) => !link.module || !!modules?.includes(link.module))
    .map((link, index) => ({
      ...link,
      group: link.module
        ? ((groupByModule.get(link.module)?.label === "Administration"
            ? "Settings"
            : groupByModule.get(link.module)?.label) ?? link.group)
        : link.group,
      index,
    }))
    .sort((left, right) => rank(left) - rank(right) || left.index - right.index)
    .map(({ index: _index, ...link }) => link);
}
