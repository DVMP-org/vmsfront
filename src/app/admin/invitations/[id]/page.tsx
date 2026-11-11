import { InvitationDetail } from "@/features/invitation-approvals/InvitationDetail";

export default async function InvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <InvitationDetail invitationId={routeParams.id} />;
}
