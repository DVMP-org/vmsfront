import { redirect } from "next/navigation";

/**
 * Keep the legacy route working, but land users on the actual operator
 * workflow rather than the separate gate-configuration register.
 */
export default function LegacyCheckpointDirectoryPage() {
  redirect("/admin/checkpoints/console");
}
