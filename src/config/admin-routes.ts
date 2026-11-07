import { Home, Users, Building2, Settings, Shield, Scan, Receipt, Puzzle, UserCog, MessageSquare, DoorOpen, Blocks, RadioTower, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ModuleGroup } from "@/features/context/api";
export interface AdminRoute { href:string; label:string; icon:LucideIcon; permission?:string|string[]; module?:string; group?:string; children?:AdminRoute[] }
export const adminLinks: AdminRoute[] = [
 {href:"/admin",label:"Dashboard",icon:Home,module:"dashboard",group:"Workspace"},
 {href:"/select",label:"Workspaces",icon:LayoutGrid,group:"Workspace"},
 {href:"/admin/properties",label:"Properties",icon:Building2,permission:"places.list",module:"properties",group:"Workspace"},
 {href:"/admin/checkpoints",label:"Check-in / check-out",icon:Scan,permission:"gates.list",module:"check_in_out",group:"Operations"},
 {href:"/admin/charges",label:"Charges",icon:Receipt,permission:"charges.list",module:"charges",group:"Operations"},
 {href:"/admin/forums",label:"Forums",icon:MessageSquare,permission:"forum_posts.list",module:"forums",group:"Operations"},
 {href:"/admin/gates",label:"Gates",icon:DoorOpen,permission:"gates.list",module:"gates",group:"Operations"},
 {href:"/admin/gates/simulator",label:"Hardware lab",icon:RadioTower,permission:"gates.list",module:"gates",group:"Operations"},
 {href:"/admin/hospitality",label:"Guest stays",icon:Building2,permission:"hospitality_stays.list",module:"hospitality",group:"Workflows"},
 {href:"/admin/admins",label:"Administrators",icon:UserCog,permission:"admins.list",module:"admins",group:"Organization"},
 {href:"/admin/admins/roles",label:"Roles & permissions",icon:Shield,permission:"roles.list",module:"roles",group:"Organization"},
 {href:"/admin/organization",label:"Organization settings",icon:Settings,permission:"organizations.show",module:"organization_settings",group:"Organization"},
 {href:"/admin/plugins",label:"Plugins",icon:Puzzle,permission:"plugins.list",module:"plugins",group:"Organization"},
 {href:"/admin/settings?tab=integrations",label:"Integrations",icon:Blocks,permission:"integrations.list",module:"integrations",group:"Organization"},
 {href:"/admin/settings",label:"Configuration",icon:Settings,permission:["branding.list","settings.show"],module:"organization_settings",group:"Organization"},
 {href:"/admin/profile",label:"Profile",icon:UserCog,group:"Account"},
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
  const rank = (link: AdminRoute) =>
    link.module ? (groupByModule.get(link.module)?.index ?? moduleGroups.length) : -1;
  return adminLinks
    .filter((link) => !link.module || !!modules?.includes(link.module))
    .map((link, index) => ({
      ...link,
      group: link.module
        ? (groupByModule.get(link.module)?.label ?? link.group)
        : link.group,
      index,
    }))
    .sort((left, right) => rank(left) - rank(right) || left.index - right.index)
    .map(({ index: _index, ...link }) => link);
}
