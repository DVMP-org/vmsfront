import { domainExperience } from "@/config/domains";
import type { PlaceContext } from "./api";

export interface PluginNavItem {
  plugin: string;
  key: string;
  label: string;
  href: string;
  section: string;
}

/** Navigation contributed by plugins active on this Place's Site. */
export function pluginWorkspaceNavigation(
  context: PlaceContext,
): PluginNavItem[] {
  const active = new Set(context.active_plugins ?? []);
  return (context.plugin_navigation ?? [])
    .filter((entry) => active.has(entry.plugin))
    .map((entry) => ({
      plugin: entry.plugin,
      key: entry.key,
      label: entry.label,
      href: `/workspace/${context.place.id}${entry.route}`.replace(/\/+$/, ""),
      section: entry.route.replace(/^\/+|\/+$/g, "").split("/")[0],
    }))
    .filter((entry) => entry.section);
}

export function pluginWorkspaceSection(
  context: PlaceContext,
  section: string,
) {
  return pluginWorkspaceNavigation(context).find(
    (entry) => entry.section === section,
  );
}
export function placeWorkspaceNavigation(context: PlaceContext) {
  return (
    domainExperience(context.effective_use_case)?.workspace_navigation ?? []
  )
    .map((group) => ({
      ...group,
      items: group.items
        .filter(
          (item) =>
            (item.module === "core" || context.modules.includes(item.module)) &&
            (!item.place_admin_only || context.is_place_admin),
        )
        .map((item) => ({
          ...item,
          href: item.href.replace("{placeId}", context.place.id),
        })),
    }))
    .filter((group) => group.items.length);
}
export function workspaceSectionAllowed(
  context: PlaceContext,
  section: string,
) {
  if (section === "overview") return true;
  if (pluginWorkspaceSection(context, section)) return true;
  return placeWorkspaceNavigation(context).some((group) =>
    group.items.some(
      (item) => item.href.replace(/\/+$/, "").split("/").at(-1) === section,
    ),
  );
}
