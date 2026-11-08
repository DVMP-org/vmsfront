import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceNotifications } from "./WorkspaceNotifications";
import { useMarkAsRead, useNotifications } from "@/hooks/use-notifications";

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: vi.fn(),
  useMarkAsRead: vi.fn(),
}));

const markAsRead = vi.fn();

function notification(id: string, title: string, is_read = false) {
  return {
    id,
    event: "visit.authorization.approved",
    recipient: "party",
    payload: {
      title,
      message: `${title} message`,
      intent: "info",
    },
    is_read,
    read_at: is_read ? "2026-11-08T10:00:00Z" : null,
    created_at: "2026-11-08T09:00:00Z",
    updated_at: "2026-11-08T09:00:00Z",
  };
}

describe("WorkspaceNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMarkAsRead).mockReturnValue({
      mutate: markAsRead,
      isPending: false,
    } as unknown as ReturnType<typeof useMarkAsRead>);
  });

  it("shows recent account activity and marks an update as read", () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: {
        items: [
          notification("one", "Visitor approved"),
          notification("two", "Charge paid", true),
        ],
        total: 2,
        page: 1,
        page_size: 5,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useNotifications>);

    render(<WorkspaceNotifications userId="user" />);

    expect(screen.getByText("Visitor approved")).toBeInTheDocument();
    expect(screen.getByText("1 unread")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark Visitor approved as read",
      }),
    );
    expect(markAsRead).toHaveBeenCalledWith(["one"]);
  });

  it("shows a retryable failure state", () => {
    const refetch = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Activity service unavailable"),
      refetch,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<WorkspaceNotifications userId="user" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Account activity could not be loaded",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows an explicit empty state", () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        page_size: 5,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useNotifications>);

    render(<WorkspaceNotifications userId="user" />);

    expect(screen.getByText("No account activity yet")).toBeInTheDocument();
  });
});
