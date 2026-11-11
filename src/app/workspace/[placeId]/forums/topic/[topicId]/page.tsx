import { PlaceForum } from "@/features/forum/ForumEntry";
export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const routeParams = await params;
  return <PlaceForum topicId={routeParams.topicId} />;
}
