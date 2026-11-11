import { MemberSiteForum } from "@/features/forum/ForumEntry";
export default function CommunityTopicPage({
  params,
}: {
  params: { siteId: string; topicId: string };
}) {
  return <MemberSiteForum siteId={params.siteId} topicId={params.topicId} />;
}
