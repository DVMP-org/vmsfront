import { redirect } from "next/navigation";

/**
 * The gate register is the authoritative checkpoint page. This legacy
 * directory route redirects so existing links keep working.
 */
export default function LegacyCheckpointDirectoryPage() {
  redirect("/admin/gates");
}
