"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckSquare,
  Lock,
  MessageSquare,
  Pin,
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
import { Checkbox } from "@/components/ui/Checkbox";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAdminHouses } from "@/hooks/use-admin";
import {
  useAdminForumCategories,
  useAdminForumCategory,
  useAdminForumTopics,
  useUpdateAdminForumCategory,
  useDeleteAdminForumCategory,
  useUpdateAdminForumTopic,
  useCreateAdminForumTopic,
  useDeleteAdminForumTopic,
} from "@/hooks/use-admin-forum";
import { ActionMenu } from "@/app/admin/forums/components/ActionMenu";
import {
  CategoryFormModal,
  TopicFormModal,
  ConfirmActionModal,
} from "@/app/admin/forums/components/ForumModals";
import type { ForumTopic } from "@/types";

export default function AdminForumCategoryDetailPage() {
  const params = useParams<{ categoryId: string | string[] }>();
  const normalizedCategoryId = useMemo(() => {
    if (!params?.categoryId) return undefined;
    return Array.isArray(params.categoryId)
      ? params.categoryId[0]
      : params.categoryId;
  }, [params?.categoryId]);
  const router = useRouter();
  const { data: housesData } = useAdminHouses({
    page: 1,
    pageSize: 500,
  });
  const houses = housesData?.items ?? [];

  const categoryQuery = useAdminForumCategory(normalizedCategoryId ?? null);
  const categoriesQuery = useAdminForumCategories({
    page: 1,
    pageSize: 100,
    houseId: categoryQuery.data?.house_id,
  });
  const [page, setPage] = useState(1);
  const category = categoryQuery.data;
  const categoryTopicsFilters = useMemo(
    () => ({
      page,
      pageSize: 10,
      categoryId: normalizedCategoryId ?? undefined,
      houseId: category?.house_id ?? undefined,
    }),
    [page, normalizedCategoryId, category?.house_id]
  );
  const topicsQuery = useAdminForumTopics(categoryTopicsFilters, {
    enabled: Boolean(normalizedCategoryId),
  });

  const updateCategory = useUpdateAdminForumCategory();
  const deleteCategory = useDeleteAdminForumCategory();
  const updateTopic = useUpdateAdminForumTopic();
  const deleteTopic = useDeleteAdminForumTopic();
  const createTopic = useCreateAdminForumTopic();

  const topics = topicsQuery.data?.items ?? [];
  const totalTopics = topicsQuery.data?.total ?? topics.length;
  const totalPages = topicsQuery.data?.total_pages ?? 1;

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<ForumTopic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    () => new Set()
  );
  const [bulkAction, setBulkAction] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const toggleTopicSelection = (topicId: string, checked: boolean) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(topicId);
      } else {
        next.delete(topicId);
      }
      return next;
    });
  };

  const allSelected =
    topics.length > 0 && selectedTopics.size === topics.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTopics(new Set(topics.map((topic) => topic.id)));
    } else {
      setSelectedTopics(new Set());
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTopics.size === 0) return;
    const payloads: Record<string, any> = {
      pin: { is_pinned: true },
      unpin: { is_pinned: false },
      lock: { is_locked: true },
      unlock: { is_locked: false },
      delete: { is_deleted: true },
    };
    const data = payloads[bulkAction];
    if (!data) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedTopics).map((topicId) =>
          updateTopic.mutateAsync({ topicId, data })
        )
      );
      setSelectedTopics(new Set());
      setBulkAction("");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const categoriesForModal = useMemo(() => {
    const fetched = categoriesQuery.data?.items ?? [];
    if (fetched.length > 0) {
      return fetched;
    }
    return category ? [category] : [];
  }, [categoriesQuery.data?.items, category]);

  const breadcrumb = (
    <nav className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="transition hover:text-foreground"
      >
        Admin
      </button>{" "}
      /{" "}
      <button
        type="button"
        onClick={() => router.push("/admin/forums")}
        className="transition hover:text-foreground"
      >
        Forums
      </button>{" "}
      / <span className="text-foreground">{category?.name ?? "Category"}</span>
    </nav>
  );

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        {breadcrumb}
        <Card className="rounded-3xl border border-dashed">
          <CardHeader className="flex flex-wrap items-start gap-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => router.push("/admin/forums")}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Overview
              </button>
              <div className="flex items-center gap-2">
                <CardTitle>{category?.name ?? "Loading category"}</CardTitle>
                {category?.is_default && (
                  <Badge variant="success" className="uppercase">
                    Default
                  </Badge>
                )}
                {category?.is_locked && (
                  <Badge variant="warning" className="uppercase">
                    Locked
                  </Badge>
                )}
              </div>
              <CardDescription>
                {category?.description || "No description provided."}
              </CardDescription>
              {category?.house_id && (
                <p className="text-xs text-muted-foreground">
                  House scope ·{" "}
                  {houses?.find((house) => house.id === category.house_id)?.name ||
                    category.house_id}
                </p>
              )}
              {category?.updated_at && (
                <p className="text-xs text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(new Date(category.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTopicToEdit(null);
                  setTopicModalOpen(true);
                }}
              >
                Create topic
              </Button>
              <Button
                variant="outline"
                onClick={() => setCategoryModalOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  updateCategory.mutate({
                    categoryId: normalizedCategoryId!,
                    data: { is_locked: !category?.is_locked },
                  })
                }
              >
                {category?.is_locked ? "Unlock" : "Lock"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  updateCategory.mutate({
                    categoryId: normalizedCategoryId!,
                    data: { is_default: true, house_id: category?.house_id },
                  })
                }
              >
                Set default
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCategoryToDelete(true)}
              >
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span>
                  {selectedTopics.size} selected of {topics.length} on this page
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-wide focus-visible:outline-none"
                  value={bulkAction}
                  onChange={(event) => setBulkAction(event.target.value)}
                >
                  <option value="">Bulk action</option>
                  <option value="pin">Pin</option>
                  <option value="unpin">Unpin</option>
                  <option value="lock">Lock</option>
                  <option value="unlock">Unlock</option>
                  <option value="delete">Soft delete</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !bulkAction ||
                    selectedTopics.size === 0 ||
                    isBulkProcessing
                  }
                  onClick={handleBulkAction}
                >
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="gap-2"
                >
                  Bulk move
                  <Badge variant="warning" className="uppercase text-[10px]">
                    Future hook
                  </Badge>
                </Button>
              </div>
            </div>

            {topicsQuery.isLoading ? (
              <TableSkeleton />
            ) : topics.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No topics yet"
                description="Create the first conversation for this category."
                action={{
                  label: "Create topic",
                  onClick: () => {
                    setTopicToEdit(null);
                    setTopicModalOpen(true);
                  },
                }}
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={allSelected}
                          onChange={(event) =>
                            handleSelectAll(event.target.checked)
                          }
                        />
                      </TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Last activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTopics.has(topic.id)}
                            onChange={(event) =>
                              toggleTopicSelection(topic.id, event.target.checked)
                            }
                          />
                        </TableCell>
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
                            <span className="text-xs text-muted-foreground">
                              {topic.author_name || "System"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {topic.is_pinned && (
                              <Badge variant="warning">Pinned</Badge>
                            )}
                            {topic.is_locked && (
                              <Badge variant="secondary">Locked</Badge>
                            )}
                            {topic.is_deleted && (
                              <Badge variant="danger">Deleted</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{topic.posts_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {topic.last_post_at
                            ? formatDistanceToNow(new Date(topic.last_post_at), {
                                addSuffix: true,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <ActionMenu
                            size="sm"
                            options={[
                              {
                                label: "Edit",
                                onClick: () => {
                                  setTopicToEdit(topic);
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  total={totalTopics}
                  pageSize={10}
                  resourceLabel="topics"
                  onChange={(nextPage) => {
                    setSelectedTopics(new Set());
                    setPage(nextPage);
                  }}
                  isFetching={topicsQuery.isFetching}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        mode="edit"
        houses={houses}
        defaultHouseId={category?.house_id}
        initialValues={
          category
            ? {
                houseId: category.house_id || "",
                name: category.name,
                description: category.description ?? "",
                isDefault: category.is_default,
                isLocked: Boolean(category.is_locked),
              }
            : undefined
        }
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={(values) =>
          updateCategory.mutate(
            {
              categoryId: normalizedCategoryId!,
              data: {
                name: values.name,
                description: values.description,
                house_id: values.houseId,
                is_default: values.isDefault,
                is_locked: values.isLocked,
              },
            },
            {
              onSuccess: () => setCategoryModalOpen(false),
            }
          )
        }
        isSubmitting={updateCategory.isPending}
      />

      <TopicFormModal
        isOpen={topicModalOpen}
        mode={topicToEdit ? "edit" : "create"}
        houses={houses}
        categories={categoriesForModal}
        defaultHouseId={category?.house_id}
        initialValues={
          topicToEdit
            ? {
                houseId: topicToEdit.house_id || category?.house_id || "",
                categoryId: topicToEdit.category_id,
                title: topicToEdit.title,
                content: topicToEdit.initial_post?.content ?? "",
                isPinned: topicToEdit.is_pinned,
                isLocked: topicToEdit.is_locked,
              }
            : category
            ? {
                houseId: category.house_id || "",
                categoryId: category.id,
                title: "",
                content: "",
                isPinned: false,
                isLocked: false,
              }
            : undefined
        }
        onClose={() => {
          setTopicModalOpen(false);
          setTopicToEdit(null);
        }}
        onSubmit={(values) => {
          if (topicToEdit) {
            updateTopic.mutate(
              {
                topicId: topicToEdit.id,
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
                  setTopicToEdit(null);
                },
              }
            );
          } else {
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
          }
        }}
        isSubmitting={updateTopic.isPending || createTopic.isPending}
      />

      <ConfirmActionModal
        isOpen={categoryToDelete}
        title="Delete category"
        description="Deleting this category will not remove existing topics, but they will move to uncategorized."
        confirmLabel="Delete category"
        tone="destructive"
        onConfirm={() =>
          normalizedCategoryId &&
          deleteCategory.mutate(normalizedCategoryId, {
            onSuccess: () => {
              setCategoryToDelete(false);
              router.push("/admin/forums");
            },
          })
        }
        onCancel={() => setCategoryToDelete(false)}
        isLoading={deleteCategory.isPending}
      />

      <ConfirmActionModal
        isOpen={Boolean(topicToDelete)}
        title="Hard delete topic"
        description="This permanently removes the topic and its posts."
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
