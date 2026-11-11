import { SiteForum } from "@/features/forum/ForumEntry";
export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const routeParams = await params;
  return <SiteForum categoryId={routeParams.categoryId} />;
}
