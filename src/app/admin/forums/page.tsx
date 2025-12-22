"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
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
import { TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
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
        return merged;
      });
    },
    []
  );

  // Add a useEffect to sync URL when filters change
  // But only sync if the change didn't come from URL params (to avoid loops)
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip on initial mount to avoid syncing URL params back
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncFiltersToUrl(filters);
  }, [filters, syncFiltersToUrl]);

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
    // Reset initial mount flag when searchParams change
    isInitialMount.current = true;
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
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 border-b border-foreground/20 pb-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Forum Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Moderate and organize estate conversations</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <select
              className="rounded border border-foreground/20  px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground h-8 bg-foreground/10"
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
            <Button
              size="sm"
              onClick={() => {
                setCategoryModalMode("create");
                setActiveCategory(null);
                setCategoryModalOpen(true);
              }}
              className="h-8 text-xs"
            >
              New Category
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTopicModalMode("create");
                setActiveTopic(null);
                setTopicModalOpen(true);
              }}
              className="h-8 text-xs"
            >
              New Topic
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="border border-foreground/20 rounded-l p-4 hover:muted-foreground transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                  <div className="p-1.5 rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border border-foreground/20 rounded bg-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center w-full md:w-auto">
            <div className="flex flex-1 items-center gap-2 border border-zinc-200 rounded px-3 py-1.5">
              <SearchField value={searchInput} onChange={setSearchInput} />
            </div>
            <select
              className="border border-foreground/20 rounded bg-foreground/10 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground w-full md:w-48 h-8"
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
            <div className="flex gap-1 border border-foreground/20 rounded bg-muted p-0.5">
              {(["all", "pinned", "locked", "deleted"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateFilters({ status: value, page: 1 })}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium uppercase tracking-wide transition h-7",
                    filters.status === value
                      ? "bg-foreground/10 text-foreground shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
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
            className="gap-2 text-xs h-8"
            onClick={handleResetFilters}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[2fr,3fr]">
          {/* Categories List */}
          <div className="border border-foreground/20 rounded-lg shadow-sm">
            <div className="border-b border-foreground/20 bg-gradient-to-r from-muted to-foreground/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                Categories
              </h2>
            </div>
            <div className="divide-y divide-foreground/20">
              {categoryFetcher.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : categoriesByHouse.length === 0 ? (
                <div className="p-8">
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
                </div>
              ) : (
                categoriesWithCounts.map(({ category, topicCount }) => (
                  <div
                    key={category.id}
                    className="px-4 py-3 hover:bg-muted transition-colors border-l-2 border-transparent hover:border-foreground/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/forums/category/${category.id}`)
                            }
                            className="text-sm font-medium text-foreground hover:text-muted-foreground"
                          >
                            {category.name}
                          </button>
                          {category.is_default && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                              Default
                            </span>
                          )}
                          {category.is_locked && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                              Locked
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-muted-foreground">{topicCount} topics</span>
                          {category.house?.name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {category.house.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ActionMenu
                        size="sm"
                        options={[
                          {
                            label: "View topics",
                            onClick: () =>
                              router.push(`/admin/forums/category/${category.id}`),
                          },
                          {
                            label: "Edit",
                            onClick: () => {
                              setCategoryModalMode("edit");
                              setActiveCategory(category);
                              setCategoryModalOpen(true);
                            },
                          },
                          {
                            label: category.is_locked ? "Unlock" : "Lock",
                            icon: category.is_locked ? Unlock : Lock,
                            onClick: () =>
                              updateCategory.mutate({
                                categoryId: category.id,
                                data: {
                                  is_locked: !category.is_locked,
                                  house_id: category.house_id,
                                },
                              }),
                          },
                          {
                            label: "Set as default",
                            icon: Pin,
                            onClick: () =>
                              updateCategory.mutate({
                                categoryId: category.id,
                                data: {
                                  is_default: true,
                                  house_id: category.house_id,
                                },
                              }),
                          },
                          {
                            label: "Delete",
                            tone: "destructive",
                            onClick: () => setCategoryToDelete(category),
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Topics Table */}
          <div className="border border-foreground/20 rounded-lg shadow-sm">
            <div className="border-b border-foreground/20 bg-foreground/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Topics
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedHouse
                      ? `Scoped to ${selectedHouse.name}`
                      : "All houses"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs h-8"
                  onClick={() => topicFetcher.refetch()}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              {topicFetcher.isLoading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : topics.length === 0 ? (
                <div className="p-8">
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
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader className="rounded-none transition-colors">
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
                        <TableRow key={topic.id} className="hover:bg-muted transition-colors border-b border-foreground/20">
                          <TableCell>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/admin/forums/topic/${topic.id}`)
                                }
                                className="text-left text-sm font-medium text-foreground transition hover:text-muted-foreground"
                              >
                                {topic.title}
                              </button>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {topic.author_name || "System"} ·{" "}
                                <span className="font-medium">{topic.posts_count}</span> posts
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {topic.category ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                {topic.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            {topic.house?.name && (
                              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {topic.house.name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {topic.last_post_at ? (
                              <span className="text-xs text-muted-foreground">
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
                                className="h-7 text-xs"
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
                  <div className="border-t border-foreground/20 px-4 py-3">
                    <PaginationBar
                      page={filters.page}
                      totalPages={topicsTotalPages}
                      total={topicsTotal}
                      pageSize={10}
                      resourceLabel="topics"
                      onChange={(page) => updateFilters({ page })}
                      isFetching={topicFetcher.isFetching}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
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
    <label className="flex items-center gap-2 border border-foreground/20 rounded px-3 py-1.5 text-xs font-medium text-muted-foreground h-8">
      <Calendar className="h-3.5 w-3.5" />
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-transparent bg-transparent text-foreground text-xs focus-visible:outline-none"
      />
    </label>
  );
}



function TopicStatusChips({ topic }: { topic: ForumTopic }) {
  return (
    <div className="flex flex-wrap gap-1">
      {topic.is_pinned && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          Pinned
        </span>
      )}
      {topic.is_locked && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
          Locked
        </span>
      )}
      {topic.is_deleted && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
          Deleted
        </span>
      )}
    </div>
  );
}
