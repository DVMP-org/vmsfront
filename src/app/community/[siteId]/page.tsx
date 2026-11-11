import { MemberSiteForum } from "@/features/forum/ForumEntry";
export default function CommunityPage({
  params,
}: {
  params: { siteId: string };
}) {
  return <MemberSiteForum siteId={params.siteId} />;
}
