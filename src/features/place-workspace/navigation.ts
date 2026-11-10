import { domainExperience } from "@/config/domains";
import type { PlaceContext } from "./api";
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
  return placeWorkspaceNavigation(context).some((group) =>
    group.items.some(
      (item) => item.href.replace(/\/+$/, "").split("/").at(-1) === section,
    ),
  );
}
