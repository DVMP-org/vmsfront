import { SiteForum } from "@/features/forum/ForumEntry";
export default function ForumCategoryPage({
  params,
}: {
  params: { categoryId: string };
}) {
  return <SiteForum categoryId={params.categoryId} />;
}
