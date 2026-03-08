"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
  Lock,
  MessageCircle,
  PlusCircle,
  Pin,
  Pencil,
  Sparkles,
  Shield,
  Trash2,
  Unlock,
  Users,
  MessageSquare,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { useResidentResidency } from "@/hooks/use-resident";
import {
  useCreateForumCategory,
  useCreateForumTopic,
  useDeleteForumCategory,
  useDeleteForumTopic,
  useForumCategoriesList,
  useForumTopics,
  useUpdateForumCategory,
  useUpdateForumTopic,
} from "@/hooks/use-forum";
import type { ForumCategory, ForumTopic } from "@/types";
import { cn } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { FilterConfig } from "@/components/ui/DataTable";
import { ActionMenu } from "@/app/admin/forums/components/ActionMenu";
import { ConfirmActionModal } from "@/app/admin/forums/components/ForumModals";

interface CategoryWithCount {
  category: ForumCategory;
  topicCount: number;
}

export default function ResidencyForumPage() {
  const router = useRouter();
  const params = useParams<{ residencyId?: string }>();
  const rawResidencyId = params?.residencyId;
  const routeResidencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
  const { selectedResidency, setSelectedResidency } = useAppStore();
  const { data: profile } = useProfile();
  const effectiveResidencyId = routeResidencyId ?? selectedResidency?.id ?? null;
  const { data: residentResidency } = useResidentResidency(effectiveResidencyId);
  const canModerateResidencyForum = residentResidency?.is_super_user ?? false;

  useEffect(() => {
    if (!routeResidencyId || !profile?.residencies) return;
    if (selectedResidency?.id === routeResidencyId) return;
    const match = profile.residencies.find((residency) => residency.id === routeResidencyId);
    if (match) {
      setSelectedResidency(match);
    }
  }, [profile?.residencies, routeResidencyId, selectedResidency?.id, setSelectedResidency]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const pageSize = 10;
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
    data: topicsResponse,
    isLoading,
    isFetching,
  } = useForumTopics(effectiveResidencyId, {
    page,
    pageSize,
    search: search.trim() || undefined,
    sort,
    filters: topicsActiveFilters.length > 0 ? formatFiltersForAPI(topicsActiveFilters) : undefined
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const categoriesActiveFilters = useMemo(() => {
    const filters: FilterConfig[] = [{
      "field": "include_deleted",
      "value": true,
      "operator": "eq"
    }]
    return filters
  }, [])

  const {
    data: categoriesResponse,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useForumCategoriesList(effectiveResidencyId, {
    page: 1,
    pageSize: 100,
    search: search.trim() || undefined,
    filters: categoriesActiveFilters.length > 0 ? formatFiltersForAPI(categoriesActiveFilters) : undefined,
    sort,
  });

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

  const filteredTopics = topics;

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
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">("create");
  const [activeCategory, setActiveCategory] = useState<ForumCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ForumCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    isLocked: false,
  });
  const createCategory = useCreateForumCategory();
  const updateCategory = useUpdateForumCategory();
  const deleteCategory = useDeleteForumCategory();

  const [isTopicModalOpen, setTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<"create" | "edit">("create");
  const [activeTopic, setActiveTopic] = useState<ForumTopic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);
  const [topicForm, setTopicForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    isPinned: false,
    isLocked: false,
  });
  const createTopic = useCreateForumTopic();
  const updateTopic = useUpdateForumTopic();
  const deleteTopic = useDeleteForumTopic();

  const handleCategorySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveResidencyId || !canModerateResidencyForum) return;
    if (categoryModalMode === "create") {
      createCategory.mutate(
        {
          residency_id: effectiveResidencyId,
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          is_locked: categoryForm.isLocked,
        },
        {
          onSuccess: (response) => {
            setCategoryForm({ name: "", description: "", isLocked: false });
            setManualCategories((prev) => {
              if (prev.some((cat) => cat.id === response.data.id)) {
                return prev;
              }
              return [...prev, response.data];
            });
            resetCategoryModal();
          },
        }
      );
      return;
    }

    if (!activeCategory) return;
    updateCategory.mutate(
      {
        residencyId: effectiveResidencyId,
        categoryId: activeCategory.id,
        data: {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          is_locked: categoryForm.isLocked,
        },
      },
      {
        onSuccess: () => {
          resetCategoryModal();
        },
      }
    );
  };

  const handleTopicSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveResidencyId || !topicForm.categoryId) return;
    if (topicModalMode === "create") {
      createTopic.mutate(
        {
          residency_id: effectiveResidencyId,
          category_id: topicForm.categoryId,
          title: topicForm.title.trim(),
          content: topicForm.content.trim(),
        },
        {
          onSuccess: (response) => {
            if (canModerateResidencyForum && (topicForm.isPinned || topicForm.isLocked)) {
              updateTopic.mutate({
                residencyId: effectiveResidencyId,
                topicId: response.data.id,
                data: {
                  is_pinned: topicForm.isPinned,
                  is_locked: topicForm.isLocked,
                },
              });
            }
            resetTopicModal();
            router.push(
              `/residency/${effectiveResidencyId}/forum/topic/${response.data.id}`
            );
          },
        }
      );
      return;
    }

    if (!activeTopic || !canModerateResidencyForum) return;
    updateTopic.mutate(
      {
        residencyId: effectiveResidencyId,
        topicId: activeTopic.id,
        data: {
          title: topicForm.title.trim(),
          category_id: topicForm.categoryId,
          is_pinned: topicForm.isPinned,
          is_locked: topicForm.isLocked,
        },
      },
      {
        onSuccess: () => {
          resetTopicModal();
        },
      }
    );
  };

  const handleOpenTopicModal = (categoryId?: string) => {
    setTopicModalMode("create");
    setActiveTopic(null);
    setTopicForm({
      title: "",
      content: "",
      categoryId: categoryId ?? "",
      isPinned: false,
      isLocked: false,
    });
    setTopicModalOpen(true);
  };

  const handleOpenCategoryEdit = (category: ForumCategory) => {
    setCategoryModalMode("edit");
    setActiveCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      isLocked: Boolean(category.is_locked),
    });
    setCategoryModalOpen(true);
  };

  const handleOpenTopicEdit = (topic: ForumTopic) => {
    setTopicModalMode("edit");
    setActiveTopic(topic);
    setTopicForm({
      title: topic.title,
      content: topic.initial_post?.content ?? "",
      categoryId: topic.category_id,
      isPinned: Boolean(topic.is_pinned),
      isLocked: Boolean(topic.is_locked),
    });
    setTopicModalOpen(true);
  };

  const resetCategoryModal = () => {
    setCategoryModalOpen(false);
    setCategoryModalMode("create");
    setActiveCategory(null);
    setCategoryForm({ name: "", description: "", isLocked: false });
  };

  const resetTopicModal = () => {
    setTopicModalOpen(false);
    setTopicModalMode("create");
    setActiveTopic(null);
    setTopicForm({ title: "", content: "", categoryId: "", isPinned: false, isLocked: false });
  };

  if (!effectiveResidencyId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a residency to continue"
              description="Choose a residency from the dashboard selector before viewing the forum."
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

  const showSkeleton =
    isLoading || isFetching || isCategoriesLoading || isCategoriesFetching;
  const hasCategoryFilter = categoryFilter !== "all";
  const showPagination = !hasCategoryFilter && hasPagination;

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <section className="rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--brand-primary)/0.15)] bg-[rgb(var(--brand-primary)/0.25)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--brand-primary))] dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Resident Community
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
                  A modern forum for coordinating life inside your estate.
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Organize repairs, post announcements, and keep everyone aligned from one beautiful space.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="shadow-sm"
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
                  className="border border-border/60 bg-muted/40 text-foreground hover:bg-muted/70"
                  disabled={!canModerateResidencyForum}
                  onClick={() => setCategoryModalOpen(true)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </div>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 md:justify-end">
              {forumStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="min-w-0 rounded-2xl border border-border/60 bg-muted/25 p-4 text-left shadow-sm"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary)/0.25)] text-[rgb(var(--brand-primary))] dark:bg-white/10 dark:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground sm:text-3xl">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
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
            canModerate={canModerateResidencyForum}
            residencyId={effectiveResidencyId}
            onSelectCategory={(next) => {
              setCategoryFilter(next);
              setPage(1);
            }}
            onCreateCategory={() => {
              if (!canModerateResidencyForum) return;
              resetCategoryModal();
              setCategoryModalOpen(true);
            }}
            onCreateTopic={(categoryId) => handleOpenTopicModal(categoryId)}
            onViewCategory={(categoryId) =>
              router.push(
                `/residency/${effectiveResidencyId}/forum/category/${categoryId}`
              )
            }
            onEditCategory={handleOpenCategoryEdit}
            onToggleCategoryLock={(category) =>
              updateCategory.mutate({
                residencyId: effectiveResidencyId,
                categoryId: category.id,
                data: { is_locked: !category.is_locked },
              })
            }
            onDeleteCategory={(category) => setCategoryToDelete(category)}
          />
          <Card className="overflow-hidden border border-border/60 bg-card/95 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
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
                    className="text-xs font-semibold text-[rgb(var(--brand-primary))] dark:text-white/80 underline-offset-2 hover:underline"
                    onClick={() => setCategoryFilter("all")}
                  >
                    Clear category filter
                  </button>
                )}
              </div>
              <div className="w-full md:w-72">
                <Input
                  placeholder="Search topics..."
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
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
                    <div className="flex flex-col gap-3 sm:gap-4">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={cn(
                        "flex w-full flex-col gap-3 rounded-2xl border border-border/70 bg-background/90 p-4 text-left shadow-sm transition sm:p-5",
                        "hover:border-[rgb(var(--brand-primary)/0.3)] hover:bg-muted/20 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/residency/${effectiveResidencyId}/forum/topic/${topic.id}`
                            )
                          }
                          className="flex min-w-0 flex-1 flex-col gap-2 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2.5">
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
                            <p className="text-base font-semibold text-foreground sm:text-lg">
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
                          <p className="text-xs text-muted-foreground sm:text-sm">
                          Created{" "}
                          {topic.created_at
                            ? formatDistanceToNow(new Date(topic.created_at), {
                              addSuffix: true,
                            })
                            : "recently"}
                        </p>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-muted-foreground sm:gap-3">
                        {topic.category && (
                              <span className="rounded-full border border-[rgb(var(--brand-primary))]/15 bg-[rgb(var(--brand-primary))]/8 px-3 py-1 text-[rgb(var(--brand-primary))] dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                            {topic.category.name}
                          </span>
                        )}
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 dark:text-foreground">
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
                        {canModerateResidencyForum && (
                          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                            <ActionMenu
                              size="sm"
                              align="right"
                              ariaLabel={`Moderate ${topic.title}`}
                              options={[
                                {
                                  label: "Edit topic",
                                  icon: Pencil,
                                  onClick: () => handleOpenTopicEdit(topic),
                                },
                                {
                                  label: topic.is_pinned ? "Unpin topic" : "Pin topic",
                                  icon: Pin,
                                  onClick: () =>
                                    updateTopic.mutate({
                                      residencyId: effectiveResidencyId,
                                      topicId: topic.id,
                                      data: { is_pinned: !topic.is_pinned },
                                    }),
                                },
                                {
                                  label: topic.is_locked ? "Unlock topic" : "Lock topic",
                                  icon: topic.is_locked ? Unlock : Lock,
                                  onClick: () =>
                                    updateTopic.mutate({
                                      residencyId: effectiveResidencyId,
                                      topicId: topic.id,
                                      data: { is_locked: !topic.is_locked },
                                    }),
                                },
                                {
                                  label: topic.is_deleted ? "Restore topic" : "Hide topic",
                                  icon: Shield,
                                  badge: topic.is_deleted ? "Restore" : "Moderation",
                                  onClick: () =>
                                    updateTopic.mutate({
                                      residencyId: effectiveResidencyId,
                                      topicId: topic.id,
                                      data: { is_deleted: !topic.is_deleted },
                                    }),
                                },
                                {
                                  label: "Delete topic permanently",
                                  icon: Trash2,
                                  tone: "destructive",
                                  onClick: () => setTopicToDelete(topic),
                                },
                              ]}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {showPagination && (
              <div className="flex flex-col gap-3 border-t border-dashed border-border px-6 py-4">
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
        onClose={resetCategoryModal}
        title={categoryModalMode === "create" ? "Create Forum Category" : "Edit Forum Category"}
        className="bg-card"
      >
        <form className="space-y-4" onSubmit={handleCategorySubmit}>
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
                "min-h-[100px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              )}
              placeholder="Share a short summary or the type of updates that belong here."
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/25 px-3 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={categoryForm.isLocked}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, isLocked: event.target.checked }))
              }
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium">Lock category</span>
              <span className="text-xs text-muted-foreground">
                Locked categories are visible but cannot receive new resident topics.
              </span>
            </span>
          </label>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={resetCategoryModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createCategory.isPending || updateCategory.isPending}
              disabled={!categoryForm.name.trim() || !effectiveResidencyId}
            >
              {categoryModalMode === "create" ? "Create" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={resetTopicModal}
        title={topicModalMode === "create" ? "Start a New Topic" : "Edit Topic"}
        className="bg-card"
      >
        <form className="space-y-4" onSubmit={handleTopicSubmit}>
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
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
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
          {topicModalMode === "create" && (
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
                "min-h-[160px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              )}
              placeholder="Share details or context to kick-start the discussion."
              required
            />
          </div>
          )}
          {canModerateResidencyForum && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/25 px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={topicForm.isPinned}
                  onChange={(event) =>
                    setTopicForm((prev) => ({ ...prev, isPinned: event.target.checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium">Pin topic</span>
                  <span className="text-xs text-muted-foreground">Keep the topic near the top of the feed.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/25 px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={topicForm.isLocked}
                  onChange={(event) =>
                    setTopicForm((prev) => ({ ...prev, isLocked: event.target.checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium">Lock topic</span>
                  <span className="text-xs text-muted-foreground">Freeze replies while leaving the thread visible.</span>
                </span>
              </label>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={resetTopicModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createTopic.isPending || updateTopic.isPending}
              disabled={
                !topicForm.title.trim() ||
                (topicModalMode === "create" && !topicForm.content.trim()) ||
                !topicForm.categoryId
              }
            >
              {topicModalMode === "create" ? "Post topic" : "Save changes"}
            </Button>
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You need at least one category before creating topics.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmActionModal
        isOpen={!!categoryToDelete}
        title="Delete category"
        description={`Permanently delete ${categoryToDelete?.name ?? "this category"}. This action cannot be undone.`}
        confirmLabel="Delete category"
        tone="destructive"
        isLoading={deleteCategory.isPending}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (!categoryToDelete || !effectiveResidencyId) return;
          deleteCategory.mutate(
            { residencyId: effectiveResidencyId, categoryId: categoryToDelete.id },
            { onSuccess: () => setCategoryToDelete(null) }
          );
        }}
      />

      <ConfirmActionModal
        isOpen={!!topicToDelete}
        title="Delete topic permanently"
        description={`This will permanently remove ${topicToDelete?.title ?? "this topic"} from the forum.`}
        confirmLabel="Delete topic"
        tone="destructive"
        isLoading={deleteTopic.isPending}
        onCancel={() => setTopicToDelete(null)}
        onConfirm={() => {
          if (!topicToDelete || !effectiveResidencyId) return;
          deleteTopic.mutate(
            { residencyId: effectiveResidencyId, topicId: topicToDelete.id },
            { onSuccess: () => setTopicToDelete(null) }
          );
        }}
      />
    </>
  );
}

interface CategorySidebarProps {
  categories: CategoryWithCount[];
  activeCategoryId: string;
  totalTopics: number;
  isLoading: boolean;
  canModerate: boolean;
  residencyId: string;
  onSelectCategory: (categoryId: string) => void;
  onCreateCategory: () => void;
  onCreateTopic: (categoryId?: string) => void;
  onViewCategory: (categoryId: string) => void;
  onEditCategory: (category: ForumCategory) => void;
  onToggleCategoryLock: (category: ForumCategory) => void;
  onDeleteCategory: (category: ForumCategory) => void;
}

function CategorySidebar({
  categories,
  activeCategoryId,
  totalTopics,
  isLoading,
  canModerate,
  residencyId,
  onSelectCategory,
  onCreateCategory,
  onCreateTopic,
  onViewCategory,
  onEditCategory,
  onToggleCategoryLock,
  onDeleteCategory,
}: CategorySidebarProps) {
  const hasCategories = categories.length > 0;

  return (
    <aside className="h-fit rounded-3xl border border-border/60 bg-card/95 shadow-sm backdrop-blur lg:sticky lg:top-24">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Organize threads into themes.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shadow-sm" onClick={onCreateCategory}>
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
                category={{ id: "all", slug: "all", name: "All topics", is_default: false }}
              label="All topics"
              description="Everything in this residency"
              count={totalTopics}
              isActive={activeCategoryId === "all"}
                canModerate={false}
              onClick={() => onSelectCategory("all")}
            />
            {categories.map(({ category, topicCount }) => (
              <CategorySidebarItem
                key={category.id}
                category={category}
                label={category.name}
                description={category.description}
                scopeLabel={category.residency_id ? "Residency" : "Global"}
                count={topicCount}
                isActive={activeCategoryId === category.id}
                canModerate={canModerate && category.residency_id === residencyId}
                onClick={() => onSelectCategory(category.id)}
                onView={() => onViewCategory(category.id)}
                onStartTopic={() => onCreateTopic(category.id)}
                onEdit={() => onEditCategory(category)}
                onToggleLock={() => onToggleCategoryLock(category)}
                onDelete={() => onDeleteCategory(category)}
              />
            ))}
          </>
        ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
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
  category: ForumCategory;
  label: string;
  description?: string | null;
  scopeLabel?: string;
  count: number;
  isActive: boolean;
  canModerate: boolean;
  onClick: () => void;
  onView?: () => void;
  onStartTopic?: () => void;
  onEdit?: () => void;
  onToggleLock?: () => void;
  onDelete?: () => void;
}

function CategorySidebarItem({
  category,
  label,
  description,
  scopeLabel,
  count,
  isActive,
  canModerate,
  onClick,
  onView,
  onStartTopic,
  onEdit,
  onToggleLock,
  onDelete,
}: CategorySidebarItemProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition cursor-pointer hover:border-[rgb(var(--brand-primary)/0.35)] hover:bg-muted/20 hover:shadow-sm",
        isActive
          ? "border-[rgb(var(--brand-primary)/0.5)] bg-[rgb(var(--brand-primary)/0.10)] text-foreground"
          : "border-border/70 bg-background/70"
      )}
      onClick={onClick}
    >
      <div
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-sm font-semibold text-foreground", isActive ? "text-[rgb(var(--brand-primary))] dark:text-white" : "")}>{label}</p>
            {scopeLabel && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isActive
                    ? "bg-[rgb(var(--brand-primary)/0.12)] text-[rgb(var(--brand-primary))] dark:bg-white/10 dark:text-white/80"
                    : scopeLabel === "Global"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-emerald-100 text-emerald-700"
                )}
              >
                {scopeLabel}
              </span>
            )}
          </div>
          {description && (
            <p className={cn("text-xs text-foreground/80 dark:text-muted-foreground line-clamp-2", isActive ? "text-foreground/70 dark:text-white/70" : "")}>
              {description}
            </p>
          )}
        </div>
        <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground dark:bg-muted/80 dark:text-foreground">
          {count}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[rgb(var(--brand-primary))]">
        {onView && (
          <button
            type="button"
            className="rounded-full bg-[rgb(var(--brand-primary)/0.10)] px-3 py-1 hover:bg-[rgb(var(--brand-primary)/0.15)]"
            onClick={(event) => {
              event.stopPropagation();
              onView();
            }}
          >
            View
          </button>
        )}
        {onStartTopic && (
          <button
            type="button"
            className="rounded-full bg-[rgb(var(--brand-primary)/0.10)] px-3 py-1 hover:bg-[rgb(var(--brand-primary)/0.15)]"
            onClick={(event) => {
              event.stopPropagation();
              onStartTopic();
            }}
          >
            Start topic
          </button>
        )}
        {canModerate && (onEdit || onToggleLock || onDelete) && (
          <div onClick={(event) => event.stopPropagation()}>
            <ActionMenu
              size="sm"
              align="right"
              ariaLabel={`Moderate ${label}`}
              options={[
                ...(onEdit ? [{ label: "Edit category", icon: Pencil, onClick: onEdit }] : []),
                ...(onToggleLock
                  ? [{
                    label: category.is_locked ? "Unlock category" : "Lock category",
                    icon: category.is_locked ? Unlock : Lock,
                    onClick: onToggleLock,
                  }]
                  : []),
                ...(onDelete
                  ? [{
                    label: "Delete category",
                    icon: Trash2,
                    tone: "destructive" as const,
                    onClick: onDelete,
                  }]
                  : []),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
