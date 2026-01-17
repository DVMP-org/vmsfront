"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import {
  useCreateForumTopic,
  useForumCategory,
  useForumTopics,
} from "@/hooks/use-forum";
import type { ForumTopic } from "@/types";
import { cn } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
  FolderOpen,
  Home as HomeIcon,
  MessageCircle,
  Plus,
  Sparkles,
  MessageSquare,
  ArrowUpRight,
  Pin,
  Lock,
} from "lucide-react";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { FilterConfig } from "@/components/ui/DataTable";

export default function ForumCategoryPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string; categoryId?: string }>();
  const rawHouseId = params?.houseId;
  const rawCategoryId = params?.categoryId;
  const houseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const categoryId = Array.isArray(rawCategoryId) ? rawCategoryId[0] : rawCategoryId;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
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

  const { data: category, isLoading: isCategoryLoading } = useForumCategory(
    effectiveHouseId,
    categoryId ?? null
  );

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (categoryFilter !== "all") {
      filters.push({
        field: "category_id",
        value: categoryId,
        operator: "eq"
      });
    }
    return filters;
  }, [categoryId, categoryFilter]);
  const { data: topicsResponse, isLoading: isTopicsLoading } = useForumTopics(
    effectiveHouseId,
    {
      page: 1,
      pageSize: 200,
      search: search.trim() || undefined,
      filters: activeFilters.length > 0 ? formatFiltersForAPI(activeFilters) : undefined
    }
  );

  useEffect(() => {
    if (!categoryId) return;
    setCategoryFilter(categoryId);
  }, [categoryId]);


  const filteredTopics = useMemo(() => {
    // @ts-expect-error – PaginatedResponse may be array in this branch
    const items = (topicsResponse?.items ?? []) as ForumTopic[];

    const list = items.filter((topic) => topic.category_id === categoryId);
    if (!search.trim()) return list;
    return list.filter((topic) =>
      topic.title.toLowerCase().includes(search.toLowerCase())
    );
    // @ts-expect-error – PaginatedResponse may be array in this branch
  }, [topicsResponse?.items, categoryId, search]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTopics.length / pageSize)),
    [filteredTopics.length, pageSize]
  );
  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const paginatedTopics = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTopics.slice(start, start + pageSize);
  }, [filteredTopics, page, pageSize]);

  const topicStats = useMemo(() => {
    const total = filteredTopics.length;
    const pinned = filteredTopics.filter((topic) => topic.is_pinned).length;
    const locked = filteredTopics.filter((topic) => topic.is_locked).length;
    const lastUpdated = filteredTopics
      .map((topic) => topic.last_post_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

    return {
      total,
      pinned,
      locked,
      lastUpdated,
    };
  }, [filteredTopics]);

  const [isTopicModalOpen, setTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    title: "",
    content: "",
  });
  const createTopic = useCreateForumTopic();

  const handleCreateTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveHouseId || !categoryId) return;
    createTopic.mutate(
      {
        house_id: effectiveHouseId,
        category_id: categoryId,
        title: topicForm.title.trim(),
        content: topicForm.content.trim(),
      },
      {
        onSuccess: (response) => {
          setTopicForm({ title: "", content: "" });
          setTopicModalOpen(false);
          router.push(
            `/house/${effectiveHouseId}/forum/topic/${response.data.id}`
          );
        },
      }
    );
  };

  if (!effectiveHouseId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector before viewing forum categories."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  const loading = isCategoryLoading || isTopicsLoading;

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-secondary))] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <button
                type="button"
                onClick={() => router.push(`/house/${effectiveHouseId}/forum`)}
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                ← Back to all categories
              </button>
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  Category
                </p>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  {category?.name ?? "Forum Category"}
                </h1>
                {category?.description && (
                  <p className="text-white/80">{category.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-white text-[rgb(var(--brand-primary))] hover:bg-white/90"
                  onClick={() => setTopicModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Start Topic
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/20"
                  onClick={() =>
                    router.push(`/house/${effectiveHouseId}/forum`)
                  }
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  View Categories
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:justify-end">
              <StatTile
                label="Topics"
                value={topicStats.total}
                icon={MessageSquare}
              />
              <StatTile label="Pinned" value={topicStats.pinned} icon={Pin} />
              <StatTile label="Locked" value={topicStats.locked} icon={Lock} />
            </div>
          </div>
        </section>

        <Card className="border-none shadow-lg shadow-slate-200/60">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Topics</CardTitle>
              <CardDescription>
                Conversations happening inside {category?.name ?? "this category"}.
              </CardDescription>
            </div>
            <div className="w-full md:w-64">
              <Input
                placeholder="Search topics..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : filteredTopics.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No topics yet"
                description="Be the first to share an update or ask a question."
                action={{
                  label: "Create Topic",
                  onClick: () => setTopicModalOpen(true),
                }}
              />
            ) : (
              <div className="grid gap-3">
                {paginatedTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    onOpen={() =>
                      router.push(
                        `/house/${effectiveHouseId}/forum/topic/${topic.id}`
                      )
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
          {!loading && filteredTopics.length > 0 && totalPages > 1 && (
            <div className="border-t border-dashed border-border/60 px-6 py-4">
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={filteredTopics.length}
                totalPages={totalPages}
                resourceLabel="topics"
                onChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title={`New topic in ${category?.name ?? "this category"}`}
      >
        <form className="space-y-4" onSubmit={handleCreateTopic}>
          <Input
            label="Topic title"
            placeholder="E.g., Maintenance schedule"
            value={topicForm.title}
            onChange={(event) =>
              setTopicForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              value={topicForm.content}
              onChange={(event) =>
                setTopicForm((prev) => ({
                  ...prev,
                  content: event.target.value,
                }))
              }
              className={cn(
                "min-h-[160px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#213928)]"
              )}
              placeholder="Share some context to kick-start the discussion."
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTopicModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createTopic.isPending}
              disabled={!topicForm.title.trim() || !topicForm.content.trim()}
            >
              Post topic
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-[140px] rounded-2xl bg-white/10 p-4 text-center shadow-lg backdrop-blur">
      {Icon ? <Icon className="mx-auto mb-2 h-5 w-5 text-white" /> : null}
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}

function TopicCard({
  topic,
  onOpen,
}: {
  topic: ForumTopic;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-2xl border border-muted bg-gradient-to-r from-white to-slate-50/80 p-4 text-left shadow-md transition hover:border-[var(--brand-primary,#213928)]/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Profile image (user avatar) */}
          {topic.author && topic.author.avatar_url ? (
            <img
              src={topic.author.avatar_url}
              alt={topic.author.first_name + " " + topic.author.last_name}
              className="h-8 w-8 rounded-full border border-muted object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {topic.author && topic.author.first_name + " " + topic.author.last_name
                ? (topic.author.first_name + " " + topic.author.last_name)
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                : ""}
            </div>
          )}
          <p className="text-lg font-semibold text-foreground">{topic.title}</p>
          {topic.is_pinned && (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700">
              Pinned
            </Badge>
          )}
          {topic.is_locked && (
            <Badge variant="danger" className="bg-rose-50 text-rose-700">
              Locked
            </Badge>
          )}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {topic.posts_count} {topic.posts_count === 1 ? "reply" : "replies"}
        </span>
        {topic.last_post_at && (
          <span>
            Updated{" "}
            {formatDistanceToNow(new Date(topic.last_post_at), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </button>
  );
}
