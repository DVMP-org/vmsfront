import { MemberSiteForum } from "@/features/forum/ForumEntry";
export default async function CommunityPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const routeParams = await params;
  return <MemberSiteForum siteId={routeParams.siteId} />;
}
