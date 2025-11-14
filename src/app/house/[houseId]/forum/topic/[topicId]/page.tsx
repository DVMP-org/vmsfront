"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
        <section className="sticky top-0 z-20 rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#2563eb)] to-indigo-700 text-white shadow-xl">
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

        <Card className="border-none shadow-lg shadow-slate-200/60">
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
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No replies yet"
                description="Kick off the conversation with the first response."
              />
            ) : (
              <div
                ref={repliesContainerRef}
                className="max-h-[70vh] space-y-6 overflow-y-auto pr-1"
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

                  return (
                    <div
                      key={post.id}
                      className={cn(
                        "flex w-full gap-3",
                        isOwnPost
                          ? "flex-row-reverse pl-4 sm:pl-16"
                          : "flex-row pr-4 sm:pr-16"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase shadow",
                          isOwnPost
                            ? "border-[var(--brand-primary,#2563eb)] bg-white text-[var(--brand-primary,#2563eb)]"
                            : "border-border bg-muted/70 text-muted-foreground"
                        )}
                      >
                        {avatarLabel}
                      </div>
                      <article
                        className={cn(
                          "relative w-full max-w-3xl rounded-3xl border px-5 py-4 shadow-sm transition sm:px-6",
                          isOwnPost
                            ? "border-[var(--brand-primary,#2563eb)]/40 bg-gradient-to-r from-[var(--brand-primary,#2563eb)]/12 via-sky-100/60 to-white text-foreground shadow-[0_18px_32px_rgba(37,99,235,0.18)]"
                            : alternatingNeutral
                            ? "border-border/50 bg-slate-50 text-foreground"
                            : "border-border/70 bg-white text-foreground",
                          isRecentlyCreated && "ring-2 ring-amber-300"
                        )}
                      >
                        <div className="flex flex-col gap-4">
                          <div
                            className={cn(
                              "flex flex-wrap items-start gap-4",
                              isOwnPost ? "justify-end text-right" : "justify-between text-left"
                            )}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    isOwnPost ? "text-[var(--brand-primary,#2563eb)]" : "text-foreground"
                                  )}
                                >
                                  {displayName}
                                </p>
                                {isAdminPost && (
                                  <Badge variant="warning" className="text-[10px] uppercase tracking-wide">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "mt-1 flex flex-wrap items-center gap-2 text-xs",
                                  isOwnPost ? "text-[var(--brand-primary,#2563eb)]/70" : "text-muted-foreground"
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <Clock4 className="h-3 w-3" />
                                  {post.created_at
                                    ? formatDistanceToNow(new Date(post.created_at), {
                                        addSuffix: true,
                                      })
                                    : "Just now"}
                                </span>
                                {isAdminPost && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    Posted by admin
                                  </span>
                                )}
                                {post.edited_at && (
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                                      isOwnPost
                                        ? "bg-white text-[var(--brand-primary,#2563eb)]"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    Edited
                                  </span>
                                )}
                                {isRecent && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasAttachments && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                                    isOwnPost
                                      ? "bg-white text-[var(--brand-primary,#2563eb)]"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {attachments.length}
                                </span>
                              )}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveActionPostId((prev) => (prev === post.id ? null : post.id))
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {activeActionPostId === post.id && (
                                  <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-border/60 bg-white p-2 shadow-xl">
                                    {["Edit", "Report", "Delete", "Copy link"].map((action) => (
                                      <button
                                        key={action}
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/40"
                                        onClick={() => setActiveActionPostId(null)}
                                      >
                                        {action}
                                        <ChevronRight className="h-3 w-3" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => togglePostExpansion(post.id)}
                                aria-expanded={isExpanded}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition",
                                  isOwnPost
                                    ? "border-[var(--brand-primary,#2563eb)] text-[var(--brand-primary,#2563eb)] hover:bg-[var(--brand-primary,#2563eb)]/10"
                                    : "border-border/70 text-muted-foreground hover:bg-muted/60"
                                )}
                              >
                                {isExpanded ? "Collapse" : "Expand"}
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition",
                                    isExpanded && "rotate-180 text-foreground"
                                  )}
                                />
                              </button>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "relative text-sm leading-relaxed",
                              isOwnPost ? "text-slate-700" : "text-foreground",
                              shouldClamp && "max-h-48 overflow-hidden pr-1"
                            )}
                          >
                            <div
                              className="max-w-none space-y-3 break-words text-sm text-foreground"
                              dangerouslySetInnerHTML={{ __html: renderableContent }}
                            />
                            {shouldClamp && (
                              <div
                                className={cn(
                                  "pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t",
                                  isOwnPost
                                    ? "from-white via-white/70 to-transparent"
                                    : "from-white via-white/60 to-transparent dark:from-background"
                                )}
                              />
                            )}
                          </div>

                          {hasAttachments && (
                            <div
                              className={cn(
                                "space-y-2 rounded-2xl border border-dashed p-3",
                                isOwnPost
                                  ? "border-[var(--brand-primary,#2563eb)]/30 bg-white"
                                  : "border-border/70 bg-muted/40"
                              )}
                            >
                              <p
                                className={cn(
                                  "text-xs font-semibold uppercase tracking-wide",
                                  isOwnPost ? "text-[var(--brand-primary,#2563eb)]" : "text-muted-foreground"
                                )}
                              >
                                Attachments
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {attachments.map((attachment, index) => (
                                  <a
                                    key={`${post.id}-attachment-${index}`}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition",
                                      isOwnPost
                                        ? "border-[var(--brand-primary,#2563eb)]/40 text-[var(--brand-primary,#2563eb)] hover:bg-[var(--brand-primary,#2563eb)]/10"
                                        : "border-border/60 text-foreground hover:bg-muted/50"
                                    )}
                                  >
                                    <Paperclip
                                      className={cn(
                                        "h-4 w-4",
                                        isOwnPost
                                          ? "text-[var(--brand-primary,#2563eb)]"
                                          : "text-muted-foreground"
                                      )}
                                    />
                                    {attachment.name || "Attachment"}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {approximateLength > 420 && (
                            <button
                              type="button"
                              onClick={() => togglePostExpansion(post.id)}
                              className={cn(
                                "text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#2563eb)] transition hover:underline",
                                isOwnPost ? "self-end" : "self-start"
                              )}
                            >
                              {isExpanded ? "Show less" : "Read full reply"}
                            </button>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                })}
                <div ref={repliesEndRef} />
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="border-t border-dashed border-border/60 px-6 py-4">
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
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-2 text-xs text-muted-foreground">
                    Formatting supported — use bold, italics, lists, quotes, and links to keep conversations clear.
                </div>
                  <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Share an update, ask a follow-up question, or tag a neighbour."
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition",
                    isDragging
                      ? "border-[var(--brand-primary,#2563eb)] bg-[var(--brand-primary,#2563eb)]/10 text-[var(--brand-primary,#2563eb)]"
                      : "border-border/80 text-muted-foreground"
                  )}
                >
                  <UploadCloud className="mx-auto mb-2 h-6 w-6" />
                  Drag & drop files here or{" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--brand-primary,#2563eb)] underline-offset-2 hover:underline"
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
                "fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary,#2563eb)] text-white shadow-2xl transition lg:hidden",
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
    </DashboardLayout>
  );
}
