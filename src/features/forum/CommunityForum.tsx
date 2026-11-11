"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { forumApi, type ForumScope } from "./api";
import { ForumStatus } from "./ForumStatus";
import { DiscussionList } from "./DiscussionList";
import { Discussion } from "./Discussion";
export function CommunityForum({
  scope,
  basePath,
  topicId,
  initialCategory,
}: {
  scope: ForumScope;
  basePath: string;
  topicId?: string;
  initialCategory?: string;
}) {
  const organization = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const client = useQueryClient();
  const api = forumApi(scope);
  const key = ["site-forum", organization?.id, user?.id, scope.type, scope.id];
  const query = useQuery({
    queryKey: [...key, "context"],
    queryFn: api.context,
    retry: false,
  });
  const refresh = () =>
    client.invalidateQueries({
      queryKey: ["site-forum", organization?.id, user?.id],
    });
  if (query.isPending) return <ForumStatus loading />;
  if (query.isError)
    return <ForumStatus error={query.error} retry={() => query.refetch()} />;
  return (
    <div className="space-y-6 text-[var(--vms-ink)]">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/community/${query.data.site_id}${topicId ? `/topic/${topicId}` : ""}`,
              );
              toast.success("Community link copied");
            } catch {
              toast.error("Could not copy the community link");
            }
          }}
        >
          Copy community link
        </Button>
      </div>
      {topicId ? (
        <Discussion
          key={`${scope.id}:${topicId}`}
          api={api}
          context={query.data}
          queryKey={key}
          topicId={topicId}
          basePath={basePath}
          refresh={refresh}
        />
      ) : (
        <DiscussionList
          key={`${scope.id}:${initialCategory ?? "all"}`}
          api={api}
          context={query.data}
          queryKey={key}
          basePath={basePath}
          initialCategory={initialCategory}
          refresh={refresh}
        />
      )}
    </div>
  );
}
