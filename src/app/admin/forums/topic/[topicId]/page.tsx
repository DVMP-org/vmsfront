import { SiteForum } from "@/features/forum/ForumEntry";
export default function ForumTopicPage({
  params,
}: {
  params: { topicId: string };
}) {
  return <SiteForum topicId={params.topicId} />;
}
