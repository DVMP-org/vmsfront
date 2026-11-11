"use client";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { usePlaceWorkspace } from "@/features/place-workspace/PlaceWorkspaceShell";
import { CommunityForum } from "./CommunityForum";
import { ForumStatus } from "./ForumStatus";

export function SiteForum({
  topicId,
  categoryId,
}: {
  topicId?: string;
  categoryId?: string;
}) {
  const query = useWorkspaceContext();
  if (query.isPending) return <ForumStatus loading />;
  if (query.isError)
    return <ForumStatus error={query.error} retry={() => query.refetch()} />;
  if (!query.data?.site_id)
    return <ForumStatus message="Select a Site to open its community forum." />;
  if (!query.data.modules.includes("forum"))
    return <ForumStatus message="Community forum is disabled for this Site." />;
  return (
    <CommunityForum
      key={query.data.site_id}
      scope={{ type: "site", id: query.data.site_id }}
      basePath="/admin/forums"
      topicId={topicId}
      initialCategory={categoryId}
    />
  );
}
export function PlaceForum({ topicId }: { topicId?: string }) {
  const context = usePlaceWorkspace();
  if (!context.modules.includes("forum"))
    return <ForumStatus message="Community forum is disabled for this Site." />;
  return (
    <CommunityForum
      key={context.place.id}
      scope={{ type: "place", id: context.place.id }}
      basePath={`/workspace/${context.place.id}/forums`}
      topicId={topicId}
    />
  );
}

export function MemberSiteForum({
  siteId,
  topicId,
}: {
  siteId: string;
  topicId?: string;
}) {
  return (
    <CommunityForum
      key={siteId}
      scope={{ type: "site", id: siteId }}
      basePath={`/community/${siteId}`}
      topicId={topicId}
    />
  );
}
