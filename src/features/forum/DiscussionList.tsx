"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Flag,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ForumStatus } from "./ForumStatus";
import { field, surface, age, ErrorText, Pagination } from "./ForumPrimitives";
import { Reports } from "./Reports";
import type { Shared } from "./types";
export function DiscussionList({
  api,
  context,
  queryKey,
  basePath,
  initialCategory,
  refresh,
}: Shared & { initialCategory?: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory ?? "");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sort, setSort] = useState("latest");
  const [unread, setUnread] = useState(false);
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState(false);
  const [dialog, setDialog] = useState<"topic" | "category" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);
  const topics = useQuery({
    queryKey: [...queryKey, "topics", category, search, sort, unread, page],
    queryFn: () =>
      api.topics({
        page,
        page_size: 20,
        ...(category ? { category_id: category } : {}),
        ...(search ? { search } : {}),
        sort,
        unread,
      }),
    enabled: !reports,
    retry: false,
  });
  const create = useMutation({
    mutationFn: async () =>
      dialog === "category"
        ? api.createCategory({ name: title, description: body })
        : api.createTopic({ title, content: body, category_id: draftCategory }),
    onSuccess: async (result) => {
      const wasTopic = dialog === "topic";
      await refresh();
      setDialog(null);
      setTitle("");
      setBody("");
      if (wasTopic) router.push(`${basePath}/topic/${result.id}`);
      else toast.success("Category created");
    },
  });
  const changeCategory = (id: string) => {
    setCategory(id);
    setPage(1);
    setReports(false);
  };
  const open = (type: "topic" | "category") => {
    create.reset();
    setTitle("");
    setBody("");
    setDraftCategory(category || context.categories[0]?.id || "");
    setDialog(type);
  };
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--vms-ink-muted)]">
            {context.site_name} / Community
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            Community forum
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--vms-ink-muted)]">
            A shared space to ask questions, exchange ideas and keep your Site
            connected.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => open("topic")}
          disabled={!context.categories.length}
        >
          <Plus className="h-4 w-4" />
          Start a discussion
        </Button>
      </header>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className={cn(surface, "p-4")}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
              Conversations
            </h2>
            <button
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm",
                !category &&
                  !reports &&
                  "bg-[var(--vms-surface-subtle)] font-semibold",
              )}
              onClick={() => changeCategory("")}
            >
              <span>All discussions</span>
              <span className="tabular-nums text-[var(--vms-ink-muted)]">
                {context.categories.reduce(
                  (sum, item) => sum + item.topic_count,
                  0,
                )}
              </span>
            </button>
            <div className="hidden lg:block">
              {context.categories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => changeCategory(item.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm hover:bg-[var(--vms-surface-subtle)]",
                    category === item.id &&
                      !reports &&
                      "font-semibold text-[var(--vms-accent)]",
                  )}
                >
                  <span className="break-words">{item.name}</span>
                  <span className="tabular-nums text-[var(--vms-ink-muted)]">
                    {item.topic_count}
                  </span>
                </button>
              ))}
            </div>
            <label className="mt-2 block lg:hidden">
              <span className="sr-only">Category</span>
              <select
                aria-label="Category"
                className={field}
                value={category}
                onChange={(e) => changeCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {context.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {context.can_manage_categories && (
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start gap-2"
                onClick={() => open("category")}
              >
                <Plus className="h-4 w-4" />
                New category
              </Button>
            )}
            {context.can_review_reports && (
              <Button
                variant={reports ? "outline" : "ghost"}
                className="mt-2 w-full justify-start gap-2"
                onClick={() => {
                  setReports(true);
                  setPage(1);
                }}
              >
                <Flag className="h-4 w-4" />
                Reported posts
              </Button>
            )}
          </section>
          <section className="hidden px-1 text-sm text-[var(--vms-ink-muted)] lg:block">
            <ShieldCheck className="mb-3 h-5 w-5" />
            <h2 className="font-semibold text-[var(--vms-ink)]">
              Make room for everyone
            </h2>
            <p className="mt-2 leading-6">
              Be respectful. Keep personal information private. Report
              contributions that need a moderator’s attention.
            </p>
            <p className="mt-3 text-xs">
              Shared with eligible Parties and administrators in{" "}
              {context.site_name}.
            </p>
          </section>
        </aside>
        {reports ? (
          <Reports
            api={api}
            context={context}
            queryKey={queryKey}
            basePath={basePath}
            refresh={refresh}
          />
        ) : (
          <section
            className={cn(surface, "min-w-0 overflow-hidden")}
            aria-label="Discussions"
          >
            <div className="flex flex-wrap gap-3 border-b border-[var(--vms-line)] p-4">
              <label className="relative min-w-0 flex-1 basis-48">
                <span className="sr-only">Search discussions</span>
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--vms-ink-muted)]" />
                <input
                  className={cn(field, "pl-9")}
                  placeholder="Search discussions…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </label>
              <select
                aria-label="Sort discussions"
                className={cn(field, "w-auto")}
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="latest">Latest activity</option>
                <option value="newest">Newest discussions</option>
                <option value="active">Most replies</option>
              </select>
              <Button
                variant={unread ? "primary" : "outline"}
                aria-pressed={unread}
                onClick={() => {
                  setUnread(!unread);
                  setPage(1);
                }}
              >
                Unread
              </Button>
            </div>
            {category && (
              <div className="border-b border-[var(--vms-line)] px-5 py-3 text-sm">
                <h2 className="font-semibold">
                  {context.categories.find((c) => c.id === category)?.name}
                </h2>
                <p className="mt-1 text-[var(--vms-ink-muted)]">
                  {
                    context.categories.find((c) => c.id === category)
                      ?.description
                  }
                </p>
              </div>
            )}
            {topics.isPending ? (
              <div className="p-5">
                <ForumStatus loading />
              </div>
            ) : topics.isError ? (
              <div className="p-5">
                <ForumStatus
                  error={topics.error}
                  retry={() => topics.refetch()}
                />
              </div>
            ) : !topics.data?.items.length ? (
              <div className="px-5 py-16 text-center">
                <MessageSquare className="mx-auto mb-4 h-8 w-8 text-[var(--vms-ink-muted)]" />
                <h2 className="text-lg font-semibold">
                  {!context.categories.length
                    ? "Your community starts here"
                    : search || unread || category
                      ? "No discussions match this view"
                      : "Be the first to start a conversation"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--vms-ink-muted)]">
                  {!context.categories.length
                    ? context.can_manage_categories
                      ? "Create a category, then invite your community into the conversation."
                      : "A Site moderator needs to create the first category."
                    : "Ask a question, share an idea or start something useful together."}
                </p>
                {context.categories.length > 0 && (
                  <Button className="mt-5" onClick={() => open("topic")}>
                    Start a discussion
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-[var(--vms-line)]">
                {topics.data.items.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      className="group flex min-w-0 gap-3 px-4 py-5 transition-colors hover:bg-[var(--vms-surface-subtle)] sm:px-5"
                      href={`${basePath}/topic/${topic.id}`}
                    >
                      <span
                        className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--vms-surface-subtle)] text-sm font-semibold sm:flex"
                        aria-hidden="true"
                      >
                        {topic.author_name?.charAt(0) || "M"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-[var(--vms-ink-muted)]">
                            {topic.category_name}
                          </span>
                          {topic.is_pinned && (
                            <Badge variant="neutral">
                              <Pin className="mr-1 h-3 w-3" />
                              Pinned
                            </Badge>
                          )}
                          {topic.is_locked && (
                            <Badge variant="neutral">
                              <Lock className="mr-1 h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                          {topic.is_unread && (
                            <span className="text-xs font-medium text-[var(--vms-accent)]">
                              Unread
                            </span>
                          )}
                        </div>
                        <h2 className="break-words text-base font-semibold group-hover:underline">
                          {topic.title}
                        </h2>
                        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
                          <span>{topic.author_name || "Community member"}</span>
                          <span>·</span>
                          <time dateTime={topic.last_post_at}>
                            {age(topic.last_post_at)}
                          </time>
                          <span className="sm:hidden">
                            · {Math.max(0, topic.posts_count - 1)} replies
                          </span>
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-2 self-center text-sm text-[var(--vms-ink-muted)] sm:flex">
                        <MessageSquare className="h-4 w-4" />
                        <span className="tabular-nums">
                          {Math.max(0, topic.posts_count - 1)}
                        </span>
                        <span className="sr-only">replies</span>
                        <ArrowUpRight className="ml-4 h-4 w-4" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {topics.data && (
              <Pagination
                page={page}
                total={topics.data.total}
                onChange={setPage}
              />
            )}
          </section>
        )}
      </div>
      <Modal
        isOpen={!!dialog}
        onClose={() => {
          if (!create.isPending) setDialog(null);
        }}
        title={dialog === "category" ? "New category" : "Start a discussion"}
        description={`Shared with the community in ${context.site_name}.`}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {dialog === "topic" && (
            <label className="block space-y-2 text-sm font-medium">
              Category
              <select
                required
                className={field}
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
              >
                {context.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-2 text-sm font-medium">
            {dialog === "category" ? "Category name" : "Discussion title"}
            <Input
              required
              minLength={dialog === "category" ? 2 : 3}
              maxLength={dialog === "category" ? 100 : 256}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            {dialog === "category" ? "Description (optional)" : "Your message"}
            <textarea
              className={field}
              rows={dialog === "category" ? 3 : 7}
              required={dialog === "topic"}
              maxLength={dialog === "category" ? 256 : 20000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <ErrorText error={create.error} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={() => setDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                create.isPending ||
                !title.trim() ||
                (dialog === "topic" && (!body.trim() || !draftCategory))
              }
            >
              {create.isPending
                ? "Saving…"
                : dialog === "category"
                  ? "Create category"
                  : "Publish discussion"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
