"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Lock,
  MessageSquare,
  Paperclip,
  Pin,
  Shield,
  Unlock,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAdminHouses } from "@/hooks/use-admin";
import {
  useAdminForumCategories,
  useAdminForumTopic,
  useAdminForumPosts,
  useUpdateAdminForumTopic,
  useDeleteAdminForumTopic,
  useCreateAdminForumPost,
  useUpdateAdminForumPost,
} from "@/hooks/use-admin-forum";
import { ActionMenu } from "@/app/admin/forums/components/ActionMenu";
import {
  TopicFormModal,
  ConfirmActionModal,
} from "@/app/admin/forums/components/ForumModals";
import type { ForumPost } from "@/types";

export default function AdminForumTopicDetailPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params?.topicId ?? null;
  const router = useRouter();

  const topicQuery = useAdminForumTopic(topicId);
  const topic = topicQuery.data;
  const { user } = useAuth();
  const [postsPage, setPostsPage] = useState(1);
  const postsQuery = useAdminForumPosts(topicId, {
    page: postsPage,
    pageSize: 10,
  });
  const { data: housesData } = useAdminHouses({
    page: 1,
    pageSize: 500,
  });
  const houses = housesData?.items ?? [];
  const categoriesQuery = useAdminForumCategories({
    page: 1,
    pageSize: 100,
    houseId: topic?.house_id,
  });

  const updateTopic = useUpdateAdminForumTopic();
  const deleteTopic = useDeleteAdminForumTopic();
  const createPost = useCreateAdminForumPost();
  const updatePost = useUpdateAdminForumPost();

  const posts = postsQuery.data?.items ?? [];
  const totalPosts = postsQuery.data?.total ?? posts.length;
  const totalPostPages = postsQuery.data?.total_pages ?? 1;

  const [composerValue, setComposerValue] = useState("");
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const postsEndRef = useRef<HTMLDivElement | null>(null);
  const viewerId = user?.id ?? null;
  const categoriesForModal = useMemo(() => {
    const fetched = categoriesQuery.data?.items ?? [];
    if (fetched.length > 0) {
      return fetched;
    }
    return topic?.category ? [topic.category] : [];
  }, [categoriesQuery.data?.items, topic?.category]);

  useEffect(() => {
    setPostsPage(1);
  }, [topicId]);

  const breadcrumbs = (
    <nav className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="transition hover:text-foreground"
      >
        Admin
      </button>{" "}
      /{" "}
      <button
        type="button"
        onClick={() => router.push("/admin/forums")}
        className="transition hover:text-foreground"
      >
        Forums
      </button>{" "}
      /{" "}
      {topic?.category?.id ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/forums/category/${topic.category.id}`)
          }
          className="transition hover:text-foreground"
        >
          {topic.category.name}
        </button>
      ) : (
        <span>Category</span>
      )}{" "}
      / <span className="text-foreground">Topic</span>
    </nav>
  );

  const handleComposerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topicId || composerValue.trim().length === 0) return;
    createPost.mutate(
      {
        topic_id: topicId,
        content: composerValue.trim(),
      },
      {
        onSuccess: () => {
          setComposerValue("");
          setTimeout(() => {
            postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 150);
        },
      }
    );
  };

  const topicStatusChips = (
    <div className="flex flex-wrap items-center gap-2">
      {topic?.is_pinned && (
        <Badge variant="warning" className="gap-1">
          <Pin className="h-3 w-3" />
          Pinned
        </Badge>
      )}
      {topic?.is_locked && (
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Locked
        </Badge>
      )}
      {topic?.is_deleted && (
        <Badge variant="danger" className="gap-1">
          <Shield className="h-3 w-3" />
          Deleted
        </Badge>
      )}
    </div>
  );

  const metaRows = [
    topic?.category?.name && {
      label: "Category",
      value: topic.category.name,
      action: () =>
        router.push(`/admin/forums/category/${topic.category?.id}`),
    },
    topic?.house?.name && {
      label: "House",
      value: topic.house.name,
    },
    topic?.author_name && {
      label: "Created by",
      value: topic.author_name,
    },
    topic?.last_post_at && {
      label: "Last activity",
      value: formatDistanceToNow(new Date(topic.last_post_at), {
        addSuffix: true,
      }),
    },
  ].filter(Boolean) as { label: string; value: string; action?: () => void }[];

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        {breadcrumbs}
        <Card className="rounded-3xl border border-dashed">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => router.push("/admin/forums")}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to forums
                </button>
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl text-foreground">
                    {topic?.title ?? "Loading topic..."}
                  </CardTitle>
                  {topicStatusChips}
                </div>
                <CardDescription>
                  {topic?.posts_count ?? 0} posts ·{" "}
                  {topic?.forum_posts?.length ?? posts.length} loaded
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setTopicModalOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_pinned: !topic?.is_pinned },
                    })
                  }
                >
                  {topic?.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_locked: !topic?.is_locked },
                    })
                  }
                >
                  {topic?.is_locked ? "Unlock" : "Lock"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_deleted: !topic?.is_deleted },
                    })
                  }
                >
                  {topic?.is_deleted ? "Restore" : "Soft delete"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Hard delete
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:grid-cols-2">
              {metaRows.length === 0 ? (
                <p>No metadata available.</p>
              ) : (
                metaRows.map((meta) => (
                  <div key={meta.label} className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide">
                      {meta.label}
                    </span>
                    {meta.action ? (
                      <button
                        type="button"
                        onClick={meta.action}
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {meta.value}
                      </button>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {meta.value}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {topic?.is_deleted && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This topic is hidden from residents.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      topicId &&
                      updateTopic.mutate({
                        topicId,
                        data: { is_deleted: false },
                      })
                    }
                  >
                    Restore
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Archive
                    <Badge
                      variant="warning"
                      className="ml-2 text-[10px] uppercase"
                    >
                      Future hook
                    </Badge>
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {postsQuery.isLoading ? (
              <TableSkeleton />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No posts yet"
                description="Use the composer to seed this discussion."
              />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    viewerId={viewerId}
                    topicHouseName={topic?.house?.name}
                    onUpdate={(data) =>
                      topicId &&
                      updatePost.mutate({
                        topicId,
                        postId: post.id,
                        data,
                      })
                    }
                    onToggleDelete={() =>
                      topicId &&
                      updatePost.mutate({
                        topicId,
                        postId: post.id,
                        data: { is_deleted: !post.is_deleted },
                      })
                    }
                    topicLocked={Boolean(topic?.is_locked)}
                  />
                ))}
                <div ref={postsEndRef} />
                <PaginationBar
                  page={postsPage}
                  totalPages={totalPostPages}
                  total={totalPosts}
                  pageSize={10}
                  resourceLabel="posts"
                  onChange={setPostsPage}
                  isFetching={postsQuery.isFetching}
                />
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-border/70 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Admin composer
                </h3>
                {topic?.is_locked && (
                  <Badge variant="warning" className="gap-1 text-xs uppercase">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Post as admin or moderator. Attachments coming soon.
              </p>
              <form onSubmit={handleComposerSubmit} className="mt-3 space-y-3">
                <textarea
                  rows={4}
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  placeholder={
                    topic?.is_locked
                      ? "Replies are disabled when locked."
                      : "Share updates, decisions, or action items..."
                  }
                  disabled={topic?.is_locked}
                  className="w-full rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variant="outline" size="sm" disabled>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach file
                    <Badge
                      variant="warning"
                      className="ml-2 text-[10px] uppercase"
                    >
                      Future hook
                    </Badge>
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      topic?.is_locked ||
                      composerValue.trim().length === 0 ||
                      createPost.isPending
                    }
                    isLoading={createPost.isPending}
                  >
                    Post reply
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      <TopicFormModal
        isOpen={topicModalOpen}
        mode="edit"
        houses={houses}
        categories={categoriesForModal}
        defaultHouseId={topic?.house_id || topic?.house?.id}
        initialValues={
          topic
            ? {
                houseId: topic.house_id || topic.house?.id || "",
                categoryId: topic.category_id,
                title: topic.title,
                content: topic.initial_post?.content ?? "",
                isPinned: topic.is_pinned,
                isLocked: topic.is_locked,
              }
            : undefined
        }
        onClose={() => setTopicModalOpen(false)}
        onSubmit={(values) => {
          if (!topicId) return;
          updateTopic.mutate(
            {
              topicId,
              data: {
                title: values.title,
                category_id: values.categoryId,
                is_locked: values.isLocked,
                is_pinned: values.isPinned,
              },
            },
            {
              onSuccess: () => setTopicModalOpen(false),
            }
          );
        }}
        isSubmitting={updateTopic.isPending}
      />

      <ConfirmActionModal
        isOpen={confirmDeleteOpen}
        title="Hard delete topic"
        description="This permanently removes the topic and its posts."
        confirmLabel="Delete topic"
        tone="destructive"
        onConfirm={() => {
          if (!topicId) return;
          deleteTopic.mutate(topicId, {
            onSuccess: () => {
              setConfirmDeleteOpen(false);
              router.push("/admin/forums");
            },
          });
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
        isLoading={deleteTopic.isPending}
      />
    </DashboardLayout>
  );
}

function PostItem({
  post,
  viewerId,
  topicHouseName,
  onUpdate,
  onToggleDelete,
  topicLocked,
}: {
  post: ForumPost;
  viewerId: string | null;
  topicHouseName?: string | null;
  onUpdate: (data: { content?: string }) => void;
  onToggleDelete: () => void;
  topicLocked: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);

  useEffect(() => {
    setDraft(post.content);
  }, [post.content]);

  const timestamp = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : "—";
  const isOwn = viewerId ? post.author_id === viewerId : false;
  const displayName = post.posted_by_admin
    ? "Admin"
    : post.author_name || post.author?.email || "Resident";
  const houseLabel = post.house?.name || topicHouseName || null;
  const bubbleClasses = cn(
    "rounded-2xl border px-4 py-3 shadow-sm space-y-3 max-w-xl",
    isOwn
      ? "bg-[var(--brand-primary,#213928)] text-white border-transparent"
      : "bg-white text-foreground border-border/70"
  );
  const metaRowClasses = cn(
    "flex items-center gap-2 text-xs uppercase tracking-wide",
    isOwn ? "justify-end text-white/80" : "justify-start text-muted-foreground"
  );
  const bodyTextClasses = cn(
    "text-sm whitespace-pre-wrap",
    post.is_deleted
      ? isOwn
        ? "text-white/70 line-through"
        : "text-muted-foreground line-through"
      : undefined
  );
  const attachmentClasses = cn(
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
    isOwn
      ? "border-white/40 text-white hover:border-white/70"
      : "border-border text-foreground hover:border-primary"
  );

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-3xl flex-col gap-2", isOwn && "items-end text-right")}>
        <div className={cn(metaRowClasses, "w-full")}>
          {!isOwn && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <UserCircle className="h-4 w-4" />
            </span>
          )}
          <div className="flex flex-col gap-1 text-left">
            <span className={cn("text-sm font-semibold", isOwn && "text-white")}>
              {displayName}
            </span>
            <span className="text-[11px] font-medium tracking-normal">
              {timestamp}
            </span>
          </div>
          <ActionMenu
            size="sm"
            triggerClassName={cn(
              isOwn &&
                "bg-white/20 text-white border-white/20 hover:bg-white/30 hover:text-white"
            )}
            options={[
              {
                label: isEditing ? "Cancel edit" : "Edit",
                onClick: () => setIsEditing((prev) => !prev),
                disabled: post.is_deleted,
              },
              {
                label: post.is_deleted ? "Restore" : "Soft delete",
                icon: Shield,
                onClick: onToggleDelete,
              },
              {
                label: "Escalate",
                badge: "Future hook",
                onClick: () => {},
                disabled: true,
              },
            ]}
          />
        </div>
        <div className={bubbleClasses} data-deleted={post.is_deleted}>
          {post.posted_by_admin && (
            <Badge
              variant="warning"
              className={cn(
                "text-[10px] uppercase tracking-wide",
                isOwn ? "text-white bg-white/20" : undefined
              )}
            >
              Posted by Admin
            </Badge>
          )}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="w-full rounded-2xl border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onUpdate({ content: draft });
                    setIsEditing(false);
                  }}
                  disabled={draft.trim().length === 0}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(post.content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className={bodyTextClasses}>{post.content}</p>
          )}
          {post.attachments && post.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment.url}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={attachmentClasses}
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.name || "Attachment"}
                </a>
              ))}
            </div>
          )}
          {(houseLabel || post.posted_by_admin) && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide",
                isOwn ? "justify-end text-white/70" : "text-muted-foreground"
              )}
            >
              {houseLabel && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                    isOwn ? "border-white/30" : "border-border"
                  )}
                >
                  <Building2 className="h-3 w-3" />
                  {houseLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {post.is_deleted && (
          <p className="text-xs uppercase tracking-wide text-red-500">
            Deleted · visible to admins only
          </p>
        )}
        {topicLocked && (
          <p className="text-xs text-muted-foreground">
            Thread is locked. Only admins can edit posts.
          </p>
        )}
      </div>
    </div>
  );
}
