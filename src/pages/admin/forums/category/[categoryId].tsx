import { useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    CheckSquare,
    Lock,
    MessageSquare,
    Pencil,
    Pin,
    Plus,
    Shield,
    Trash,
    Unlock,
} from "lucide-react";
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
import { ActionMenu } from "@/components/modules/admin/forums/ActionMenu";
import {
    CategoryFormModal,
    TopicFormModal,
    ConfirmActionModal,
} from "@/components/modules/admin/forums/ForumModals";
import type { ForumTopic } from "@/types";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function AdminForumCategoryDetailPage() {
    const router = useRouter();
    const { categoryId } = router.query;
    const normalizedCategoryId = useMemo(() => {
        if (!categoryId) return "";
        return Array.isArray(categoryId) ? categoryId[0] : categoryId;
    }, [categoryId]);

    const { data: housesData } = useAdminHouses({
        page: 1,
        pageSize: 100,
    });
    const houses = housesData?.items ?? [];

    const categoryQuery = useAdminForumCategory(normalizedCategoryId ?? "");
    const categoriesQuery = useAdminForumCategories({
        page: 1,
        pageSize: 100,
        filters: formatFiltersForAPI([{
            field: "house_id", operator: "eq" as const, value: (categoryQuery.data?.house_id as any)
        }]),
    });
    const [page, setPage] = useState(1);
    const category = categoryQuery.data;
    const categoryTopicsFilters = useMemo(
        () => ({
            page,
            pageSize: 10,
            filters: formatFiltersForAPI([
                { field: "category_id", operator: "eq" as const, value: normalizedCategoryId },
                { field: "house_id", operator: "eq" as const, value: (categoryQuery.data?.house_id as any) }
            ]),
        }),
        [page, normalizedCategoryId, categoryQuery.data?.house_id]
    );
    const topicsQuery = useAdminForumTopics(categoryTopicsFilters, {
        enabled: Boolean(normalizedCategoryId) && Boolean(categoryQuery.data?.house_id),
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
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState("");
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const toggleTopicSelection = (topicId: string, checked: boolean) => {
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            if (checked) next.add(topicId);
            else next.delete(topicId);
            return next;
        });
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedTopics.size === 0) return;
        const payloads: Record<string, any> = {
            pin: { is_pinned: true }, unpin: { is_pinned: false },
            lock: { is_locked: true }, unlock: { is_locked: false },
            delete: { is_deleted: true },
        };
        const data = payloads[bulkAction];
        if (!data) return;
        setIsBulkProcessing(true);
        try {
            await Promise.all(
                Array.from(selectedTopics).map((topicId) => updateTopic.mutateAsync({ topicId, data }))
            );
            setSelectedTopics(new Set());
            setBulkAction("");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    if (!router.isReady) return null;

    return (
        <>
            <div className="space-y-6">
                <nav className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <button type="button" onClick={() => router.push("/admin")} className="hover:text-foreground">Admin</button> /{" "}
                    <button type="button" onClick={() => router.push("/admin/forums")} className="hover:text-foreground">Forums</button> /{" "}
                    <span className="text-foreground">{category?.name ?? "Category"}</span>
                </nav>
                <Card className="rounded-3xl border border-dashed">
                    <CardHeader className="flex flex-wrap items-start gap-4">
                        <div className="space-y-2">
                            <button type="button" onClick={() => router.push("/admin/forums")} className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</button>
                            <div className="flex items-center gap-2"><CardTitle>{category?.name ?? "Loading..."}</CardTitle>{category?.is_default && <Badge variant="success">Default</Badge>}{category?.is_locked && <Badge variant="warning">Locked</Badge>}</div>
                            <CardDescription>{category?.description || "No description."}</CardDescription>
                            {category?.house_id && <p className="text-xs text-muted-foreground">House: {houses?.find((h) => h.id === category.house_id)?.name || category.house_id}</p>}
                        </div>
                        <div className="ml-auto flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => { setTopicToEdit(null); setTopicModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />New topic</Button>
                            <Button variant="outline" onClick={() => setCategoryModalOpen(true)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                            <Button onClick={() => updateCategory.mutate({ categoryId: normalizedCategoryId!, data: { is_locked: !category?.is_locked } })}><Lock className="mr-2 h-4 w-4" />{category?.is_locked ? "Unlock" : "Lock"}</Button>
                            <Button variant="destructive" onClick={() => setCategoryToDelete(true)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topicsQuery.isLoading ? <TableSkeleton /> : topics.length === 0 ? <EmptyState icon={MessageSquare} title="No topics" description="Create the first one." action={{ label: "Create", onClick: () => { setTopicToEdit(null); setTopicModalOpen(true); } }} /> :
                            <>
                                <Table>
                                    <TableHeader><TableRow><TableHead><Checkbox checked={topics.length > 0 && selectedTopics.size === topics.length} onChange={(e) => handleSelectAll(e.target.checked, topics, setSelectedTopics)} /></TableHead><TableHead>Topic</TableHead><TableHead>Status</TableHead><TableHead>Posts</TableHead><TableHead>Last activity</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {topics.map((topic) => (
                                            <TableRow key={topic.id}>
                                                <TableCell><Checkbox checked={selectedTopics.has(topic.id)} onChange={(e) => toggleTopicSelection(topic.id, e.target.checked)} /></TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <button type="button" onClick={() => router.push(`/admin/forums/topic/${topic.id}`)} className="text-left text-sm font-semibold hover:text-primary">{topic.title}</button>
                                                        <span className="text-xs text-muted-foreground">{topic.author_name || "System"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell><TopicStatusChips topic={topic} /></TableCell>
                                                <TableCell>{topic.posts_count}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{topic.last_post_at ? formatDistanceToNow(new Date(topic.last_post_at), { addSuffix: true }) : "—"}</TableCell>
                                                <TableCell>
                                                    <ActionMenu size="sm" options={[
                                                        { label: "Edit", onClick: () => { setTopicToEdit(topic); setTopicModalOpen(true); } },
                                                        { label: topic.is_pinned ? "Unpin" : "Pin", icon: Pin, onClick: () => updateTopic.mutate({ topicId: topic.id, data: { is_pinned: !topic.is_pinned } }) },
                                                        { label: topic.is_locked ? "Unlock" : "Lock", icon: topic.is_locked ? Unlock : Lock, onClick: () => updateTopic.mutate({ topicId: topic.id, data: { is_locked: !topic.is_locked } }) },
                                                        { label: topic.is_deleted ? "Restore" : "Delete", icon: Shield, onClick: () => updateTopic.mutate({ topicId: topic.id, data: { is_deleted: !topic.is_deleted } }) },
                                                        { label: "Hard delete", tone: "destructive", onClick: () => setTopicToDelete(topic) }
                                                    ]} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <PaginationBar page={page} totalPages={totalPages} total={totalTopics} pageSize={10} resourceLabel="topics" onChange={setPage} isFetching={topicsQuery.isFetching} />
                            </>
                        }
                    </CardContent>
                </Card>
            </div>

            <CategoryFormModal isOpen={categoryModalOpen} mode="edit" houses={houses} defaultHouseId={category?.house_id || ""} initialValues={category ? { houseId: category.house_id || "", name: category.name, description: category.description ?? "", isDefault: category.is_default, isLocked: Boolean(category.is_locked) } : undefined} onClose={() => setCategoryModalOpen(false)} onSubmit={(v) => updateCategory.mutate({ categoryId: normalizedCategoryId!, data: { name: v.name, description: v.description, house_id: v.houseId, is_default: v.isDefault, is_locked: v.isLocked } }, { onSuccess: () => setCategoryModalOpen(false) })} isSubmitting={updateCategory.isPending} />
            <TopicFormModal isOpen={topicModalOpen} mode={topicToEdit ? "edit" : "create"} houses={houses} categories={category ? [category] : []} defaultHouseId={category?.house_id || ""} initialValues={topicToEdit ? { houseId: topicToEdit.house_id || category?.house_id || "", categoryId: topicToEdit.category_id, title: topicToEdit.title, content: topicToEdit.initial_post?.content ?? "", isPinned: topicToEdit.is_pinned, isLocked: topicToEdit.is_locked } : category ? { houseId: category.house_id || "", categoryId: category.id, title: "", content: "", isPinned: false, isLocked: false } : undefined} onClose={() => { setTopicModalOpen(false); setTopicToEdit(null); }} onSubmit={(v) => { if (topicToEdit) updateTopic.mutate({ topicId: topicToEdit.id, data: { title: v.title, category_id: v.categoryId, house_id: v.houseId, is_pinned: v.isPinned, is_locked: v.isLocked } }, { onSuccess: () => { setTopicModalOpen(false); setTopicToEdit(null); } }); else createTopic.mutate({ house_id: v.houseId, category_id: v.categoryId, title: v.title, content: v.content }, { onSuccess: (r) => { setTopicModalOpen(false); if (r.data.id) router.push(`/admin/forums/topic/${r.data.id}`); } }); }} isSubmitting={updateTopic.isPending || createTopic.isPending} />
            <ConfirmActionModal isOpen={categoryToDelete} title="Delete category" description="Topics will move to uncategorized." confirmLabel="Delete" tone="destructive" onConfirm={() => normalizedCategoryId && deleteCategory.mutate(normalizedCategoryId, { onSuccess: () => router.push("/admin/forums") })} onCancel={() => setCategoryToDelete(false)} isLoading={deleteCategory.isPending} />
            <ConfirmActionModal isOpen={Boolean(topicToDelete)} title="Delete topic" description="Permanently removes topic." confirmLabel="Delete" tone="destructive" onConfirm={() => topicToDelete && deleteTopic.mutate(topicToDelete.id, { onSuccess: () => setTopicToDelete(null) })} onCancel={() => setTopicToDelete(null)} isLoading={deleteTopic.isPending} />
        </>
    );
}

function handleSelectAll(checked: boolean, topics: ForumTopic[], setSelectedTopics: (fn: (prev: Set<string>) => Set<string>) => void) {
    if (checked) setSelectedTopics(() => new Set(topics.map(t => t.id)));
    else setSelectedTopics(() => new Set());
}

function TopicStatusChips({ topic }: { topic: ForumTopic }) {
    return <div className="flex flex-wrap gap-1">{topic.is_pinned && <Badge variant="warning">Pinned</Badge>}{topic.is_locked && <Badge variant="secondary">Locked</Badge>}{topic.is_deleted && <Badge variant="danger">Deleted</Badge>}</div>;
}

AdminForumCategoryDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
