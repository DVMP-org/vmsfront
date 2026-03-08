"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ForumAdminAvatar } from "@/components/forum/ForumAdminAvatar";
import { ForumPostActionsMenu } from "@/components/forum/ForumPostActionsMenu";
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
  UploadCloud,
  FileText,
  Loader2,
  Send,
  Search,
} from "lucide-react";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { FilterConfig } from "@/components/ui/DataTable";
import { toast } from "sonner";

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

const MAX_ATTACHMENTS = 6;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const formatPostDayLabel = (dateString: string | null | undefined) => {
  if (!dateString) return "Today";

  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "EEEE, MMM d");
};

export default function ForumTopicPage() {
  const router = useRouter();
  const params = useParams<{ residencyId?: string; topicId?: string }>();
  const rawResidencyId = params?.residencyId;
  const rawTopicId = params?.topicId;
  const residencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
  const topicId = Array.isArray(rawTopicId) ? rawTopicId[0] : rawTopicId;
  const { selectedResidency, setSelectedResidency } = useAppStore();
  const { data: profile } = useProfile();
  const effectiveResidencyId = residencyId ?? selectedResidency?.id ?? null;

  useEffect(() => {
    if (!residencyId || !profile?.residencies) return;
    if (selectedResidency?.id === residencyId) return;
    const match = profile.residencies.find((h) => h.id === residencyId);
    if (match) {
      setSelectedResidency(match);
    }
  }, [residencyId, profile?.residencies, selectedResidency?.id, setSelectedResidency]);

  const { data: topic, isLoading: isTopicLoading } = useForumTopic(
    effectiveResidencyId,
    topicId ?? null
  );

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const pageSize = 15;

  const topicsActiveFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (categoryFilter !== "all") {
      filters.push({
        field: "category_id",
        value: categoryFilter,
        operator: "eq"
      });
    }
    return filters;
  }, [categoryFilter]);
  const {
    data: postsResponse,
    isLoading: isPostsLoading,
  } = useForumPosts(effectiveResidencyId, topicId ?? null, {
    page,
    pageSize,
    search: search.trim() || undefined,
    sort,
    filters: topicsActiveFilters.length > 0 ? formatFiltersForAPI(topicsActiveFilters) : undefined
  });
  const paginatedPosts = postsResponse as { items?: typeof posts; total?: number; total_pages?: number } | undefined;
  const posts = useMemo(
    // @ts-expect-error – PaginatedResponse may be array in this branch
    () => postsResponse?.items ?? [],
    // @ts-expect-error – PaginatedResponse may be array in this branch
    [postsResponse?.items]
  );
  const totalPages = paginatedPosts?.total_pages ?? 0;

  const [content, setContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [recentPostId, setRecentPostId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const replyFormRef = useRef<HTMLFormElement | null>(null);
  const repliesContainerRef = useRef<HTMLDivElement | null>(null);
  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  const createPost = useCreateForumPost();
  const viewerId = profile?.id ?? null;
  const canSubmit = hasMeaningfulContent(content);
  const postsTotal = paginatedPosts?.total ?? posts.length;
  const hasReplyFilters = Boolean(search.trim()) || sort !== "created_at:desc";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveResidencyId || !topicId) return;
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
        residencyId: effectiveResidencyId,
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
    const existingSignatures = new Set(
      pendingAttachments.map((attachment) => `${attachment.name}-${attachment.size}`)
    );

    const incomingFiles = Array.from(fileList);
    const remainingSlots = MAX_ATTACHMENTS - pendingAttachments.length;

    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per reply.`);
      return;
    }

    const acceptedFiles = incomingFiles
      .filter((file) => {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          toast.error(`${file.name} is larger than ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
          return false;
        }

        const signature = `${file.name}-${file.size}`;
        if (existingSignatures.has(signature)) {
          return false;
        }

        existingSignatures.add(signature);
        return true;
      })
      .slice(0, remainingSlots);

    if (acceptedFiles.length === 0) return;

    if (acceptedFiles.length < incomingFiles.length) {
      toast.message(`Attached ${acceptedFiles.length} file${acceptedFiles.length === 1 ? "" : "s"}.`);
    }

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(file);
      });

    const selectedFiles = await Promise.all(
      acceptedFiles.map(async (file) => ({
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
    const container = repliesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollToLatest(remaining > 160);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [posts]);

  const scrollRepliesToBottom = () => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

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
      { label: "Forums", href: effectiveResidencyId ? `/residency/${effectiveResidencyId}/forum` : "/forum" },
      { label: selectedResidency?.name ?? "Residency", href: "#" },
    ];
    if (topic?.category) {
      base.push({
        label: topic.category.name,
        href: effectiveResidencyId
          ? `/residency/${effectiveResidencyId}/forum/category/${topic.category.id}`
          : "#",
      });
    }
    base.push({ label: topic?.title ?? "Topic", href: "#" });
    return base;
  }, [effectiveResidencyId, selectedResidency?.name, topic?.category, topic?.title]);

  const isLoading = isTopicLoading || isPostsLoading;

  if (!effectiveResidencyId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a residency to continue"
              description="Choose a residency from the dashboard selector before opening topics."
              action={{
                label: "Choose Residency",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="min-w-0 space-y-4 pb-20 sm:space-y-6 sm:pb-24">
        <section className="rounded-3xl border border-border/60 bg-card shadow-xl">
          <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto pb-1 text-xs text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:text-white/70" aria-label="Breadcrumb">
                {breadcrumbItems.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="inline-flex flex-shrink-0 items-center gap-1">
                    {index === 0 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-foreground transition hover:text-foreground/80 dark:text-white dark:hover:text-white/80"
                        onClick={() => {
                          if (item.href && item.href !== "#") {
                            router.push(item.href);
                          }
                        }}
                      >
                        Forums
                      </button>
                    ) : (
                        <span className="text-foreground/80 dark:text-white/80">{item.label}</span>
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
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to category
                </button>
                {topic?.category && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/residency/${effectiveResidencyId}/forum/category/${topic.category_id}`
                      )
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-sm text-foreground/90 hover:border-border dark:border-white/30 dark:bg-transparent dark:text-white/90 dark:hover:border-white"
                  >
                    <FolderOpen className="h-4 w-4" />
                    {topic.category.name}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl dark:text-white">
                  {topic?.title ?? "Topic"}
                </h1>
                <p className="text-sm text-muted-foreground dark:text-white/80">
                  Keep everyone informed with thoughtful updates and actionable follow-ups.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-foreground/90 sm:grid-cols-2 lg:grid-cols-3 dark:text-white/90">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 backdrop-blur dark:border-white/20 dark:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-white/70">Replies</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  {postsTotal} {postsTotal === 1 ? "reply" : "replies"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 backdrop-blur dark:border-white/20 dark:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-white/70">Participants</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-4 w-4" />
                  {participantCount || 1}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 backdrop-blur sm:col-span-2 lg:col-span-1 dark:border-white/20 dark:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-white/70">Last updated</p>
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

        <Card className="min-w-0 overflow-hidden border border-border/60 bg-card/95 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <CardTitle>
                  {postsTotal} {postsTotal === 1 ? "reply" : "replies"}
                </CardTitle>
                <CardDescription>
                  Follow the conversation, scan updates quickly, and jump back into the thread.
                </CardDescription>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search replies"
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/15"
                  />
                </div>
                <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1 text-xs font-medium sm:inline-flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSort("created_at:desc");
                    }}
                    className={cn(
                      "rounded-lg px-3 py-2 transition",
                      sort === "created_at:desc"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Newest first
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSort("created_at:asc");
                    }}
                    className={cn(
                      "rounded-lg px-3 py-2 transition",
                      sort === "created_at:asc"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Oldest first
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={MessageSquare}
                    title={hasReplyFilters ? "No replies match your view" : "No replies yet"}
                    description={
                      hasReplyFilters
                        ? "Try clearing the search or switching the sort order."
                        : "Kick off the conversation with the first response."
                    }
                />
              </div>
            ) : (
                  <div className="relative min-w-0 overflow-hidden">
                    <div
                      ref={repliesContainerRef}
                      className="forum-replies-scroll h-[52vh] min-h-[360px] w-full min-w-0 overflow-x-hidden overflow-y-auto bg-muted/20 px-2.5 py-3 sm:h-[60vh] sm:min-h-[420px] sm:px-4 sm:py-5 dark:bg-background/40"
                    >
                {posts.map((post, index) => {
                  const previousPost = index > 0 ? posts[index - 1] : null;
                  const authorName =
                    post.author?.first_name || post.author?.last_name
                      ? `${post.author?.first_name ?? ""} ${post.author?.last_name ?? ""
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
                  const displayName = isAdminPost ? "Estate Administrator" : authorName;
                  const isRecentlyCreated = recentPostId === post.id;
                  const residencyLabel = isAdminPost
                    ? null
                    : post.residency?.name || selectedResidency?.name || "Residency";
                  const bubbleTone = isAdminPost
                    ? "admin"
                    : isOwnPost
                      ? "mine"
                      : "other";
                  const shouldRenderDateDivider =
                    !previousPost ||
                    format(new Date(previousPost.created_at ?? 0), "yyyy-MM-dd") !==
                    format(new Date(post.created_at ?? 0), "yyyy-MM-dd");

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
                    <div key={post.id} className="space-y-3">
                      {shouldRenderDateDivider && (
                        <div className="sticky top-0 z-10 flex justify-center py-2">
                          <span className="rounded-full border border-border/70 bg-background/95 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur">
                            {formatPostDayLabel(post.created_at)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex w-full group",
                          isOwnPost ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn("flex w-full max-w-full min-w-0 gap-2 sm:max-w-[95%] lg:max-w-[90%]", isOwnPost ? "flex-row-reverse" : "flex-row")}>
                        {/* Avatar */}
                          {isAdminPost ? (
                            <ForumAdminAvatar
                              name={authorName}
                              email={post.author?.email}
                              phone={post.author?.phone}
                              residencyName={post.residency?.name || selectedResidency?.name || null}
                              avatarUrl={post.author?.avatar_url}
                              side={isOwnPost ? "left" : "right"}
                              className="sticky top-2 sm:top-3"
                            />
                          ) : (
                              <div
                                className={cn(
                              "sticky top-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase shadow-sm sm:top-3",
                              bubbleTone === "mine"
                                ? "border-[rgb(var(--brand-primary))]/30 bg-[rgb(var(--brand-primary))]/15 text-[rgb(var(--brand-primary))] dark:text-white"
                                : "border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            )}
                              >
                                {avatarLabel}
                              </div>
                          )}
                        <article
                          className={cn(
                            "my-2 flex-1 min-w-0 overflow-hidden rounded-2xl px-3.5 py-3 shadow-sm transition hover:shadow-md sm:my-3 sm:px-5 sm:py-4",
                            bubbleTone === "admin"
                              ? "border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-50"
                              : bubbleTone === "mine"
                                ? "border border-[rgb(var(--brand-primary))]/25 bg-[rgb(var(--brand-primary))]/10 text-zinc-950 dark:bg-[rgb(var(--brand-primary))]/12 dark:text-white"
                                : "border border-zinc-200/80 bg-white text-zinc-900 dark:bg-card dark:border-border/60 dark:text-zinc-100",
                            isRecentlyCreated && "ring-2 ring-amber-300 ring-offset-2"
                          )}
                        >
                          {/* Post Header - Compact Inline */}
                            <div className={cn("mb-1 flex min-w-0 flex-wrap items-center gap-2", isOwnPost ? "justify-end" : "justify-start")}>
                              <span
                                className={cn(
                                  "min-w-0 break-words text-xs font-semibold",
                                  bubbleTone === "admin"
                                    ? "text-amber-900 dark:text-amber-100"
                                    : bubbleTone === "mine"
                                      ? "text-[rgb(var(--brand-primary))] dark:text-white"
                                      : "text-zinc-900 dark:text-zinc-100"
                                )}
                              >
                                {displayName}
                                {residencyLabel ? ` · ${residencyLabel}` : ""}
                            </span>
                            {isAdminPost && (
                              <span
                                className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  "bg-amber-200/70 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100"
                                )}
                              >
                                Admin
                              </span>
                            )}
                            <span
                                className={cn(
                                  "text-[10px]",
                                  bubbleTone === "admin"
                                    ? "text-amber-700/80 dark:text-amber-100/70"
                                    : bubbleTone === "mine"
                                      ? "text-[rgb(var(--brand-primary))]/80 dark:text-white/70"
                                      : "text-zinc-500 dark:text-zinc-400"
                                )}
                              title={timestamp.full}
                            >
                              {timestamp.display}
                            </span>
                            {editedTimestamp && (
                              <span
                                  className={cn(
                                    "text-[10px]",
                                    bubbleTone === "admin"
                                      ? "text-amber-700/80 dark:text-amber-100/70"
                                      : bubbleTone === "mine"
                                        ? "text-[rgb(var(--brand-primary))]/80 dark:text-white/70"
                                        : "text-zinc-500 dark:text-zinc-400"
                                  )}
                                title={`Edited: ${editedTimestamp.full}`}
                              >
                                · Edited {editedTimestamp.display}
                              </span>
                            )}
                            {hasAttachments && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px]",
                                  bubbleTone === "admin"
                                    ? "text-amber-700/80 dark:text-amber-100/70"
                                    : bubbleTone === "mine"
                                      ? "text-[rgb(var(--brand-primary))]/80 dark:text-white/70"
                                      : "text-zinc-500 dark:text-zinc-400"
                                )}
                              >
                                <Paperclip className="h-3 w-3" />
                                {attachments.length}
                              </span>
                            )}
                              <ForumPostActionsMenu
                                tone={bubbleTone}
                                align={isOwnPost ? "left" : "right"}
                              />
                          </div>

                          {/* Post Content */}
                          <div className="pt-0.5">
                            <div
                              className={cn(
                                "text-sm leading-relaxed break-words forum-content",
                                bubbleTone === "admin"
                                  ? "text-amber-950 dark:text-amber-50"
                                  : bubbleTone === "mine"
                                    ? "text-zinc-950 dark:text-white"
                                    : "text-zinc-900 dark:text-zinc-100",
                                shouldClamp && "max-h-32 overflow-hidden relative"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-none break-words text-sm forum-html-content",
                                  bubbleTone === "admin"
                                    ? "forum-content-admin"
                                    : bubbleTone === "mine"
                                      ? "forum-content-own"
                                      : "forum-content-other"
                                )}
                                dangerouslySetInnerHTML={{ __html: renderableContent }}
                                />
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
                                      "inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors",
                                      bubbleTone === "admin"
                                        ? "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-500/10"
                                        : bubbleTone === "mine"
                                          ? "border-[rgb(var(--brand-primary))]/30 text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))]/10 dark:text-white dark:hover:bg-white/10"
                                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-border dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    )}
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    <span className="truncate">{attachment.name || "Attachment"}</span>
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
                                  bubbleTone === "admin"
                                    ? "text-amber-700 dark:text-amber-100"
                                    : bubbleTone === "mine"
                                      ? "text-[rgb(var(--brand-primary))] dark:text-white/80"
                                      : "text-zinc-500 dark:text-zinc-400"
                                )}
                              >
                                {isExpanded ? "Show less" : "Read more"}
                              </button>
                            )}
                          </div>
                        </article>
                      </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={repliesEndRef} />
                    </div>
                    {showScrollToLatest && (
                      <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex justify-end">
                        <Button
                          type="button"
                          onClick={scrollRepliesToBottom}
                          className="pointer-events-auto rounded-full px-3 py-2 text-xs shadow-lg sm:text-sm"
                        >
                          Jump to latest
                        </Button>
                      </div>
                    )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="sticky bottom-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-border dark:bg-card/95">
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={postsTotal}
                  totalPages={totalPages}
                  resourceLabel="replies"
                  onChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border border-border/60 bg-card/95 shadow-lg backdrop-blur lg:bottom-4 lg:z-10">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle>Create a Reply</CardTitle>
                <CardDescription>
                  Share an update or ask a follow-up question.
                </CardDescription>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {pendingAttachments.length}/{MAX_ATTACHMENTS} attachments
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {stripHtml(content).trim().length} chars
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            {topic?.is_locked ? (
              <EmptyState
                icon={Quote}
                title="Topic locked"
                description="An admin or residency moderator has locked this conversation."
              />
            ) : (
              <form
                ref={replyFormRef}
                className="space-y-4"
                onSubmit={handleCreatePost}
              >
                  <div className="rounded-xl border border-dashed border-zinc-500 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-600 dark:border-border dark:bg-muted/30 dark:text-zinc-300 sm:px-4">
                  Formatting supported — use bold, italics, lists, quotes, code blocks, and links to keep conversations clear.
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Share an update, ask a follow-up question, or tag a neighbour."
                    minHeight={160}
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition",
                    isDragging
                      ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                      : "border-border/80 text-muted-foreground"
                  )}
                >
                  <UploadCloud className="mx-auto mb-2 h-6 w-6" />
                  Drag & drop files here or{" "}
                  <button
                    type="button"
                      className="font-semibold text-[rgb(var(--brand-primary))] underline-offset-2 hover:underline"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    browse
                  </button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Up to {MAX_ATTACHMENTS} files, {formatFileSize(MAX_ATTACHMENT_SIZE)} each.
                    </p>
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
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {pendingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="inline-flex w-full max-w-full min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 sm:w-auto sm:rounded-full sm:py-1"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Accepted: images, PDF, DOCX, XLSX.
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Replies are visible to everyone in this residency.
                    </span>
                  </div>
                  <Button
                    type="submit"
                    isLoading={createPost.isPending}
                    disabled={!canSubmit}
                      className="w-full sm:w-auto"
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
                "fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))] text-white shadow-2xl transition sm:bottom-6 sm:right-6 lg:hidden",
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

        .forum-replies-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
        }

        .forum-replies-scroll::-webkit-scrollbar {
          width: 10px;
        }

        .forum-replies-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .forum-replies-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.28);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .forum-replies-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .dark .forum-replies-scroll {
          scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
        }

        .dark .forum-replies-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.24);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .dark .forum-replies-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.34);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
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

        /* Admin message styling */
        .forum-content-admin h1,
        .forum-content-admin h2,
        .forum-content-admin h3,
        .forum-content-admin h4,
        .forum-content-admin h5,
        .forum-content-admin h6 {
          color: #92400e;
        }

        .forum-content-admin blockquote {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          color: #78350f;
        }

        .forum-content-admin code {
          background: rgba(245, 158, 11, 0.12);
          color: #78350f;
        }

        .forum-content-admin pre {
          background: rgba(245, 158, 11, 0.12);
          color: #78350f;
        }

        .forum-content-admin a {
          color: #b45309;
        }

        .dark .forum-content-admin h1,
        .dark .forum-content-admin h2,
        .dark .forum-content-admin h3,
        .dark .forum-content-admin h4,
        .dark .forum-content-admin h5,
        .dark .forum-content-admin h6,
        .dark .forum-content-admin code,
        .dark .forum-content-admin pre,
        .dark .forum-content-admin a {
          color: #fde68a;
        }

        .dark .forum-content-admin blockquote {
          border-left-color: rgba(251, 191, 36, 0.6);
          background: rgba(251, 191, 36, 0.08);
          color: #fde68a;
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
          color: var(--brand-primary);
        }
      `}</style>
    </>
  );
}
