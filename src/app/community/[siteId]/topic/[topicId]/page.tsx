import { MemberSiteForum } from "@/features/forum/ForumEntry";
export default async function CommunityTopicPage({
  params,
}: {
  params: Promise<{ siteId: string; topicId: string }>;
}) {
  const routeParams = await params;
  return (
    <MemberSiteForum
      siteId={routeParams.siteId}
      topicId={routeParams.topicId}
    />
  );
}
