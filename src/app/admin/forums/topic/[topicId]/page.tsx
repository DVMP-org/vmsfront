"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from "date-fns";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useAuth } from "@/hooks/use-auth";
import { toRenderableHtml, hasMeaningfulContent } from "@/lib/safe-html";
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
    <nav className="text-xs font-medium text-zinc-500">
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="hover:text-zinc-700 transition-colors"
      >
        Admin
      </button>
      {" / "}
      <button
        type="button"
        onClick={() => router.push("/admin/forums")}
        className="hover:text-zinc-700 transition-colors"
      >
        Forums
      </button>
      {" / "}
      {topic?.category?.id ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/forums/category/${topic.category.id}`)
          }
          className="hover:text-zinc-700 transition-colors"
        >
          {topic.category.name}
        </button>
      ) : (
        <span>Category</span>
      )}
      {" / "}
      <span className="text-zinc-900">Topic</span>
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
    <div className="flex flex-wrap items-center gap-1.5">
      {topic?.is_pinned && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          <Pin className="h-3 w-3 mr-0.5" />
          Pinned
        </span>
      )}
      {topic?.is_locked && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
          <Lock className="h-3 w-3 mr-0.5" />
          Locked
        </span>
      )}
      {topic?.is_deleted && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
          <Shield className="h-3 w-3 mr-0.5" />
          Deleted
        </span>
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
      <div className="space-y-4">
        {breadcrumbs}

        {/* Topic Header */}
        <div className="border border-foreground/20 rounded-lg bg-gradient-to-br from-muted to-foreground/10 shadow-sm">
          <div className="border-b border-foreground/20 bg-gradient-to-r from-muted to-foreground/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/admin/forums")}
                  className="h-8 px-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {topic?.title ?? "Loading topic..."}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                  {topicStatusChips}
                    <span className="text-xs text-muted-foreground">
                      {topic?.posts_count ?? 0} posts
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTopicModalOpen(true)}
                  className="h-8 text-xs"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_pinned: !topic?.is_pinned },
                    })
                  }
                  className="h-8 text-xs"
                >
                  {topic?.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_locked: !topic?.is_locked },
                    })
                  }
                  className="h-8 text-xs"
                >
                  {topic?.is_locked ? "Unlock" : "Lock"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    topicId &&
                    updateTopic.mutate({
                      topicId,
                      data: { is_deleted: !topic?.is_deleted },
                    })
                  }
                  className="h-8 text-xs"
                >
                  {topic?.is_deleted ? "Restore" : "Soft delete"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="h-8 text-xs"
                >
                  Hard delete
                </Button>
              </div>
            </div>
          </div>

          {/* Topic Metadata */}
          <div className="divide-y divide-foreground/20">
              {metaRows.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No metadata available
              </div>
              ) : (
                metaRows.map((meta) => (
                  <div key={meta.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {meta.label}
                    </span>
                    {meta.action ? (
                      <button
                        type="button"
                        onClick={meta.action}
                        className="text-sm font-medium text-foreground hover:text-muted-foreground hover:underline"
                      >
                        {meta.value}
                      </button>
                    ) : (
                        <span className="text-sm font-medium text-foreground">
                        {meta.value}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

          {/* Deleted Warning */}
            {topic?.is_deleted && (
            <div className="border-t border-foreground/20 bg-red-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This topic is hidden from residents</span>
                </div>
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
                  className="h-7 text-xs"
                  >
                    Restore
                </Button>
              </div>
              </div>
            )}
        </div>

        {/* Posts Section */}
        <div className="border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-foreground/20 bg-gradient-to-r from-muted to-foreground/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Discussion
            </h2>
          </div>
          <div className="p-0 bg-gradient-to-br from-muted to-foreground/10 min-h-[400px] max-h-[600px] overflow-y-auto">
            {postsQuery.isLoading ? (
              <div className="p-4">
              <TableSkeleton />
              </div>
            ) : posts.length === 0 ? (
                <div className="p-8">
              <EmptyState
                icon={MessageSquare}
                title="No posts yet"
                description="Use the composer to seed this discussion."
              />
                </div>
            ) : (
                  <>
                    <div className="space-y-2 p-3">
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
                    </div>
                <div ref={postsEndRef} />
                    <div className="border-t border-foreground/20 bg-foreground/10 px-4 py-3 sticky bottom-0">
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
                  </>
            )}
          </div>
        </div>

        {/* Reply Composer */}
        <div className="border border-foreground/20 rounded-lg shadow-sm">
          <div className="border-b border-foreground/20 bg-gradient-to-r from-muted to-foreground/10 px-4 py-3">
              <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Post Reply
                </h3>
                {topic?.is_locked && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  <Lock className="h-3 w-3 mr-0.5" />
                    Locked
                </span>
                )}
              </div>
          </div>
          <form onSubmit={handleComposerSubmit} className="p-4 space-y-3 bg-gradient-to-br from-muted to-foreground/10">
            <div className="rounded-xl border border-dashed border-foreground/20 bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              Formatting supported — use bold, italics, lists, quotes, code blocks, and links.
            </div>
            <RichTextEditor
                  value={composerValue}
              onChange={setComposerValue}
                  placeholder={
                    topic?.is_locked
                      ? "Replies are disabled when locked."
                      : "Share updates, decisions, or action items..."
                  }
              minHeight={150}
              className={topic?.is_locked ? "opacity-60 pointer-events-none" : ""}
                />
            <div className="flex items-center justify-end gap-2">
                  <Button
                    type="submit"
                size="sm"
                    disabled={
                      topic?.is_locked ||
                      !hasMeaningfulContent(composerValue) ||
                      createPost.isPending
                    }
                    isLoading={createPost.isPending}
                className="h-8 text-xs"
                  >
                Post Reply
                  </Button>
                </div>
              </form>
        </div>
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
      <style jsx global>{`
        /* Forum HTML Content Styling */
        .forum-html-content {
          line-height: 1.6;
        }
        
        .forum-html-content p {
          margin: 0.5em 0;
        }
        
        .forum-html-content p:first-child {
          margin-top: 0;
        }
        
        .forum-html-content p:last-child {
          margin-bottom: 0;
        }
        
        .forum-html-content h1,
        .forum-html-content h2,
        .forum-html-content h3,
        .forum-html-content h4,
        .forum-html-content h5,
        .forum-html-content h6 {
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          line-height: 1.3;
        }
        
        .forum-html-content h1 {
          font-size: 1.5em;
        }
        
        .forum-html-content h2 {
          font-size: 1.3em;
        }
        
        .forum-html-content h3 {
          font-size: 1.1em;
        }
        
        .forum-html-content h4,
        .forum-html-content h5,
        .forum-html-content h6 {
          font-size: 1em;
        }
        
        .forum-html-content ul,
        .forum-html-content ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        
        .forum-html-content li {
          margin: 0.25em 0;
        }
        
        .forum-html-content blockquote {
          margin: 0.75em 0;
          padding: 0.5em 1em;
          border-left: 3px solid;
          font-style: italic;
        }
        
        .forum-html-content code {
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .forum-html-content pre {
          margin: 0.75em 0;
          padding: 0.75em;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-size: 0.9em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .forum-html-content pre code {
          padding: 0;
          background: transparent;
        }
        
        .forum-html-content a {
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: opacity 0.2s;
        }
        
        .forum-html-content a:hover {
          opacity: 0.8;
        }
        
        /* Own message styling (white text) */
        .forum-content-own h1,
        .forum-content-own h2,
        .forum-content-own h3,
        .forum-content-own h4,
        .forum-content-own h5,
        .forum-content-own h6 {
          color: white;
        }
        
        .forum-content-own blockquote {
          border-left-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .forum-content-own code {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .forum-content-own pre {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        
        .forum-content-own a {
          color: rgba(255, 255, 255, 0.95);
        }
        
        /* Other messages styling (dark text) */
        .forum-content-other h1,
        .forum-content-other h2,
        .forum-content-other h3,
        .forum-content-other h4,
        .forum-content-other h5,
        .forum-content-other h6 {
          color: #18181b;
        }
        
        .forum-content-other blockquote {
          border-left-color: #d4d4d8;
          background: #f4f4f5;
          color: #3f3f46;
        }
        
        .forum-content-other code {
          background: #f4f4f5;
          color: #18181b;
        }
        
        .forum-content-other pre {
          background: #f4f4f5;
          color: #18181b;
        }
        
        .forum-content-other a {
          color: var(--brand-primary, #213928);
        }
      `}</style>
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

  const formatTimestamp = (dateString: string | null | undefined): { display: string; full: string } => {
    if (!dateString) return { display: "—", full: "—" };
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = differenceInDays(now, date);

    let display: string;
    if (isToday(date)) {
      display = format(date, "h:mm a");
    } else if (isYesterday(date)) {
      display = `Yesterday ${format(date, "h:mm a")}`;
    } else if (daysDiff < 7) {
      display = format(date, "EEE h:mm a");
    } else if (daysDiff < 365) {
      display = format(date, "MMM d, h:mm a");
    } else {
      display = format(date, "MMM d, yyyy h:mm a");
    }

    const full = format(date, "PPpp"); // Full date and time
    return { display, full };
  };

  const timestamp = formatTimestamp(post.created_at);
  const editedTimestamp = post.edited_at ? formatTimestamp(post.edited_at) : null;
  console.log(post);
  console.log(post.edited_at);
  const displayName = post.posted_by_admin
    ? "Admin"
    : post.author_name || post.author?.email || "Resident";
  const houseLabel = post.house?.name || topicHouseName || null;
  const isOwn = viewerId ? post.author_id === viewerId : false;

  return (
    <div className={cn("flex w-full mb-2 group", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[70%] gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar/Icon */}
          {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center border border-foreground/20">
            <span className="text-xs font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Post Bubble */}
        <div className={cn("flex-1 min-w-0")}>
          <div
            className={cn(
              "rounded-xl px-3 py-2 shadow-sm",
              isOwn
                ? "bg-gradient-to-br from-[var(--brand-primary,#213928)_10%] to-[var(--brand-secondary,#64748b)_80%] text-white"
                : "bg-white border border-zinc-200/80 text-zinc-900"
            )}
          >
            {/* Post Header - Compact Inline */}
            <div className={cn("flex items-center gap-2 mb-1", isOwn ? "justify-end" : "justify-start")}>
              <span className={cn("text-xs font-semibold", isOwn ? "text-white" : "text-zinc-900")}>
                {displayName} | {houseLabel}
              </span>
              {post.posted_by_admin && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                    isOwn
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text--[vare(--brand-primary,#213928)]"
                  )}
                >
                  Admin
            </span>
              )}
              <span
                className={cn("text-[10px]", isOwn ? "text-white/70" : "text-zinc-500")}
                title={timestamp.full}
              >
                {timestamp.display}
              </span>
          <ActionMenu
            size="sm"
            triggerClassName={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isOwn &&
                "bg-white/20 text-white border-white/20 hover:bg-white/30 hover:text-white"
            )}
            options={[
              {
                label: isEditing ? "Cancel edit" : "Edit",
                onClick: () => setIsEditing((prev) => !prev),
                disabled: post.is_deleted || topicLocked,
              },
              {
                label: post.is_deleted ? "Restore" : "Soft delete",
                icon: Shield,
                onClick: onToggleDelete,
              },
            ]}
          />
        </div>

            {/* Post Content */}
          {isEditing ? (
              <div className="space-y-2 pt-1">
              <textarea
                  rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                  className="w-full border border-zinc-200 rounded-lg bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
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
                    className="h-6 text-xs px-2"
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
                    className="h-6 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
                <div className="pt-0.5">
                  <div
                    className={cn(
                      "text-sm leading-relaxed break-words forum-content",
                      isOwn ? "text-white forum-content-own" : "text-zinc-900 forum-content-other",
                      post.is_deleted && "line-through opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-none break-words text-sm forum-html-content",
                        isOwn ? "forum-content-own" : "forum-content-other"
                      )}
                      dangerouslySetInnerHTML={{ __html: toRenderableHtml(post.content ?? "") }}
                    />
                  </div>
          {post.attachments && post.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment.url}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 border rounded-md px-2 py-0.5 text-xs transition-colors",
                    isOwn
                      ? "border-white/30 text-white hover:bg-white/20"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.name || "Attachment"}
                </a>
              ))}
            </div>
          )}
                  {editedTimestamp && (
                    <span 
                      className={cn("text-[10px] block mt-1", isOwn ? "text-white/70" : "text-zinc-500")}
                      title={`Edited: ${editedTimestamp.full}`}
                    >
                      Edited {editedTimestamp.display}
                    </span>
                  )}
                  {post.is_deleted && (
                    <span className={cn("text-[10px] block mt-1 font-medium", isOwn ? "text-red-200" : "text-red-600")}>
                      Deleted
                </span>
              )}
            </div>
          )}
        </div>

          {/* Status Messages */}
          {post.is_deleted && !isOwn && (
            <p className="text-[10px] text-red-600 font-medium mt-0.5 px-1">
            Deleted · visible to admins only
          </p>
        )}
        </div>

        {/* Right side avatar for own messages */}
        {isOwn && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary,#213928)_80%] to-[var(--brand-primary,#213928)_30%] flex items-center justify-center border border-[var(--brand-primary,#213928)_90%]">
            <span className="text-xs font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
