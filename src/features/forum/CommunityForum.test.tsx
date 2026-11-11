import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommunityForum } from "./CommunityForum";
import type { ForumContext, Topic } from "./api";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  topics: vi.fn(),
  thread: vi.fn(),
  createTopic: vi.fn(),
  createCategory: vi.fn(),
  read: vi.fn(),
  reply: vi.fn(),
  report: vi.fn(),
  push: vi.fn(),
  search: "",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({ organization: { id: "org" } }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: "member" } }),
}));
vi.mock("./api", () => ({ forumApi: () => mocks }));
const context: ForumContext = {
  site_id: "site",
  site_name: "Harbour Court",
  user_id: "member",
  is_admin: false,
  can_manage_categories: false,
  can_moderate_topics: false,
  can_delete_topics: false,
  can_moderate_posts: false,
  can_review_reports: false,
  categories: [
    {
      id: "category",
      name: "General",
      description: "Community conversations",
      topic_count: 1,
    },
  ],
};
const topic: Topic = {
  id: "topic",
  title: "A greener courtyard",
  category_id: "category",
  category_name: "General",
  author_id: "other",
  author_name: "Ada",
  is_pinned: true,
  is_locked: false,
  is_unread: true,
  posts_count: 2,
  created_at: "2026-11-10T12:00:00Z",
  last_post_at: "2026-11-11T12:00:00Z",
};
const post = {
  id: "post",
  author_id: "other",
  author_name: "Ada",
  content: "What should we plant?",
  is_deleted: false,
  posted_by_admin: false,
  created_at: topic.created_at,
  edited_at: null,
};
function show(topicId?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CommunityForum
        scope={{ type: "place", id: "place" }}
        basePath="/workspace/place/forums"
        topicId={topicId}
      />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = "";
  mocks.context.mockResolvedValue(context);
  mocks.topics.mockResolvedValue({
    items: [topic],
    total: 1,
    page: 1,
    page_size: 20,
  });
  mocks.thread.mockResolvedValue({
    topic,
    items: [post],
    total: 1,
    page: 1,
    page_size: 20,
  });
  mocks.read.mockResolvedValue({});
  mocks.reply.mockResolvedValue({ id: "reply" });
  mocks.createTopic.mockResolvedValue({ id: "new-topic" });
  mocks.report.mockResolvedValue({ id: "report" });
});
describe("shared Site community forum", () => {
  it("shows forum conversations and Site context without management controls for Parties", async () => {
    show();
    expect(
      await screen.findByRole("heading", { name: "Community forum" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "A greener courtyard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /A greener courtyard/ }),
    ).toHaveAttribute("href", "/workspace/place/forums/topic/topic");
    expect(
      screen.queryByRole("button", { name: "New category" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reported posts" }),
    ).not.toBeInTheDocument();
  });
  it("publishes a discussion with its category and routes to its detail page", async () => {
    show();
    fireEvent.click(
      await screen.findByRole("button", { name: "Start a discussion" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Discussion title"), {
      target: { value: "Garden plans" },
    });
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Let's plant trees." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Publish discussion" }),
    );
    await waitFor(() =>
      expect(mocks.createTopic).toHaveBeenCalledWith({
        title: "Garden plans",
        content: "Let's plant trees.",
        category_id: "category",
      }),
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/workspace/place/forums/topic/new-topic",
      ),
    );
  });
  it("makes unread filtering server-owned", async () => {
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Unread" }));
    await waitFor(() =>
      expect(mocks.topics).toHaveBeenLastCalledWith(
        expect.objectContaining({ unread: true, page: 1 }),
      ),
    );
  });
  it("shows explicit load errors with retry", async () => {
    mocks.topics.mockRejectedValue(new Error("Network unavailable"));
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Forum could not be loaded",
    );
    mocks.topics.mockResolvedValue({ items: [], total: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("Be the first to start a conversation"),
    ).toBeInTheDocument();
  });
  it("explains the missing first category and disables topic creation", async () => {
    mocks.context.mockResolvedValue({ ...context, categories: [] });
    mocks.topics.mockResolvedValue({ items: [], total: 0 });
    show();
    expect(
      await screen.findByText("Your community starts here"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start a discussion" }),
    ).toBeDisabled();
  });
  it("prevents reply composition in a locked discussion", async () => {
    mocks.thread.mockResolvedValue({
      topic: { ...topic, is_locked: true },
      items: [post],
      total: 1,
    });
    show("topic");
    expect(
      await screen.findByText("This discussion is locked"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post reply" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unlock discussion" }),
    ).not.toBeInTheDocument();
  });
  it("allows Party replies and saves only displayed read progress", async () => {
    show("topic");
    const input = await screen.findByRole("textbox", {
      name: "Join the conversation",
    });
    fireEvent.change(input, { target: { value: "How about mango trees?" } });
    fireEvent.click(screen.getByRole("button", { name: "Post reply" }));
    await waitFor(() =>
      expect(mocks.reply).toHaveBeenCalledWith(
        "topic",
        "How about mango trees?",
      ),
    );
    expect(mocks.read).toHaveBeenCalledWith("topic", "post");
  });
  it("reports another participant's contribution without exposing their edit controls", async () => {
    show("topic");
    fireEvent.click(await screen.findByRole("button", { name: "Report" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "Please review this contribution" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Send report" }),
    );
    await waitFor(() =>
      expect(mocks.report).toHaveBeenCalledWith(
        "topic",
        "post",
        "Please review this contribution",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });
});

it("opens reported contributions on their requested page", async () => {
  mocks.search = "page=2";
  show("topic");
  await screen.findByRole("heading", { name: "A greener courtyard" });
  expect(mocks.thread).toHaveBeenCalledWith("topic", 2);
});
