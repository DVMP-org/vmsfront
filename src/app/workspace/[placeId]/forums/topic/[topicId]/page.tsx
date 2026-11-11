import { PlaceForum } from "@/features/forum/ForumEntry";
export default function ForumTopicPage({
  params,
}: {
  params: { topicId: string };
}) {
  return <PlaceForum topicId={params.topicId} />;
}
