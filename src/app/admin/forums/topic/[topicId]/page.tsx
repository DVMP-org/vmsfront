import { SiteForum } from "@/features/forum/ForumEntry";
export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const routeParams = await params;
  return <SiteForum topicId={routeParams.topicId} />;
}
