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
import { useAdminResidencies, useAdminResidencyGroups } from "@/hooks/use-admin";
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
import type { ForumCategory, ForumTopic, Residency, ResidencyGroup } from "@/types";
import { cn } from "@/lib/utils";
import { ActionMenu } from "./components/ActionMenu";
import {
  CategoryFormModal,
  TopicFormModal,
  ConfirmActionModal,
} from "./components/ForumModals";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { FilterConfig } from "@/components/ui/DataTable";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const PAGE_SIZE = 100;

export default function AdminForumsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: residenciesData } = useAdminResidencies({
    page: 1,
    pageSize: 100,
  });
  const residencies = useMemo(
    () => residenciesData?.items ?? [],
    [residenciesData?.items]
  );
  const { data: residencyGroupsData } = useAdminResidencyGroups({
    page: 1,
    pageSize: 100,
  });
  const residencyGroups = useMemo(
    () => residencyGroupsData?.items ?? [],
    [residencyGroupsData?.items]
  );



  // URL query sync
  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: {
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      isPinned: { defaultValue: undefined },
      isLocked: { defaultValue: undefined },
      isDeleted: { defaultValue: undefined },
      residencyId: { defaultValue: "all" },
      categoryId: { defaultValue: "all" },
      startDate: { defaultValue: undefined },
      endDate: { defaultValue: undefined },
    },
    skipInitialSync: true,
  });


  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [residencyId, setResidencyId] = useState(() => initializeFromUrl("residencyId"));
  const [categoryId, setCategoryId] = useState(() => initializeFromUrl("categoryId"));
  const [isPinned, setIsPinned] = useState(() => initializeFromUrl("isPinned"));
  const [isDeleted, setIsDeleted] = useState(() => initializeFromUrl("isDeleted"));
  const [isLocked, setIsLocked] = useState(() => initializeFromUrl("isLocked"));
  const [startDate, setStartDate] = useState(() => initializeFromUrl("startDate"));
  const [endDate, setEndDate] = useState(() => initializeFromUrl("endDate"));

  const [searchInput, setSearchInput] = useState(search);

  const activeStatusFilter = useMemo(() => {
    if (isPinned) return "pinned";
    if (isLocked) return "locked";
    if (isDeleted) return "deleted";
    return "all";
  }, [isDeleted, isLocked, isPinned]);

  const setExclusiveStatusFilter = useCallback(
    (next: "all" | "pinned" | "locked" | "deleted") => {
      setIsPinned(next === "pinned" ? "true" : undefined);
      setIsLocked(next === "locked" ? "true" : undefined);
      setIsDeleted(next === "deleted" ? "true" : undefined);
      setPage(1);
    },
    []
  );

  useEffect(() => {
    syncToUrl({ page, pageSize, search, isPinned, isLocked, isDeleted, residencyId, categoryId, startDate, endDate });
  }, [page, pageSize, search, isPinned, isLocked, isDeleted, residencyId, categoryId, startDate, endDate, syncToUrl]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (residencyId && residencyId !== "all") {
      filters.push({ field: "residency_id", operator: "eq" as const, value: residencyId });
    }
    if (categoryId !== "all") filters.push({ field: "category_id", operator: "eq" as const, value: categoryId });
    if (isPinned) filters.push({ field: "is_pinned", operator: "eq" as const, value: isPinned });
    if (isLocked) filters.push({ field: "is_locked", operator: "eq" as const, value: isLocked });
    if (isDeleted) filters.push({ field: "is_deleted", operator: "eq" as const, value: isDeleted });

    if (startDate) filters.push({ field: "created_at", operator: "gte" as const, value: startDate });
    if (endDate) filters.push({ field: "created_at", operator: "lte" as const, value: endDate });

    return filters;
  }, [residencyId, categoryId, isPinned, isLocked, isDeleted, startDate, endDate]);

  const apiFilters = useMemo(() => formatFiltersForAPI(activeFilters), [activeFilters]);

  const selectedResidency: Residency | undefined = useMemo(() => {
    if (!residencies || residencies.length === 0) return undefined;
    if (residencyId === "all") return undefined;
    return residencies.find((residency) => residency.id === residencyId);
  }, [residencies, residencyId]);

  const residencyOptions = useMemo(
    () => [
      { label: "All residencies", value: "all" },
      ...residencies.map((residency) => ({
        label: residency.name,
        value: residency.id,
      })),
    ],
    [residencies]
  );

  const categoriesResponse = useAdminForumCategories({
    page: 1,
    pageSize: 100,
  });

  const topicsResponse = useAdminForumTopics({
    page,
    pageSize: 10,
    search: search.trim() || undefined,
    filters: apiFilters,
  });

  const categories = useMemo(
    () => categoriesResponse.data?.items ?? [],
    [categoriesResponse]
  );
  const topics = useMemo(
    () => topicsResponse.data?.items ?? [],
    [topicsResponse.data?.items]
  );
  const topicsTotal = topicsResponse.data?.total ?? topics.length;
  const topicsTotalPages = topicsResponse.data?.total_pages ?? 1;

  const categoriesByResidency = useMemo(() => {
    if (!residencyId || residencyId === "all") return categories;
    return categories.filter(
      (category) => !category.residency_id || category.residency_id === residencyId
    );
  }, [categories, residencyId]);

  const categoryOptions = useMemo(
    () => [
      { label: "All categories", value: "all" },
      ...categoriesByResidency.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    ],
    [categoriesByResidency]
  );

  const categoriesWithCounts = useMemo(
    () => {
      const counts = new Map<string, number>();
      topics.forEach((topic) => {
        counts.set(
          topic.category_id,
          (counts.get(topic.category_id) ?? 0) + 1
        );
      });

      return categoriesByResidency.map((category) => ({
        category,
        topicCount: category.topics_count ?? counts.get(category.id) ?? 0,
      }));
    },
    [categoriesByResidency, topics]
  );

  const stats = useMemo(() => {
    const pinned = topics.filter((topic) => topic.is_pinned).length;
    const locked = topics.filter((topic) => topic.is_locked).length;
    const deleted = topics.filter((topic) => topic.is_deleted).length;
    return [
      {
        label: "Categories",
        value: categoriesByResidency.length,
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
  }, [categoriesByResidency.length, topics, topicsTotal]);

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
    setSearch("");
    setResidencyId("all");
    setCategoryId("all");
    setIsPinned(undefined);
    setIsLocked(undefined);
    setIsDeleted(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const handleCategorySubmit = (values: {
    scopeType: "organization" | "residency";
    residencyId: string;
    name: string;
    description: string;
    isDefault: boolean;
    isLocked: boolean;
  }) => {
    if (categoryModalMode === "create") {
      createCategory.mutate(
        {
          residency_id:
            values.scopeType === "organization" ? null : values.residencyId,
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
            residency_id:
              values.scopeType === "organization" ? undefined : values.residencyId,
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
    targetType: "global" | "residency" | "residencyGroup";
    residencyId: string;
    residencyGroupId: string;
    categoryId: string;
    title: string;
    content: string;
    isPinned: boolean;
    isLocked: boolean;
  }) => {
    if (topicModalMode === "create") {
      createTopic.mutate(
        {
          residency_id:
            values.targetType === "global"
              ? null
              : values.targetType === "residency"
                ? values.residencyId
                : undefined,
          residency_group_id:
            values.targetType === "residencyGroup"
              ? values.residencyGroupId
              : undefined,
          category_id: values.categoryId,
          title: values.title,
          content: values.content,
        },
        {
          onSuccess: (response) => {
            setTopicModalOpen(false);
            if (values.targetType !== "residencyGroup" && response.data.id) {
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
            residency_id:
              values.targetType === "residency" ? values.residencyId : undefined,
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
    <>
      <div className="space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 border-b border-foreground/20 pb-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Forum Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Moderate and organize estate conversations</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <SearchableSelect
              options={residencyOptions}
              value={residencyId}
              onChange={(value) => {
                setResidencyId(value || "all");
                setPage(1);
              }}
              placeholder="All residencies"
              isClearable={false}
              className="min-w-[150px] min-h-[32px] h-[10px]"
            />
            <Button
              size="sm"
              onClick={() => {
                setCategoryModalMode("create");
                setActiveCategory(null);
                setCategoryModalOpen(true);
              }}
              className="h-8 text-xs px-8 py-4"
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
              className="h-8 text-xs px-8 py-4"
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

        <div className="rounded-2xl border border-border/60 bg-card/95 px-4 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
              {activeStatusFilter !== "all" && (
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] uppercase">
                  {activeStatusFilter}
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between xl:flex-1">
              <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm min-w-[250px] md:w-auto">
                  <SearchField value={searchInput} onChange={setSearchInput} />
            </div>
                <SearchableSelect
                  options={categoryOptions}
              value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value || "all");
                setPage(1);
              }}
                  placeholder="All categories"
                  isClearable={false}
                  className="min-w-[150px] min-h-[32px] h-[10px]"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                    onClick={() => setExclusiveStatusFilter("all")}
                className={cn(
                  "h-8 rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
                  activeStatusFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                    onClick={() => setExclusiveStatusFilter(activeStatusFilter === "pinned" ? "all" : "pinned")}
                className={cn(
                  "h-8 rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
                  activeStatusFilter === "pinned"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pinned
              </button>
              <button
                type="button"
                    onClick={() => setExclusiveStatusFilter(activeStatusFilter === "locked" ? "all" : "locked")}
                className={cn(
                  "h-8 rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
                  activeStatusFilter === "locked"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Locked
              </button>
              <button
                type="button"
                    onClick={() => setExclusiveStatusFilter(activeStatusFilter === "deleted" ? "all" : "deleted")}
                className={cn(
                  "h-8 rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
                  activeStatusFilter === "deleted"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Deleted
              </button>
                </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <DateInput
              label="From"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                setPage(1);
              }}
            />
            <DateInput
              label="To"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
                  className="h-10 gap-2 rounded-xl border border-border/60 px-3 text-xs"
            onClick={handleResetFilters}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[2fr,3fr]">
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
              ) : categoriesByResidency.length === 0 ? (
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
                    className="px-4 py-3 hover:bg-muted transition-colors border-l-4 border border-muted dark:border-muted hover:border-foreground/20"
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
                          {category.residency?.name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {category.residency.name}
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
                                  residency_id: category?.residency_id || "",
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
                                  residency_id: category?.residency_id || "",
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
                    {selectedResidency
                      ? `Scoped to ${selectedResidency.name}`
                      : "All residencies"}
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
                            {topic.residency?.name && (
                              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {topic.residency.name}
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
                      <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <PaginationBar
                            page={page}
                            totalPages={topicsTotalPages}
                            total={topicsTotal}
                            pageSize={10}
                            resourceLabel="topics"
                            onChange={setPage}
                            isFetching={topicFetcher.isFetching}
                          />
                        </div>
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
        residencies={residencies}
        defaultResidencyId={
          residencyId !== "all" ? residencyId : residencies?.[0]?.id
        }
        initialValues={
          activeCategory
            ? {
              scopeType: activeCategory.residency_id ? "residency" : "organization",
              residencyId: activeCategory.residency_id || "",
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
        residencies={residencies}
        residencyGroups={residencyGroups}
        categories={categories}
        defaultResidencyId={
          residencyId !== "all" ? residencyId : residencies?.[0]?.id
        }
        initialValues={
          activeTopic
            ? {
              targetType: activeTopic.residency_id ? "residency" : "global",
              residencyId: activeTopic.residency_id || "",
              residencyGroupId: "",
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
        description="This removes the category from all residencies. Topics will remain, but need to be re-categorized."
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
    </>
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
        className=""
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
