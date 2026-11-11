"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flag, Lock, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ForumStatus } from "./ForumStatus";
import { field, surface, age, ErrorText, Pagination } from "./ForumPrimitives";
import type { Post } from "./api";
import type { Shared } from "./types";
export function Discussion({
  api,
  context,
  queryKey,
  basePath,
  topicId,
  refresh,
}: Shared & { topicId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [page, setPage] = useState(() => {
    const value = Number(search.get("page"));
    return Number.isSafeInteger(value) && value > 0 ? value : 1;
  });
  const [reply, setReply] = useState("");
  const [action, setAction] = useState<
    | { type: "edit" | "report" | "remove"; post: Post }
    | { type: "edit-topic" | "remove-topic" }
    | null
  >(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const query = useQuery({
    queryKey: [...queryKey, "thread", topicId, page],
    queryFn: () => api.thread(topicId, page),
    retry: false,
  });
  const lastPost = query.data?.items.at(-1)?.id;
  const [readError, setReadError] = useState(false);
  useEffect(() => {
    if (!lastPost) return;
    let active = true;
    api
      .read(topicId, lastPost)
      .then(() => {
        if (active) setReadError(false);
      })
      .catch(() => {
        if (active) setReadError(true);
      });
    return () => {
      active = false;
    };
    // Mark only the displayed page. Other mutations invalidate the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, lastPost]);
  const send = useMutation({
    mutationFn: () => api.reply(topicId, reply),
    onSuccess: async () => {
      setReply("");
      setPage(Math.ceil(((query.data?.total ?? 0) + 1) / 20));
      await refresh();
      toast.success("Reply published");
    },
  });
  const moderate = useMutation({
    mutationFn: (body: { is_pinned?: boolean; is_locked?: boolean }) =>
      api.moderate(topicId, body),
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: async () => {
      if (!action) throw new Error("Select an action");
      if (action.type === "edit-topic")
        return api.editTopic(topicId, { title, category_id: category });
      if (action.type === "remove-topic") return api.deleteTopic(topicId);
      if (action.type === "edit")
        return api.editPost(topicId, action.post.id, text);
      if (action.type === "report")
        return api.report(topicId, action.post.id, text);
      if ("post" in action) return api.deletePost(topicId, action.post.id);
      throw new Error("Unknown forum action");
    },
    onSuccess: async () => {
      const removingTopic = action?.type === "remove-topic";
      setAction(null);
      await refresh();
      if (removingTopic) router.push(basePath);
      else toast.success("Saved");
    },
  });
  const open = (next: NonNullable<typeof action>) => {
    change.reset();
    setText("post" in next && next.type === "edit" ? next.post.content : "");
    setTitle(query.data?.topic.title ?? "");
    setCategory(query.data?.topic.category_id ?? "");
    setAction(next);
  };
  if (query.isPending) return <ForumStatus loading />;
  if (query.isError)
    return (
      <>
        <Link className="text-sm underline" href={basePath}>
          Back to discussions
        </Link>
        <ForumStatus error={query.error} retry={() => query.refetch()} />
      </>
    );
  const topic = query.data.topic;
  const ownTopic = topic.author_id === context.user_id;
  const deleting = action?.type === "remove" || action?.type === "remove-topic";
  return (
    <>
      <Link
        href={basePath}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All discussions
      </Link>
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{topic.category_name}</Badge>
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
        </div>
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-[28px]">
          {topic.title}
        </h1>
        <p className="text-sm text-[var(--vms-ink-muted)]">
          {context.site_name} · Started by{" "}
          {topic.author_name || "Community member"} ·{" "}
          {Math.max(0, topic.posts_count - 1)} replies
        </p>
        <div className="flex flex-wrap gap-2">
          {!topic.is_locked && (ownTopic || context.can_moderate_topics) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open({ type: "edit-topic" })}
            >
              Edit discussion
            </Button>
          )}
          {context.can_moderate_topics && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={moderate.isPending}
                onClick={() => moderate.mutate({ is_pinned: !topic.is_pinned })}
              >
                <Pin className="h-3.5 w-3.5" />
                {topic.is_pinned ? "Unpin" : "Pin discussion"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={moderate.isPending}
                onClick={() => moderate.mutate({ is_locked: !topic.is_locked })}
              >
                <Lock className="h-3.5 w-3.5" />
                {topic.is_locked ? "Unlock discussion" : "Lock discussion"}
              </Button>
            </>
          )}
          {context.can_delete_topics || (ownTopic && !topic.is_locked) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => open({ type: "remove-topic" })}
            >
              Remove discussion
            </Button>
          ) : null}
        </div>
        <ErrorText error={moderate.error} />
      </header>
      <section
        className={cn(surface, "overflow-hidden")}
        aria-label="Discussion contributions"
      >
        <ol className="divide-y divide-[var(--vms-line)]">
          {query.data.items.map((post, index) => (
            <li key={post.id} id={`post-${post.id}`} className="p-4 sm:p-6">
              <article>
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--vms-surface-subtle)] text-sm font-semibold"
                      aria-hidden="true"
                    >
                      {post.author_name?.charAt(0) || "M"}
                    </span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {post.author_name || "Community member"}
                        {post.posted_by_admin && (
                          <Badge variant="neutral">Site admin</Badge>
                        )}
                        {post.author_id === topic.author_id && (
                          <span className="text-xs font-normal text-[var(--vms-ink-muted)]">
                            Author
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                        <time dateTime={post.created_at}>
                          {age(post.created_at)}
                        </time>
                        {post.edited_at && " · Edited"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-[var(--vms-ink-muted)]">
                    #{(page - 1) * 20 + index + 1}
                  </span>
                </header>
                <p
                  className={cn(
                    "mt-5 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]",
                    post.is_deleted && "italic text-[var(--vms-ink-muted)]",
                  )}
                >
                  {post.content}
                </p>
                {!post.is_deleted && (
                  <footer className="mt-4 flex flex-wrap gap-1">
                    {post.author_id === context.user_id && !topic.is_locked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => open({ type: "edit", post })}
                      >
                        Edit
                      </Button>
                    )}
                    {context.can_moderate_posts ||
                    (post.author_id === context.user_id && !topic.is_locked) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => open({ type: "remove", post })}
                      >
                        Remove
                      </Button>
                    ) : null}
                    {post.author_id !== context.user_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => open({ type: "report", post })}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Report
                      </Button>
                    )}
                  </footer>
                )}
              </article>
            </li>
          ))}
        </ol>
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      </section>
      {readError && (
        <p role="status" className="text-xs text-[var(--vms-ink-muted)]">
          Your reading progress could not be saved. You can still participate.
        </p>
      )}
      {topic.is_locked ? (
        <section className={cn(surface, "flex items-center gap-3 p-5")}>
          <Lock className="h-5 w-5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">This discussion is locked</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              You can read the conversation. Replies are closed by a Site
              moderator.
            </p>
          </div>
        </section>
      ) : (
        <form
          className={cn(surface, "space-y-4 p-4 sm:p-5")}
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <label className="block space-y-3 text-sm font-semibold">
            Join the conversation
            <textarea
              className={field}
              rows={5}
              placeholder="Share your thoughts or ask a question…"
              required
              maxLength={20000}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
          </label>
          <ErrorText error={send.error} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--vms-ink-muted)]">
              Visible to your Site community. Keep it kind and constructive.
            </p>
            <Button type="submit" disabled={send.isPending || !reply.trim()}>
              {send.isPending ? "Publishing…" : "Post reply"}
            </Button>
          </div>
        </form>
      )}
      <Modal
        isOpen={!!action}
        onClose={() => {
          if (!change.isPending) setAction(null);
        }}
        title={
          deleting
            ? "Remove contribution?"
            : action?.type === "report"
              ? "Report contribution"
              : action?.type === "edit-topic"
                ? "Edit discussion"
                : "Edit your contribution"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            change.mutate();
          }}
        >
          {deleting ? (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              {action?.type === "remove-topic"
                ? "This discussion and its replies will no longer appear in the community forum."
                : "The message will be replaced with a removed notice. The rest of the conversation stays available."}
            </p>
          ) : action?.type === "edit-topic" ? (
            <>
              <label className="block space-y-2 text-sm font-medium">
                Title
                <Input
                  required
                  minLength={3}
                  maxLength={256}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Category
                <select
                  className={field}
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {context.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block space-y-2 text-sm font-medium">
              {action?.type === "report"
                ? "What should a moderator review?"
                : "Message"}
              <textarea
                className={field}
                rows={6}
                required
                minLength={action?.type === "report" ? 5 : 1}
                maxLength={action?.type === "report" ? 1000 : 20000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
          )}
          <ErrorText error={change.error} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={change.isPending}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={deleting ? "destructive" : "primary"}
              disabled={change.isPending}
            >
              {change.isPending
                ? "Saving…"
                : deleting
                  ? "Remove"
                  : action?.type === "report"
                    ? "Send report"
                    : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
