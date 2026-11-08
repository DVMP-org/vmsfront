import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import AdminForumsPage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  topicsError: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => "/admin/forums",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminResidencies: () => ({
    data: { items: [{ id: "property-one", name: "Harbour Court" }] },
  }),
  useAdminResidencyGroups: () => ({ data: { items: [] } }),
}));

vi.mock("@/hooks/use-admin-forum", () => {
  const category = {
    id: "category-one",
    name: "Announcements",
    description: "Operational notices",
    residency_id: "property-one",
    residency: { name: "Harbour Court" },
    is_default: true,
    is_locked: false,
    topics_count: 1,
  };
  const topic = {
    id: "topic-one",
    title: "Water maintenance",
    category_id: category.id,
    category,
    residency_id: "property-one",
    residency: { name: "Harbour Court" },
    author_name: "Ada Okafor",
    posts_count: 3,
    last_post_at: "2026-11-08T04:00:00.000Z",
    is_pinned: true,
    is_locked: false,
    is_deleted: false,
  };
  const query = {
    refetch: vi.fn(),
    isLoading: false,
    isFetching: false,
    isError: false,
  };

  return {
    useAdminForumCategories: () => ({
      ...query,
      data: { items: [category] },
    }),
    useAdminForumTopics: () => ({
      ...query,
      isError: mocks.topicsError,
      data: {
        items: mocks.topicsError ? [] : [topic],
        total: 1,
        total_pages: 1,
      },
    }),
    useCreateAdminForumCategory: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useUpdateAdminForumCategory: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useDeleteAdminForumCategory: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useCreateAdminForumTopic: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useUpdateAdminForumTopic: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useDeleteAdminForumTopic: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("./components/ForumModals", () => ({
  CategoryFormModal: () => null,
  TopicFormModal: () => null,
  ConfirmActionModal: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.topicsError = false;
});

it("composes Community around the shared header, metrics and topic routes", () => {
  render(<AdminForumsPage />);

  expect(
    screen.getByRole("heading", { name: "Community" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "New topic" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "New category" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Property scope")).toHaveValue("all");

  fireEvent.click(
    screen.getAllByRole("button", { name: "Water maintenance" })[0],
  );
  expect(mocks.push).toHaveBeenCalledWith("/admin/forums/topic/topic-one");

  fireEvent.click(
    screen.getByRole("button", { name: "Announcements" }),
  );
  expect(mocks.push).toHaveBeenCalledWith(
    "/admin/forums/category/category-one",
  );
});

it("shows a retryable topic error instead of an empty forum", () => {
  mocks.topicsError = true;
  render(<AdminForumsPage />);

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Topics could not be loaded",
  );
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});
