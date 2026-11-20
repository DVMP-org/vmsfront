import { redirect } from "next/navigation";

/** Plugin management is organization administration; one workspace owns it. */
export default function LegacyAdminPluginsPage() {
  redirect("/organization/plugins");
}
