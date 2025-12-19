"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import {
  useCreateForumPost,
  useForumPosts,
  useForumTopic,
} from "@/hooks/use-forum";
import { cn, getInitials } from "@/lib/utils";
import {
  hasMeaningfulContent,
  sanitizeHtml,
  stripHtml,
  toRenderableHtml,
} from "@/lib/safe-html";
import {
  MessageSquare,
  Quote,
  Home as HomeIcon,
  ArrowLeft,
  Clock4,
  FolderOpen,
  ChevronDown,
  Paperclip,
  X,
  Eye,
  Users,
  ChevronRight,
  MoreVertical,
  UploadCloud,
  FileText,
  Loader2,
  Send,
} from "lucide-react";

type PendingAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
};

export default function ForumTopicPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string; topicId?: string }>();
  const rawHouseId = params?.houseId;
  const rawTopicId = params?.topicId;
  const houseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const topicId = Array.isArray(rawTopicId) ? rawTopicId[0] : rawTopicId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const effectiveHouseId = houseId ?? selectedHouse?.id ?? null;

  useEffect(() => {
    if (!houseId || !profile?.houses) return;
    if (selectedHouse?.id === houseId) return;
    const match = profile.houses.find((h) => h.id === houseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [houseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

  const { data: topic, isLoading: isTopicLoading } = useForumTopic(
    effectiveHouseId,
    topicId ?? null
  );

  const [page, setPage] = useState(1);
  const pageSize = 15;
  const {
    data: postsResponse,
    isLoading: isPostsLoading,
  } = useForumPosts(effectiveHouseId, topicId ?? null, page, pageSize);
  const posts = useMemo(
    // @ts-expect-error – PaginatedResponse may be array in this branch
    () => postsResponse?.items ?? [],
    // @ts-expect-error – PaginatedResponse may be array in this branch
    [postsResponse?.items]
  );
  // @ts-expect-error – PaginatedResponse may be array in this branch
  const totalPages = postsResponse?.total_pages ?? 0;

  const [content, setContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [activeActionPostId, setActiveActionPostId] = useState<string | null>(null);
  const [recentPostId, setRecentPostId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const replyFormRef = useRef<HTMLFormElement | null>(null);
  const repliesContainerRef = useRef<HTMLDivElement | null>(null);
  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  const createPost = useCreateForumPost();
  const viewerId = profile?.user?.id ?? null;
  const canSubmit = hasMeaningfulContent(content);

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveHouseId || !topicId) return;
    const safeContent = sanitizeHtml(content).trim();
    if (!hasMeaningfulContent(safeContent)) return;
    const attachmentsPayload =
      pendingAttachments.length > 0
        ? pendingAttachments.map((attachment) => ({
            name: attachment.name,
            mime: attachment.type,
            url: attachment.dataUrl,
          }))
        : undefined;
    createPost.mutate(
      {
        houseId: effectiveHouseId,
        data: {
          topic_id: topicId,
          content: safeContent,
          ...(attachmentsPayload ? { attachments: attachmentsPayload } : {}),
        },
      },
      {
        onSuccess: (response) => {
          setContent("");
          setPendingAttachments([]);
          if (attachmentInputRef.current) {
            attachmentInputRef.current.value = "";
          }
          setRecentPostId(response.data.id);
        },
      }
    );
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(file);
      });

    const selectedFiles = await Promise.all(
      Array.from(fileList).map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await toDataUrl(file),
      }))
    );

    setPendingAttachments((prev) => [...prev, ...selectedFiles]);
  };

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
    event.target.value = "";
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await processFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleFloatingSubmit = () => {
    if (!canSubmit || createPost.isPending) return;
    replyFormRef.current?.requestSubmit();
  };

  const removeAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  useEffect(() => {
    setExpandedPosts({});
  }, [page, topicId]);

  useEffect(() => {
    if (activeActionPostId && !posts.some((post) => post.id === activeActionPostId)) {
      setActiveActionPostId(null);
    }
  }, [activeActionPostId, posts]);

  useEffect(() => {
    if (!recentPostId) return;
    if (posts.some((post) => post.id === recentPostId)) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      const timeout = setTimeout(() => setRecentPostId(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [posts, recentPostId]);

  const participantCount = useMemo(() => {
    const unique = new Set<string>();
    posts.forEach((post) => {
      if (post.author_id) {
        unique.add(post.author_id);
      }
    });
    return unique.size;
  }, [posts]);

  const breadcrumbItems = useMemo(() => {
    const base = [
      { label: "Forums", href: effectiveHouseId ? `/house/${effectiveHouseId}/forum` : "/forum" },
      { label: selectedHouse?.name ?? "House", href: "#" },
    ];
    if (topic?.category) {
      base.push({
        label: topic.category.name,
        href: effectiveHouseId
          ? `/house/${effectiveHouseId}/forum/category/${topic.category.id}`
          : "#",
      });
    }
    base.push({ label: topic?.title ?? "Topic", href: "#" });
    return base;
  }, [effectiveHouseId, selectedHouse?.name, topic?.category, topic?.title]);

  const isLoading = isTopicLoading || isPostsLoading;

  if (!effectiveHouseId) {
    return (
      <DashboardLayout type="resident">
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector before opening topics."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="resident">
      <div className="space-y-6 pb-24">
        <section className="sticky top-0 z-20 rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] text-white shadow-xl">
          <div className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="flex flex-wrap items-center gap-1 text-xs text-white/70" aria-label="Breadcrumb">
                {breadcrumbItems.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
                    {index === 0 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-white transition hover:text-white/80"
                        onClick={() => {
                          if (item.href && item.href !== "#") {
                            router.push(item.href);
                          }
                        }}
                      >
                        Forums
                      </button>
                    ) : (
                      <span className="text-white/80">{item.label}</span>
                    )}
                    {index < breadcrumbItems.length - 1 && <ChevronRight className="h-3 w-3" />}
                  </span>
                ))}
              </nav>
              <div className="flex flex-wrap gap-2">
                {topic?.is_pinned && (
                  <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                    Pinned
                  </Badge>
                )}
                {topic?.is_locked && (
                  <Badge variant="danger" className="bg-rose-200 text-rose-800">
                    Locked
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to category
                </button>
                {topic?.category && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/house/${effectiveHouseId}/forum/category/${topic.category_id}`
                      )
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-sm text-white/90 hover:border-white"
                  >
                    <FolderOpen className="h-4 w-4" />
                    {topic.category.name}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  {topic?.title ?? "Topic"}
                </h1>
                <p className="text-sm text-white/80">
                  Keep everyone informed with thoughtful updates and actionable follow-ups.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-white/90 md:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/70">Replies</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  {/* @ts-expect-error – PaginatedResponse may be array in this branch */}
                  {postsResponse?.total || 0}{" "}
                  {/* @ts-expect-error – PaginatedResponse may be array in this branch */}
                  {postsResponse?.total === 1 ? "reply" : "replies"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/70">Participants</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-4 w-4" />
                  {participantCount || 1}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/70">Last updated</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <Clock4 className="h-4 w-4" />
                  {topic?.last_post_at
                    ? formatDistanceToNow(new Date(topic.last_post_at), { addSuffix: true })
                    : "Just now"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-none shadow-lg shadow-slate-200/60 overflow-hidden">
          <CardHeader>
            <CardTitle>
              {/* @ts-expect-error – PaginatedResponse may be array in this branch */}
              {postsResponse?.total || 0}{" "}
              {/* @ts-expect-error – PaginatedResponse may be array in this branch */}
              {postsResponse?.total === 1 ? "reply" : "replies"}
            </CardTitle>
            <CardDescription>
              Stay courteous and keep feedback action-oriented.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : posts.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={MessageSquare}
                    title="No replies yet"
                    description="Kick off the conversation with the first response."
                  />
                </div>
            ) : (
              <div
                ref={repliesContainerRef}
                    className="bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-50 min-h-[400px] max-h-[600px] overflow-y-auto p-3 space-y-2"
              >
                {posts.map((post, index) => {
                  const authorName =
                    post.author?.first_name || post.author?.last_name
                      ? `${post.author?.first_name ?? ""} ${
                          post.author?.last_name ?? ""
                        }`.trim()
                      : post.author?.email ?? "Resident";
                  const isOwnPost = viewerId ? post.author_id === viewerId : false;
                  const isAdminPost = Boolean(post.posted_by_admin);
                  const attachments = post.attachments ?? [];
                  const hasAttachments = attachments.length > 0;
                  const isExpanded = !!expandedPosts[post.id];
                  const normalizedContent = post.content ?? "";
                  const approximateLength = stripHtml(normalizedContent).length;
                  const renderableContent = toRenderableHtml(normalizedContent);
                  const shouldClamp = !isExpanded && approximateLength > 420;
                  const initials = getInitials(post.author?.first_name, post.author?.last_name);
                  const avatarLabel = isAdminPost
                    ? "AD"
                    : initials || authorName.charAt(0).toUpperCase();
                  const displayName = isAdminPost ? "Estate Adminstrator" : authorName;
                  const isRecentlyCreated = recentPostId === post.id;
                  const isRecent =
                    post.created_at &&
                    Date.now() - new Date(post.created_at).getTime() < 1000 * 60 * 60 * 6;
                  const alternatingNeutral = index % 2 === 0;
                  const houseLabel = isAdminPost ? "" : "| " + (post.house?.name || "| " + (selectedHouse?.name || "House"));

                  // Format timestamp
                  const formatTimestamp = (dateString: string | null | undefined): { display: string; full: string } => {
                    if (!dateString) return { display: "Just now", full: "—" };
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

                    const full = format(date, "PPpp");
                    return { display, full };
                  };

                  const timestamp = formatTimestamp(post.created_at);
                  const editedTimestamp = post.edited_at ? formatTimestamp(post.edited_at) : null;
                  return (
                    <div
                      key={post.id}
                      className={cn(
                        "flex w-full mb-2 group",
                        isOwnPost ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn("flex max-w-[70%] gap-2", isOwnPost ? "flex-row-reverse" : "flex-row")}>
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border text-xs font-semibold uppercase",
                            isOwnPost
                              ? "bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] border-[var(--brand-primary,#213928)] text-white"
                              : "bg-gradient-to-br from-zinc-200 to-zinc-300 border-zinc-300 text-zinc-600"
                          )}
                        >
                          {avatarLabel}
                        </div>
                        <article
                          className={cn(
                            "flex-1 min-w-0 rounded-xl px-3 py-2 shadow-sm",
                            isOwnPost
                              ? "bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] text-white"
                              : "bg-white border border-zinc-200/80 text-zinc-900",
                            isRecentlyCreated && "ring-2 ring-amber-300"
                          )}
                        >
                          {/* Post Header - Compact Inline */}
                          <div className={cn("flex items-center gap-2 mb-1", isOwnPost ? "justify-end" : "justify-start")}>
                            <span className={cn("text-xs font-semibold", isOwnPost ? "text-white" : "text-zinc-900")}>
                              {displayName}  {houseLabel}
                            </span>
                            {isAdminPost && (
                              <span
                                className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  isOwnPost
                                    ? "bg-white/20 text-white"
                                    : "bg-blue-100 text-blue-700"
                                )}
                              >
                                Admin
                              </span>
                            )}
                            <span
                              className={cn("text-[10px]", isOwnPost ? "text-white/70" : "text-zinc-500")}
                              title={timestamp.full}
                            >
                              {timestamp.display}
                            </span>
                            {editedTimestamp && (
                              <span 
                                className={cn("text-[10px]", isOwnPost ? "text-white/70" : "text-zinc-500")}
                                title={`Edited: ${editedTimestamp.full}`}
                              >
                                · Edited {editedTimestamp.display}
                              </span>
                            )}
                            {hasAttachments && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px]",
                                  isOwnPost ? "text-white/70" : "text-zinc-500"
                                )}
                              >
                                <Paperclip className="h-3 w-3" />
                                {attachments.length}
                              </span>
                            )}
                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveActionPostId((prev) => (prev === post.id ? null : post.id))
                                }
                                className={cn(
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full border transition",
                                  isOwnPost
                                    ? "border-white/30 text-white hover:bg-white/20"
                                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                )}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                              {activeActionPostId === post.id && (
                                <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl z-10">
                                  {["Edit", "Report", "Delete", "Copy link"].map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
                                      onClick={() => setActiveActionPostId(null)}
                                    >
                                      {action}
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="pt-0.5">
                            <div
                              className={cn(
                                "text-sm leading-relaxed break-words forum-content",
                                isOwnPost ? "text-white" : "text-zinc-900",
                                shouldClamp && "max-h-32 overflow-hidden relative"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-none break-words text-sm forum-html-content",
                                  isOwnPost ? "forum-content-own" : "forum-content-other"
                                )}
                                dangerouslySetInnerHTML={{ __html: renderableContent }}
                              />
                              {shouldClamp && !isExpanded && (
                                <div
                                  className={cn(
                                    "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t",
                                    isOwnPost
                                      ? "from-blue-600 via-blue-600/70 to-transparent"
                                      : "from-white via-white/60 to-transparent"
                                  )}
                                />
                              )}
                            </div>
                            {hasAttachments && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {attachments.map((attachment, index) => (
                                  <a
                                    key={`${post.id}-attachment-${index}`}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-1 border rounded-md px-2 py-0.5 text-xs transition-colors",
                                      isOwnPost
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
                            {approximateLength > 420 && (
                              <button
                                type="button"
                                onClick={() => togglePostExpansion(post.id)}
                                className={cn(
                                  "text-[10px] font-medium mt-1 transition hover:underline",
                                  isOwnPost ? "text-white/80" : "text-zinc-500"
                                )}
                              >
                                {isExpanded ? "Show less" : "Read more"}
                              </button>
                            )}
                          </div>
                        </article>
                      </div>
                    </div>
                  );
                })}
                <div ref={repliesEndRef} />
              </div>
            )}
            {totalPages > 1 && (
              <div className="border-t border-zinc-200 bg-white px-4 py-3 sticky bottom-0">
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  // @ts-expect-error – PaginatedResponse may be array in this branch
                  total={postsResponse?.total ?? posts.length}
                  totalPages={totalPages}
                  resourceLabel="replies"
                  onChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-200/60 lg:sticky lg:bottom-4">
          <CardHeader>
            <CardTitle>Create a Reply</CardTitle>
            <CardDescription>
              Share an update or ask a follow-up question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topic?.is_locked ? (
              <EmptyState
                icon={Quote}
                title="Topic locked"
                description="An admin or house moderator has locked this conversation."
              />
            ) : (
              <form
                ref={replyFormRef}
                className="space-y-4"
                onSubmit={handleCreatePost}
              >
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-2 text-xs text-zinc-600">
                    Formatting supported — use bold, italics, lists, quotes, code blocks, and links to keep conversations clear.
                </div>
                  <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Share an update, ask a follow-up question, or tag a neighbour."
                    minHeight={180}
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition",
                    isDragging
                      ? "border-[var(--brand-primary,#213928)] bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]"
                      : "border-border/80 text-muted-foreground"
                  )}
                >
                  <UploadCloud className="mx-auto mb-2 h-6 w-6" />
                  Drag & drop files here or{" "}
                  <button
                    type="button"
                      className="font-semibold text-[var(--brand-primary,#213928)] underline-offset-2 hover:underline"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    browse
                  </button>
                </div>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleAttachmentChange}
                  className="hidden"
                />
                {pendingAttachments.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pending attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pendingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                            <p className="text-[10px] uppercase text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-muted-foreground transition hover:text-destructive"
                            aria-label={`Remove ${attachment.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Accepted: images, PDF, DOCX, XLSX.
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Replies are visible to everyone in this house.
                    </span>
                  </div>
                  <Button
                    type="submit"
                    isLoading={createPost.isPending}
                      disabled={!canSubmit}
                      className="hidden lg:inline-flex"
                  >
                    Post reply
                  </Button>
                </div>
              </form>
            )}

            <Button
              type="button"
              onClick={handleFloatingSubmit}
              disabled={!canSubmit || createPost.isPending}
              className={cn(
                "fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary,#213928)] text-white shadow-2xl transition lg:hidden",
                canSubmit
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              )}
            >
              {createPost.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
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
