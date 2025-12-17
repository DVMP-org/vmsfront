"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
  FolderOpen,
  Home as HomeIcon,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Users,
  MessageSquare,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import {
  useCreateForumCategory,
  useCreateForumTopic,
  useForumCategoriesList,
  useForumTopics,
} from "@/hooks/use-forum";
import type { ForumCategory } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryWithCount {
  category: ForumCategory;
  topicCount: number;
}

export default function HouseForumPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string }>();
  const rawHouseId = params?.houseId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const effectiveHouseId = routeHouseId ?? selectedHouse?.id ?? null;

  useEffect(() => {
    if (!routeHouseId || !profile?.houses) return;
    if (selectedHouse?.id === routeHouseId) return;
    const match = profile.houses.find((house) => house.id === routeHouseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [profile?.houses, routeHouseId, selectedHouse?.id, setSelectedHouse]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const pageSize = 10;
  const {
    data: topicsResponse,
    isLoading,
    isFetching,
  } = useForumTopics(effectiveHouseId, { page, pageSize, search });

  const {
    data: categoriesResponse,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useForumCategoriesList(effectiveHouseId, 1, 100);

  const topics = useMemo(
    // @ts-expect-error – PaginatedResponse may be array in this branch
    () => topicsResponse?.items ?? [],
    // @ts-expect-error – PaginatedResponse may be array in this branch
    [topicsResponse?.items]
  );
  // @ts-expect-error – PaginatedResponse may be array in this branch
  const totalPages = topicsResponse?.total_pages ?? 0;
  // @ts-expect-error – PaginatedResponse may be array in this branch
  const totalTopics = topicsResponse?.total ?? 0;
  const hasPagination = totalPages > 1;
  const categoriesFromApi = useMemo(
    // @ts-expect-error – PaginatedResponse may be array in this branch
    () => categoriesResponse?.items ?? [],
    // @ts-expect-error – PaginatedResponse may be array in this branch
    [categoriesResponse?.items]
  );

  const [manualCategories, setManualCategories] = useState<ForumCategory[]>([]);

  const categories = useMemo<CategoryWithCount[]>(() => {
    const counts = new Map<string, number>();
    topics.forEach((topic) => {
      counts.set(topic.category_id, (counts.get(topic.category_id) ?? 0) + 1);
    });

    const uniqueCategories = new Map<string, ForumCategory>();
    const trackCategory = (category?: ForumCategory | null) => {
      if (!category) return;
      if (uniqueCategories.has(category.id)) return;
      uniqueCategories.set(category.id, category);
    };

    categoriesFromApi.forEach((category) => trackCategory(category));
    manualCategories.forEach((category) => trackCategory(category));
    topics.forEach((topic) => trackCategory(topic.category));

    return Array.from(uniqueCategories.values())
      .map((category) => ({
        category,
        topicCount: counts.get(category.id) ?? 0,
      }))
      .sort((a, b) => a.category.name.localeCompare(b.category.name));
  }, [topics, categoriesFromApi, manualCategories]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    const exists = categories.some(
      ({ category }) => category.id === categoryFilter
    );
    if (!exists) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categories]);

  const filteredTopics = useMemo(() => {
    if (categoryFilter === "all") return topics;
    return topics.filter((topic) => topic.category_id === categoryFilter);
  }, [categoryFilter, topics]);

  const activeCategoryMeta = useMemo(() => {
    if (categoryFilter === "all") return null;
    return (
      categories.find(({ category }) => category.id === categoryFilter)
        ?.category ?? null
    );
  }, [categoryFilter, categories]);

  const forumStats = useMemo(() => {
    const categoryCount = categories.length;
    // @ts-expect-error – PaginatedResponse may be array in this branch
    const topicCount = topicsResponse?.total ?? topics.length;
    const participantCount = topics.reduce((set, topic) => {
      if (topic.author_id) {
        set.add(topic.author_id);
      }
      return set;
    }, new Set<string>()).size;

    return [
      { label: "Categories", value: categoryCount, icon: FolderOpen },
      { label: "Topics", value: topicCount, icon: MessageSquare },
      { label: "Participants", value: participantCount, icon: Users },
    ];
    // @ts-expect-error – PaginatedResponse may be array in this branch
  }, [categories.length, topics, topicsResponse?.total]);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const createCategory = useCreateForumCategory();

  const [isTopicModalOpen, setTopicModalOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    title: "",
    content: "",
    categoryId: "",
  });
  const createTopic = useCreateForumTopic();

  const handleCreateCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveHouseId) return;
    createCategory.mutate(
      {
        house_id: effectiveHouseId,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
      },
      {
        onSuccess: (response) => {
          setCategoryForm({ name: "", description: "" });
          setManualCategories((prev) => {
            if (prev.some((cat) => cat.id === response.data.id)) {
              return prev;
            }
            return [...prev, response.data];
          });
          setCategoryModalOpen(false);
        },
      }
    );
  };

  const handleCreateTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveHouseId || !topicForm.categoryId) return;
    createTopic.mutate(
      {
        house_id: effectiveHouseId,
        category_id: topicForm.categoryId,
        title: topicForm.title.trim(),
        content: topicForm.content.trim(),
      },
      {
        onSuccess: (response) => {
          setTopicForm({ title: "", content: "", categoryId: "" });
          setTopicModalOpen(false);
          router.push(
            `/house/${effectiveHouseId}/forum/topic/${response.data.id}`
          );
        },
      }
    );
  };

  const handleOpenTopicModal = (categoryId?: string) => {
    setTopicForm((prev) => ({
      ...prev,
      categoryId: categoryId ?? prev.categoryId ?? "",
    }));
    setTopicModalOpen(true);
  };

  if (!effectiveHouseId) {
    return (
      <DashboardLayout type="resident">
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector before viewing the forum."
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

  const showSkeleton =
    isLoading || isFetching || isCategoriesLoading || isCategoriesFetching;
  const hasCategoryFilter = categoryFilter !== "all";
  const showPagination = !hasCategoryFilter && hasPagination;

  return (
    <DashboardLayout type="resident">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary)] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Resident Community
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  A modern forum for coordinating life inside your estate.
                </h1>
                <p className="text-white/85">
                  Organize repairs, post announcements, and keep everyone aligned from one beautiful space.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-white text-[var(--brand-primary,#213928)] hover:bg-white/90"
                  onClick={() =>
                    handleOpenTopicModal(
                      activeCategoryMeta?.id ?? (categoryFilter !== "all" ? categoryFilter : undefined)
                    )
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start Topic
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => setCategoryModalOpen(true)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:justify-end">
              {forumStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="min-w-[140px] rounded-2xl bg-white/10 p-4 text-center shadow-lg backdrop-blur"
                  >
                    <Icon className="mx-auto mb-3 h-5 w-5 text-white" />
                    <p className="text-3xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-white/80">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <CategorySidebar
            categories={categories}
            activeCategoryId={categoryFilter}
            totalTopics={totalTopics}
            isLoading={isCategoriesLoading || isCategoriesFetching}
            onSelectCategory={(next) => {
              setCategoryFilter(next);
              setPage(1);
            }}
            onCreateCategory={() => setCategoryModalOpen(true)}
            onCreateTopic={(categoryId) => handleOpenTopicModal(categoryId)}
            onViewCategory={(categoryId) =>
              router.push(
                `/house/${effectiveHouseId}/forum/category/${categoryId}`
              )
            }
          />
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Topics</CardTitle>
                <CardDescription>
                  {hasCategoryFilter && activeCategoryMeta
                    ? `Showing threads in ${activeCategoryMeta.name}`
                    : "Keep up with what’s happening in your estate."}
                </CardDescription>
                {hasCategoryFilter && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--brand-primary,#213928)] underline-offset-2 hover:underline"
                    onClick={() => setCategoryFilter("all")}
                  >
                    Clear category filter
                  </button>
                )}
              </div>
              <div className="w-full md:w-64">
                <Input
                  placeholder="Search topics..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </CardHeader>
            {showPagination && (
              <div className="flex items-center justify-center border-b border-dashed border-border/60 px-6 py-3">
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={totalTopics}
                  totalPages={totalPages}
                  onChange={setPage}
                  resourceLabel="topics"
                />
              </div>
            )}
            <CardContent>
              {showSkeleton ? (
                <TableSkeleton />
              ) : filteredTopics.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title={
                    hasCategoryFilter && activeCategoryMeta
                      ? `No topics in ${activeCategoryMeta.name}`
                      : "No conversations yet"
                  }
                  description={
                    hasCategoryFilter && activeCategoryMeta
                      ? "Be the first to share an update in this category."
                      : "Start the very first topic for your community."
                  }
                  action={{
                    label: "Create Topic",
                    onClick: () =>
                      handleOpenTopicModal(
                        activeCategoryMeta?.id ??
                          (categoryFilter !== "all" ? categoryFilter : undefined)
                      ),
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/house/${effectiveHouseId}/forum/topic/${topic.id}`
                        )
                      }
                      className={cn(
                        "flex w-full flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-white to-slate-50/80 p-4 text-left shadow-sm shadow-slate-200 transition",
                        "hover:-translate-y-0.5 hover:border-[var(--brand-primary,#213928)]/40 hover:shadow-lg"
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Profile image (user avatar) */}
                          {topic.author && topic.author.avatar_url ? (
                            <img
                              src={topic.author.avatar_url}
                              alt={
                                topic.author.first_name && topic.author.last_name
                                  ? topic.author.first_name + " " + topic.author.last_name
                                  : "User avatar"
                              }
                              className="h-8 w-8 rounded-full border border-muted object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                              {topic.author && topic.author.first_name && topic.author.last_name
                                ? (topic.author.first_name + " " + topic.author.last_name)
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                                : ""}
                            </div>
                          )}
                          <p className="text-lg font-semibold text-foreground">
                            {topic.title}
                          </p>
                          {topic.is_pinned && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              Pinned
                            </Badge>
                          )}
                          {topic.is_locked && (
                            <Badge variant="danger" className="bg-rose-100 text-rose-700">
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created{" "}
                          {topic.created_at
                            ? formatDistanceToNow(new Date(topic.created_at), {
                                addSuffix: true,
                              })
                            : "recently"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                        {topic.category && (
                          <span className="rounded-full bg-[var(--brand-primary,#213928)]/10 px-3 py-1 text-[var(--brand-primary,#213928)]">
                            {topic.category.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-inner">
                          {topic.posts_count} {topic.posts_count === 1 ? "reply" : "replies"}
                        </span>
                        {topic.last_post_at && (
                          <span className="inline-flex items-center gap-1 text-xs">
                            Updated{" "}
                            {formatDistanceToNow(new Date(topic.last_post_at), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
            {showPagination && (
              <div className="flex flex-col gap-3 border-t border-dashed border-border/60 px-6 py-4">
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={totalTopics}
                  totalPages={totalPages}
                  onChange={setPage}
                  resourceLabel="topics"
                />
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="lg:hidden"
                >
                  Load more topics
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Create Forum Category"
      >
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <Input
            label="Category name"
            value={categoryForm.name}
            onChange={(event) =>
              setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Announcements"
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className={cn(
                "min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#213928)]"
              )}
              placeholder="Share a short summary or the type of updates that belong here."
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createCategory.isPending}
              disabled={!categoryForm.name.trim() || !effectiveHouseId}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title="Start a New Topic"
      >
        <form className="space-y-4" onSubmit={handleCreateTopic}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Category
            </label>
            <select
              value={topicForm.categoryId}
              onChange={(event) =>
                setTopicForm((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#213928)]"
              required
            >
              <option value="">Select a category</option>
              {categories.map(({ category }) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Topic title"
            placeholder="E.g., Monthly maintenance schedule"
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
              placeholder="Share details or context to kick-start the discussion."
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
              disabled={
                !topicForm.title.trim() ||
                !topicForm.content.trim() ||
                !topicForm.categoryId
              }
            >
              Post topic
            </Button>
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You need at least one category before creating topics.
            </p>
          )}
        </form>
      </Modal>
    </DashboardLayout>
  );
}

interface CategorySidebarProps {
  categories: CategoryWithCount[];
  activeCategoryId: string;
  totalTopics: number;
  isLoading: boolean;
  onSelectCategory: (categoryId: string) => void;
  onCreateCategory: () => void;
  onCreateTopic: (categoryId?: string) => void;
  onViewCategory: (categoryId: string) => void;
}

function CategorySidebar({
  categories,
  activeCategoryId,
  totalTopics,
  isLoading,
  onSelectCategory,
  onCreateCategory,
  onCreateTopic,
  onViewCategory,
}: CategorySidebarProps) {
  const hasCategories = categories.length > 0;

  return (
    <aside className="h-fit rounded-3xl border border-border/60 bg-white shadow-lg shadow-slate-200/60 lg:sticky lg:top-24">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Organize threads into themes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCreateCategory}>
          + New
        </Button>
      </div>
      <div className="space-y-3 px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : hasCategories ? (
          <>
            <CategorySidebarItem
              label="All topics"
              description="Everything in this house"
              count={totalTopics}
              isActive={activeCategoryId === "all"}
              onClick={() => onSelectCategory("all")}
            />
            {categories.map(({ category, topicCount }) => (
              <CategorySidebarItem
                key={category.id}
                label={category.name}
                description={category.description}
                count={topicCount}
                isActive={activeCategoryId === category.id}
                onClick={() => onSelectCategory(category.id)}
                onView={() => onViewCategory(category.id)}
                onStartTopic={() => onCreateTopic(category.id)}
              />
            ))}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            No categories yet. Create one to keep conversations organized.
          </div>
        )}
      </div>
      <div className="space-y-3 border-t border-border/60 px-5 py-4">
        <p className="text-sm font-semibold text-foreground">
          Ready to share something?
        </p>
        <p className="text-xs text-muted-foreground">
          Draft updates, questions, or action items for neighbors.
        </p>
        <Button className="w-full" onClick={() => onCreateTopic(activeCategoryId !== "all" ? activeCategoryId : undefined)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Start topic
        </Button>
      </div>
    </aside>
  );
}

interface CategorySidebarItemProps {
  label: string;
  description?: string | null;
  count: number;
  isActive: boolean;
  onClick: () => void;
  onView?: () => void;
  onStartTopic?: () => void;
}

function CategorySidebarItem({
  label,
  description,
  count,
  isActive,
  onClick,
  onView,
  onStartTopic,
}: CategorySidebarItemProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition",
        isActive
          ? "border-[var(--brand-primary,#213928)] bg-[var(--brand-primary,#213928)]/5"
          : "border-border/40 bg-muted/30 hover:border-[var(--brand-primary,#213928)]/40"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow">
          {count}
        </span>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--brand-primary,#213928)]">
        {onView && (
          <button
            type="button"
            className="rounded-full bg-[var(--brand-primary,#213928)]/10 px-3 py-1 hover:bg-[var(--brand-primary,#213928)]/15"
            onClick={onView}
          >
            View
          </button>
        )}
        {onStartTopic && (
          <button
            type="button"
            className="rounded-full bg-[var(--brand-primary,#213928)]/10 px-3 py-1 hover:bg-[var(--brand-primary,#213928)]/15"
            onClick={onStartTopic}
          >
            Start topic
          </button>
        )}
      </div>
    </div>
  );
}
