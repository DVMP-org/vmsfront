import { redirect } from "next/navigation";

export default function LegacyVisitorsPage() {
  redirect("/admin/invitations");
}
