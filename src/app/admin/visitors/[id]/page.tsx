import { redirect } from "next/navigation";

export default function LegacyVisitorDetailPage() {
  redirect("/admin/invitations");
}
