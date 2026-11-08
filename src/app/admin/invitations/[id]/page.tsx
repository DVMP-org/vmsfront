import { InvitationDetail } from "@/features/invitation-approvals/InvitationDetail";

export default function InvitationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <InvitationDetail invitationId={params.id} />;
}
