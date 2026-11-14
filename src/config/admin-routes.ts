import {
  Blocks,
  BriefcaseBusiness,
  BedDouble,
  Calculator,
  CalendarDays,
  DoorOpen,
  FileText,
  History,
  Home,
  MessageSquare,
  Megaphone,
  Puzzle,
  RadioTower,
  Receipt,
  Scan,
  TicketCheck,
  Scale,
  Settings2,
  Share2,
  Sparkles,
  Shield,
  UserCog,
  Users,
  Wrench,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { ModuleGroup } from "@/features/context/api";
import { domainExperience } from "@/config/domains";
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
    href: "/admin/site/configuration",
    label: "Site configuration",
    icon: Settings2,
    permission: "places.show",
    module: "properties",
    group: "Workspace",
  },
  {
    href: "/admin/managers",
    label: "Managers",
    icon: UserCog,
    permission: "admins.list",
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
    href: "/admin/passages",
    label: "Passage history",
    icon: History,
    permission: "checkpoint_events.list",
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
    label: "Community forum",
    icon: MessageSquare,
    managementOnly: true,
    module: "forum",
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
  { href: "/profile?context=admin", label: "Profile", icon: UserCog, group: "Account" },
];

const domainIcons: Record<string, LucideIcon> = {
  home: Home,
  building: Building2,
  users: Users,
  scale: Scale,
  receipt: Receipt,
  wrench: Wrench,
  shield: Shield,
  megaphone: Megaphone,
  briefcase: BriefcaseBusiness,
  bed: BedDouble,
  calendar: CalendarDays,
  sparkles: Sparkles,
  share: Share2,
  calculator: Calculator,
  scan: Scan,
  ticket: TicketCheck,
  history: History,
  layers: Blocks,
  document: FileText,
};

/**
 * Navigation config predates the Site module catalogue, so some entries still
 * reference the feature keys the sidebar used before modules were introduced
 * (`charges`, `gates`, …). Site modules now report the owning module
 * (`billing`, `access_control`, …). Without this mapping those links silently
 * disappear from the sidebar.
 */
const moduleKeyAliases: Record<string, string[]> = {
  charges: ["billing"],
  gates: ["access_control"],
  check_in_out: ["access_control"],
  forums: ["forum"],
  dashboard: ["properties", "residential", "commercial", "hospitality", "mixed_use"],
};

export function isModuleEnabled(
  module: string | undefined,
  modules: readonly string[] | undefined,
): boolean {
  if (!module) return true;
  if (!modules) return false;
  if (modules.includes(module)) return true;
  return (moduleKeyAliases[module] ?? []).some((alias) =>
    modules.includes(alias),
  );
}

export function contextualAdminLinks(
  modules: readonly string[] | undefined,
  moduleGroups: readonly ModuleGroup[] = [],
  useCase?: string,
): AdminRoute[] {
  const experience = domainExperience(useCase);
  const groupByModule = new Map(
    moduleGroups.flatMap((group, index) =>
      group.modules.map((module) => [module, { ...group, index }] as const),
    ),
  );
  const rank = (link: AdminRoute) => {
    return link.module
      ? (groupByModule.get(link.module)?.index ?? moduleGroups.length)
      : moduleGroups.length + 1;
  };
  const configuredLinks: AdminRoute[] = experience
    ? experience.navigation.flatMap((group) =>
        group.items.map((item) => {
          const link = {
            href: item.href,
            label: item.label,
            icon: domainIcons[item.icon] ?? Building2,
            permission: item.permission,
            module: item.module,
            group: group.label,
          };
          return {
            ...link,
            ...(item.children?.length
              ? {
                  children: item.children.map((child) => ({
                    href: child.href,
                    label: child.label,
                    icon: domainIcons[child.icon] ?? Building2,
                    permission: child.permission,
                    module: child.module,
                    group: group.label,
                  })),
                }
              : {}),
          };
        }),
      )
    : [];
  const configuredHrefs = new Set(
    configuredLinks.flatMap((link) => [
      link.href,
      ...(link.children?.map((child) => child.href) ?? []),
    ]),
  );
  const configuredModules = new Set(
    configuredLinks
      .map((link) => link.module)
      .filter((module): module is string => !!module),
  );
  const commonLinks = adminLinks.filter(
    (link) =>
      !configuredHrefs.has(link.href) &&
      !(link.href === "/admin/people" && configuredModules.has("people")),
  );

  return [...configuredLinks, ...commonLinks]
    .filter((link) => isModuleEnabled(link.module, modules))
    .map((link, index) => ({
      ...link,
      ...(link.href === "/admin/forums" ? { managementOnly: true } : {}),
      group: configuredHrefs.has(link.href)
        ? link.group
        : link.module
          ? ((groupByModule.get(link.module)?.label === "Administration"
              ? "Settings"
              : groupByModule.get(link.module)?.label) ?? link.group)
          : link.group,
      index,
    }))
    .sort((left, right) => {
      if (configuredHrefs.has(left.href) && configuredHrefs.has(right.href)) {
        return left.index - right.index;
      }
      if (configuredHrefs.has(left.href)) return -1;
      if (configuredHrefs.has(right.href)) return 1;
      return rank(left) - rank(right) || left.index - right.index;
    })
    .map(({ index: _index, ...link }) => link);
}
