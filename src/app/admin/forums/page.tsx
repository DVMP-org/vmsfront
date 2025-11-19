"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Filter,
  FolderOpen,
  Lock,
  MessageSquare,
  Pin,
  RefreshCcw,
  Search,
  Shield,
  Unlock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAdminHouses } from "@/hooks/use-admin";
import {
  useAdminForumCategories,
  useAdminForumTopics,
  useCreateAdminForumCategory,
  useUpdateAdminForumCategory,
  useDeleteAdminForumCategory,
  useCreateAdminForumTopic,
  useUpdateAdminForumTopic,
  useDeleteAdminForumTopic,
} from "@/hooks/use-admin-forum";
import type { ForumCategory, ForumTopic, House } from "@/types";
import { cn } from "@/lib/utils";
import { ActionMenu } from "./components/ActionMenu";
import {
  CategoryFormModal,
  TopicFormModal,
  ConfirmActionModal,
} from "./components/ForumModals";

interface FilterState {
  houseId: string;
  categoryId: string;
  status: "all" | "pinned" | "locked" | "deleted";
  page: number;
  search: string;
  startDate: string;
  endDate: string;
}

const DEFAULT_FILTERS: FilterState = {
  houseId: "all",
  categoryId: "all",
  status: "all",
  page: 1,
  search: "",
  startDate: "",
  endDate: "",
};

export default function AdminForumsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: housesData } = useAdminHouses({
    page: 1,
    pageSize: 500,
  });
  const houses = useMemo(
    () => housesData?.items ?? [],
    [housesData?.items]
  );

  const [filters, setFilters] = useState<FilterState>(() => ({
    houseId: searchParams.get("houseId") ?? DEFAULT_FILTERS.houseId,
    categoryId: searchParams.get("categoryId") ?? DEFAULT_FILTERS.categoryId,
    status: (searchParams.get("status") as FilterState["status"]) ??
      DEFAULT_FILTERS.status,
    page: Number(searchParams.get("page") ?? DEFAULT_FILTERS.page) || 1,
    search: searchParams.get("search") ?? DEFAULT_FILTERS.search,
    startDate: searchParams.get("startDate") ?? DEFAULT_FILTERS.startDate,
    endDate: searchParams.get("endDate") ?? DEFAULT_FILTERS.endDate,
  }));
  const [searchInput, setSearchInput] = useState(filters.search);

  const syncFiltersToUrl = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams();
      if (next.houseId && next.houseId !== "all") {
        params.set("houseId", next.houseId);
      }
      if (next.categoryId && next.categoryId !== "all") {
        params.set("categoryId", next.categoryId);
      }
      if (next.status !== "all") {
        params.set("status", next.status);
      }
      if (next.page > 1) {
        params.set("page", String(next.page));
      }
      if (next.search.trim().length > 0) {
        params.set("search", next.search.trim());
      }
      if (next.startDate) {
        params.set("startDate", next.startDate);
      }
      if (next.endDate) {
        params.set("endDate", next.endDate);
      }
      const queryString = params.toString();
      router.replace(
        queryString ? `${pathname}?${queryString}` : pathname,
        { scroll: false }
      );
    },
    [pathname, router]
  );

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      setFilters((prev) => {
        const merged: FilterState = {
          ...prev,
          ...patch,
        };
        syncFiltersToUrl(merged);
        return merged;
      });
    },
    [syncFiltersToUrl]
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      houseId: searchParams.get("houseId") ?? DEFAULT_FILTERS.houseId,
      categoryId: searchParams.get("categoryId") ?? DEFAULT_FILTERS.categoryId,
      status:
        (searchParams.get("status") as FilterState["status"]) ??
        DEFAULT_FILTERS.status,
      page: Number(searchParams.get("page") ?? DEFAULT_FILTERS.page) || 1,
      search: searchParams.get("search") ?? DEFAULT_FILTERS.search,
      startDate: searchParams.get("startDate") ?? DEFAULT_FILTERS.startDate,
      endDate: searchParams.get("endDate") ?? DEFAULT_FILTERS.endDate,
    }));
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      updateFilters({ search: searchInput, page: 1 });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput, updateFilters]);

  const selectedHouse: House | undefined = useMemo(() => {
    if (!houses || houses.length === 0) return undefined;
    if (filters.houseId === "all") return undefined;
    return houses.find((house) => house.id === filters.houseId);
  }, [houses, filters.houseId]);

  const categoriesResponse = useAdminForumCategories({
    page: 1,
    pageSize: 50,
    houseId: filters.houseId === "all" ? undefined : filters.houseId,
  });
  const topicsResponse = useAdminForumTopics({
    page: filters.page,
    pageSize: 10,
    houseId: filters.houseId === "all" ? undefined : filters.houseId,
    categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
    status: filters.status === "all" ? undefined : filters.status,
    search: filters.search,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const categories = useMemo(
    () => categoriesResponse.data?.items ?? [],
    [categoriesResponse.data?.items]
  );
  const topics = useMemo(
    () => topicsResponse.data?.items ?? [],
    [topicsResponse.data?.items]
  );
  const topicsTotal = topicsResponse.data?.total ?? topics.length;
  const topicsTotalPages = topicsResponse.data?.total_pages ?? 1;

  const categoriesByHouse = useMemo(() => {
    if (filters.houseId === "all") return categories;
    return categories.filter(
      (category) => category.house_id === filters.houseId
    );
  }, [categories, filters.houseId]);

  const categoriesWithCounts = useMemo(
    () => {
      const counts = new Map<string, number>();
      topics.forEach((topic) => {
        counts.set(
          topic.category_id,
          (counts.get(topic.category_id) ?? 0) + 1
        );
      });

      return categoriesByHouse.map((category) => ({
        category,
        topicCount: category.topics_count ?? counts.get(category.id) ?? 0,
      }));
    },
    [categoriesByHouse, topics]
  );

  const stats = useMemo(() => {
    const pinned = topics.filter((topic) => topic.is_pinned).length;
    const locked = topics.filter((topic) => topic.is_locked).length;
    const deleted = topics.filter((topic) => topic.is_deleted).length;
    return [
      {
        label: "Categories",
        value: categoriesByHouse.length,
        icon: FolderOpen,
        description: "Active forum spaces",
      },
      {
        label: "Topics",
        value: topicsTotal,
        icon: MessageSquare,
        description: "Scoped to filters",
      },
      {
        label: "Pinned",
        value: pinned,
        icon: Pin,
        description: "Priority announcements",
      },
      {
        label: "Locked",
        value: locked,
        icon: Lock,
        description: "Read only",
      },
      {
        label: "Deleted",
        value: deleted,
        icon: Shield,
        description: "Awaiting review",
      },
    ];
  }, [categoriesByHouse.length, topics, topicsTotal]);

  const categoryFetcher = categoriesResponse;
  const topicFetcher = topicsResponse;

  const createCategory = useCreateAdminForumCategory();
  const updateCategory = useUpdateAdminForumCategory();
  const deleteCategory = useDeleteAdminForumCategory();
  const createTopic = useCreateAdminForumTopic();
  const updateTopic = useUpdateAdminForumTopic();
  const deleteTopic = useDeleteAdminForumTopic();

  const [categoryModalMode, setCategoryModalMode] =
    useState<"create" | "edit">("create");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ForumCategory | null>(
    null
  );
  const [categoryToDelete, setCategoryToDelete] =
    useState<ForumCategory | null>(null);

  const [topicModalMode, setTopicModalMode] =
    useState<"create" | "edit">("create");
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<ForumTopic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);

  const handleResetFilters = () => {
    setSearchInput("");
    updateFilters(DEFAULT_FILTERS);
  };

  const handleCategorySubmit = (values: {
    houseId: string;
    name: string;
    description: string;
    isDefault: boolean;
    isLocked: boolean;
  }) => {
    if (categoryModalMode === "create") {
      createCategory.mutate(
        {
          house_id: values.houseId,
          name: values.name,
          description: values.description,
          is_default: values.isDefault,
          is_locked: values.isLocked,
        },
        {
          onSuccess: () => {
            setCategoryModalOpen(false);
          },
        }
      );
    } else if (activeCategory) {
      updateCategory.mutate(
        {
          categoryId: activeCategory.id,
          data: {
            name: values.name,
            description: values.description,
            is_default: values.isDefault,
            is_locked: values.isLocked,
            house_id: values.houseId,
          },
        },
        {
          onSuccess: () => {
            setCategoryModalOpen(false);
          },
        }
      );
    }
  };

  const handleTopicSubmit = (values: {
    houseId: string;
    categoryId: string;
    title: string;
    content: string;
    isPinned: boolean;
    isLocked: boolean;
  }) => {
    if (topicModalMode === "create") {
      createTopic.mutate(
        {
          house_id: values.houseId,
          category_id: values.categoryId,
          title: values.title,
          content: values.content,
        },
        {
          onSuccess: (response) => {
            setTopicModalOpen(false);
            if (response.data.id) {
              router.push(`/admin/forums/topic/${response.data.id}`);
            }
          },
        }
      );
    } else if (activeTopic) {
      updateTopic.mutate(
        {
          topicId: activeTopic.id,
          data: {
            title: values.title,
            category_id: values.categoryId,
            house_id: values.houseId,
            is_pinned: values.isPinned,
            is_locked: values.isLocked,
          },
        },
        {
          onSuccess: () => {
            setTopicModalOpen(false);
          },
        }
      );
    }
  };

  const categoryFutureHook = (
    <Button variant="outline" disabled className="gap-2 text-xs md:text-sm">
      <Shield className="h-4 w-4" />
      Reports queue
      <Badge variant="warning" className="ml-1 text-[10px] uppercase">
        Future Hook
      </Badge>
    </Button>
  );

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="rounded-3xl border border-dashed border-border/60 bg-gradient-to-br from-[var(--brand-primary,#2563eb)]/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--brand-primary,#2563eb)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#2563eb)]">
                <MessageSquare className="h-4 w-4" />
                Forums
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                Admin Forums Control
              </h1>
              <p className="text-sm text-muted-foreground">
                Create, organize, moderate, and analyze conversations across houses.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:min-w-[200px]"
                value={filters.houseId}
                onChange={(event) => {
                  updateFilters({ houseId: event.target.value, page: 1 });
                }}
              >
                <option value="all">All houses</option>
                {houses?.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  className="w-full rounded-2xl sm:w-auto px-10 py-4 text-xs font-semibold uppercase tracking-wide"
                  onClick={() => {
                    setCategoryModalMode("create");
                    setActiveCategory(null);
                    setCategoryModalOpen(true);
                  }}
                >
                  Create category
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl sm:w-auto px-10 py-4 sm:w-auto"
                  onClick={() => {
                    setTopicModalMode("create");
                    setActiveTopic(null);
                    setTopicModalOpen(true);
                  }}
                >
                  Start topic
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <span className="rounded-xl bg-muted/60 p-2">
                      <Icon className="h-4 w-4 text-[var(--brand-primary,#2563eb)]" />
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border px-3 py-2">
              <SearchField value={searchInput} onChange={setSearchInput} />
            </div>
            <select
              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-48"
              value={filters.categoryId}
              onChange={(event) =>
                updateFilters({ categoryId: event.target.value, page: 1 })
              }
            >
              <option value="all">All categories</option>
              {categoriesByHouse.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1 rounded-2xl border border-border bg-muted/40 p-1">
              {(["all", "pinned", "locked", "deleted"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateFilters({ status: value, page: 1 })}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                    filters.status === value
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <DateInput
              label="From"
              value={filters.startDate}
              onChange={(value) =>
                updateFilters({ startDate: value, page: 1 })
              }
            />
            <DateInput
              label="To"
              value={filters.endDate}
              onChange={(value) => updateFilters({ endDate: value, page: 1 })}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            onClick={handleResetFilters}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          <Card className="h-full rounded-3xl border border-dashed">
            <CardHeader className="flex flex-wrap items-start gap-4">
              <div className="space-y-1">
                <CardTitle>Categories</CardTitle>
                <CardDescription>Organize topics per house</CardDescription>
              </div>
              {categoryFutureHook}
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryFetcher.isLoading ? (
                <CategorySkeleton />
              ) : categoriesByHouse.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No categories yet"
                  description="Create the first category to organize conversations."
                  action={{
                    label: "Create category",
                    onClick: () => {
                      setCategoryModalMode("create");
                      setActiveCategory(null);
                      setCategoryModalOpen(true);
                    },
                  }}
                />
              ) : (
                <div className="grid gap-3">
                  {categoriesWithCounts.map(({ category, topicCount }) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      topicCount={topicCount}
                      onOpen={() =>
                        router.push(`/admin/forums/category/${category.id}`)
                      }
                      onEdit={() => {
                        setCategoryModalMode("edit");
                        setActiveCategory(category);
                        setCategoryModalOpen(true);
                      }}
                      onToggleLock={() =>
                        updateCategory.mutate({
                          categoryId: category.id,
                          data: {
                            is_locked: !category.is_locked,
                            house_id: category.house_id,
                          },
                        })
                      }
                      onSetDefault={() =>
                        updateCategory.mutate({
                          categoryId: category.id,
                          data: {
                            is_default: true,
                            house_id: category.house_id,
                          },
                        })
                      }
                      onDelete={() => setCategoryToDelete(category)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-dashed">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent topics</CardTitle>
                  <CardDescription>
                    {selectedHouse
                      ? `Scoped to ${selectedHouse.name}`
                      : "All houses"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-semibold uppercase tracking-wide"
                  onClick={() => topicFetcher.refetch()}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {topicFetcher.isLoading ? (
                <TableSkeleton />
              ) : topics.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No topics match these filters"
                  description="Try adjusting filters or create a new topic."
                  action={{
                    label: "Create topic",
                    onClick: () => {
                      setTopicModalMode("create");
                      setActiveTopic(null);
                      setTopicModalOpen(true);
                    },
                  }}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Last activity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topics.map((topic) => (
                        <TableRow key={topic.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/admin/forums/topic/${topic.id}`)
                                }
                                className="text-left text-sm font-semibold text-foreground transition hover:text-[var(--brand-primary,#2563eb)]"
                              >
                                {topic.title}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                {topic.author_name || "System"} ·{" "}
                                {topic.posts_count} posts
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{topic.category?.name || "—"}</Badge>
                            {topic.house?.name && (
                              <p className="text-[11px] text-muted-foreground">
                                {topic.house.name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {topic.last_post_at ? (
                              <span className="text-xs text-foreground">
                                {formatDistanceToNow(
                                  new Date(topic.last_post_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <TopicStatusChips topic={topic} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/admin/forums/topic/${topic.id}`)
                                }
                              >
                                Open
                              </Button>
                              <ActionMenu
                                size="sm"
                                options={[
                                  {
                                    label: "Edit",
                                    onClick: () => {
                                      setTopicModalMode("edit");
                                      setActiveTopic(topic);
                                      setTopicModalOpen(true);
                                    },
                                  },
                                  {
                                    label: topic.is_pinned ? "Unpin" : "Pin",
                                    icon: Pin,
                                    onClick: () =>
                                      updateTopic.mutate({
                                        topicId: topic.id,
                                        data: { is_pinned: !topic.is_pinned },
                                      }),
                                  },
                                  {
                                    label: topic.is_locked ? "Unlock" : "Lock",
                                    icon: topic.is_locked ? Unlock : Lock,
                                    onClick: () =>
                                      updateTopic.mutate({
                                        topicId: topic.id,
                                        data: { is_locked: !topic.is_locked },
                                      }),
                                  },
                                  {
                                    label: topic.is_deleted ? "Restore" : "Soft delete",
                                    icon: Shield,
                                    onClick: () =>
                                      updateTopic.mutate({
                                        topicId: topic.id,
                                        data: { is_deleted: !topic.is_deleted },
                                      }),
                                  },
                                  {
                                    label: "Hard delete",
                                    tone: "destructive",
                                    onClick: () => setTopicToDelete(topic),
                                  },
                                ]}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar
                    page={filters.page}
                    totalPages={topicsTotalPages}
                    total={topicsTotal}
                    pageSize={10}
                    resourceLabel="topics"
                    onChange={(page) => updateFilters({ page })}
                    isFetching={topicFetcher.isFetching}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        mode={categoryModalMode}
        houses={houses}
        defaultHouseId={
          filters.houseId !== "all" ? filters.houseId : houses?.[0]?.id
        }
        initialValues={
          activeCategory
            ? {
                houseId: activeCategory.house_id || "",
                name: activeCategory.name,
                description: activeCategory.description ?? "",
                isDefault: activeCategory.is_default,
                isLocked: Boolean(activeCategory.is_locked),
              }
            : undefined
        }
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        isSubmitting={
          createCategory.isPending || updateCategory.isPending
        }
      />

      <TopicFormModal
        isOpen={topicModalOpen}
        mode={topicModalMode}
        houses={houses}
        categories={categories}
        defaultHouseId={
          filters.houseId !== "all" ? filters.houseId : houses?.[0]?.id
        }
        initialValues={
          activeTopic
            ? {
                houseId: activeTopic.house_id || "",
                categoryId: activeTopic.category_id,
                title: activeTopic.title,
                content: activeTopic.initial_post?.content ?? "",
                isPinned: activeTopic.is_pinned,
                isLocked: activeTopic.is_locked,
              }
            : undefined
        }
        onClose={() => setTopicModalOpen(false)}
        onSubmit={handleTopicSubmit}
        isSubmitting={
          createTopic.isPending || updateTopic.isPending
        }
      />

      <ConfirmActionModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete category"
        description="This removes the category from all houses. Topics will remain, but need to be re-categorized."
        confirmLabel="Delete category"
        tone="destructive"
        onConfirm={() => {
          if (!categoryToDelete) return;
          deleteCategory.mutate(categoryToDelete.id, {
            onSuccess: () => setCategoryToDelete(null),
          });
        }}
        onCancel={() => setCategoryToDelete(null)}
        isLoading={deleteCategory.isPending}
      />

      <ConfirmActionModal
        isOpen={Boolean(topicToDelete)}
        title="Hard delete topic"
        description="Hard deleting permanently removes the thread and posts."
        confirmLabel="Delete topic"
        tone="destructive"
        onConfirm={() => {
          if (!topicToDelete) return;
          deleteTopic.mutate(topicToDelete.id, {
            onSuccess: () => setTopicToDelete(null),
          });
        }}
        onCancel={() => setTopicToDelete(null)}
        isLoading={deleteTopic.isPending}
      />
    </DashboardLayout>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search topic titles"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-none bg-transparent pl-0 outline-none ring-0 focus-visible:ring-0"
      />
    </>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Calendar className="h-4 w-4" />
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-transparent bg-transparent text-foreground focus-visible:outline-none"
      />
    </label>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl border border-dashed border-border/70 bg-muted/40"
        />
      ))}
    </div>
  );
}

function CategoryCard({
  category,
  topicCount,
  onOpen,
  onEdit,
  onToggleLock,
  onSetDefault,
  onDelete,
}: {
  category: ForumCategory;
  topicCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onToggleLock: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onOpen}
            className="text-left text-base font-semibold text-foreground hover:text-[var(--brand-primary,#2563eb)]"
          >
            {category.name}
          </button>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {category.description || "No description provided."}
          </p>
        </div>
        <ActionMenu
          size="sm"
          options={[
            { label: "View topics", onClick: onOpen },
            { label: "Edit", onClick: onEdit },
            {
              label: category.is_locked ? "Unlock" : "Lock",
              icon: category.is_locked ? Unlock : Lock,
              onClick: onToggleLock,
            },
            {
              label: "Set as default",
              icon: Pin,
              onClick: onSetDefault,
            },
            {
              label: "Delete",
              tone: "destructive",
              onClick: onDelete,
            },
          ]}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          {topicCount} topics
        </Badge>
        {category.is_default && (
          <Badge variant="success">Default</Badge>
        )}
        {category.is_locked && <Badge variant="warning">Locked</Badge>}
        <span className="text-[11px]">
          Updated{" "}
          {category.updated_at
            ? formatDistanceToNow(new Date(category.updated_at), {
                addSuffix: true,
              })
            : "—"}
        </span>
      </div>
    </div>
  );
}

function TopicStatusChips({ topic }: { topic: ForumTopic }) {
  return (
    <div className="flex flex-wrap gap-1">
      {topic.is_pinned && (
        <Badge variant="warning" className="gap-1">
          <Pin className="h-3 w-3" />
          Pinned
        </Badge>
      )}
      {topic.is_locked && (
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Locked
        </Badge>
      )}
      {topic.is_deleted && (
        <Badge variant="danger" className="gap-1">
          <Shield className="h-3 w-3" />
          Deleted
        </Badge>
      )}
    </div>
  );
}
