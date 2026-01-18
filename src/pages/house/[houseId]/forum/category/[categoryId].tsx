import { useEffect, useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { useCreateForumTopic, useForumCategory, useForumTopics } from "@/hooks/use-forum";
import type { ForumTopic, ForumCategory } from "@/types";
import { cn } from "@/lib/utils";
import { FolderOpen, Home as HomeIcon, MessageCircle, Plus, Sparkles, MessageSquare, ArrowUpRight, Pin, Lock } from "lucide-react";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

const PAGE_SIZE = 10;

export default function ForumCategoryPage() {
    const router = useRouter();
    const { houseId, categoryId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);
    const cId = useMemo(() => (Array.isArray(categoryId) ? categoryId[0] : categoryId) || "", [categoryId]);

    const { selectedHouse, setSelectedHouse } = useAppStore();
    const { data: profile } = useProfile();
    const effectiveHouseId = hId || selectedHouse?.id || null;

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!hId || !profile?.houses) return;
        if (selectedHouse?.id === hId) return;
        const match = profile.houses.find((h) => h.id === hId);
        if (match) setSelectedHouse(match);
    }, [hId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

    const { data: category, isLoading: isCategoryLoading } = useForumCategory(effectiveHouseId, cId || null);

    const activeFilters = useMemo(() => [{ field: "category_id", value: cId, operator: "eq" }], [cId]);

    const { data: topicsResponse, isLoading: isTopicsLoading } = useForumTopics(effectiveHouseId, {
        page: 1,
        pageSize: 200,
        search: search.trim() || undefined,
        filters: formatFiltersForAPI(activeFilters)
    });

    const filteredTopics = useMemo(() => {
        const items = (topicsResponse?.items || []) as ForumTopic[];
        return items.filter(t => t.category_id === cId);
    }, [topicsResponse?.items, cId]);

    const totalPages = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE));
    const paginatedTopics = useMemo(() => filteredTopics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredTopics, page]);

    const [isTopicModalOpen, setTopicModalOpen] = useState(false);
    const [topicForm, setTopicForm] = useState({ title: "", content: "" });
    const createTopic = useCreateForumTopic();

    if (!router.isReady) return null;

    if (!effectiveHouseId) {
        return <Card><CardContent className="p-10"><EmptyState icon={HomeIcon} title="Select a house" description="Choose a house to view forum categories." action={{ label: "Choose House", onClick: () => router.push("/select") }} /></CardContent></Card>;
    }

    const loading = isCategoryLoading || isTopicsLoading;

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="space-y-3 max-w-2xl">
                        <button onClick={() => router.push(`/house/${effectiveHouseId}/forum`)} className="text-xs text-white/70 hover:text-white uppercase font-bold tracking-tight mb-2 flex items-center gap-1 group"><ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back to categories</button>
                        <Badge variant="outline" className="border-white/30 text-white uppercase text-[10px] tracking-widest px-4"><Sparkles className="h-3 w-3 mr-2" />Category</Badge>
                        <h1 className="text-3xl font-black leading-tight">{category?.name || "Forum Category"}</h1>
                        {category?.description && <p className="text-white/80 text-sm">{category.description}</p>}
                        <div className="flex gap-3 pt-2">
                            <Button className="bg-white text-primary hover:bg-white/90" onClick={() => setTopicModalOpen(true)}><Plus className="mr-2 h-4 w-4" />Start Topic</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatTile label="Topics" value={filteredTopics.length} icon={MessageSquare} />
                        <StatTile label="Pinned" value={filteredTopics.filter(t => t.is_pinned).length} icon={Pin} />
                    </div>
                </div>
            </section>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div><CardTitle className="text-lg">Topics</CardTitle><CardDescription className="text-xs">Conversations in {category?.name || "this category"}</CardDescription></div>
                    <div className="w-64"><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    {loading ? <TableSkeleton /> : paginatedTopics.length === 0 ? <EmptyState icon={MessageCircle} title="No topics" description="Be the first to start a conversation here." /> : (
                        <div className="divide-y border-t">
                            {paginatedTopics.map(topic => (
                                <button key={topic.id} onClick={() => router.push(`/house/${effectiveHouseId}/forum/topic/${topic.id}`)} className="w-full text-left p-4 hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-4 overflow-hidden">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center font-black text-xs text-muted-foreground uppercase">{topic.author?.first_name?.[0]}{topic.author?.last_name?.[0]}</div>
                                            <div className="space-y-1 overflow-hidden">
                                                <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {topic.title}
                                                    {topic.is_pinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                                    {topic.is_locked && <Lock className="h-3 w-3 text-rose-500" />}
                                                </h3>
                                                <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-muted-foreground/60">
                                                    <span>{topic.author?.first_name} {topic.author?.last_name}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <div className="border-t p-4 flex justify-center"><PaginationBar page={page} pageSize={PAGE_SIZE} total={filteredTopics.length} totalPages={totalPages} onChange={setPage} resourceLabel="topics" /></div>
                )}
            </Card>

            <Modal isOpen={isTopicModalOpen} onClose={() => setTopicModalOpen(false)} title={`New Topic in ${category?.name || "Category"}`}>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); createTopic.mutate({ house_id: effectiveHouseId, category_id: cId, title: topicForm.title.trim(), content: topicForm.content.trim() }, { onSuccess: (res) => { setTopicModalOpen(false); router.push(`/house/${effectiveHouseId}/forum/topic/${res.data.id}`); } }); }}>
                    <Input label="Title" value={topicForm.title} onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))} required />
                    <div className="space-y-1"><label className="text-xs font-bold uppercase">Content</label><textarea className="w-full rounded-xl border p-2 text-sm min-h-[160px]" value={topicForm.content} onChange={e => setTopicForm(p => ({ ...p, content: e.target.value }))} required /></div>
                    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setTopicModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={createTopic.isPending} disabled={!topicForm.title.trim()}>Post Topic</Button></div>
                </form>
            </Modal>
        </div>
    );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
    return (
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center min-w-[100px]">
            <Icon className="h-4 w-4 mx-auto mb-2 opacity-60" />
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] uppercase font-bold text-white/60">{label}</p>
        </div>
    );
}

ForumCategoryPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
