import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacePage from "./page";
import { accessJourneyApi } from "@/features/access-journey/api";
import { contextApi } from "@/features/context/api";
import { guestStayApi } from "@/features/guest-stay/api";
import { useVerifyToken } from "@/hooks/use-auth";

vi.mock("next/navigation", () => ({
  useParams: () => ({ placeId: "room-402" }),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <header>Workspace header</header>,
}));

vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: vi.fn(),
}));

vi.mock("@/features/context/api", () => ({
  contextApi: {
    workspace: vi.fn(),
  },
}));

vi.mock("@/features/guest-stay/api", () => ({
  guestStayApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("@/features/access-journey/api", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/access-journey/api")>(
      "@/features/access-journey/api",
    );
  return {
    ...actual,
    accessJourneyApi: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      cancel: vi.fn(),
      checkpointEvents: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const relationship = {
  id: "guest-relationship",
  organization_id: "organization",
  role: "guest",
  status: "active" as const,
  effective_from: null,
  effective_to: null,
  created_at: "2026-11-07T10:00:00Z",
  updated_at: "2026-11-07T10:00:00Z",
  party: {
    id: "guest-party",
    kind: "person",
    display_name: "Ada Guest",
    email: "ada@example.test",
    is_active: true,
  },
  place: {
    id: "room-402",
    name: "Suite 402",
    slug: "suite-402",
    kind: "room",
    is_active: true,
  },
};

const stay = {
  id: "stay",
  status: "reserved" as const,
  planned_check_in: "2027-04-05T15:00:00Z",
  planned_check_out: "2027-04-08T11:00:00Z",
  actual_check_in: null,
  actual_check_out: null,
  notes: null,
  guests: [
    {
      id: "guest",
      role: "primary",
      party: {
        id: "guest-party",
        display_name: "Ada Guest",
      },
    },
  ],
  room_assignments: [
    {
      id: "assignment",
      assigned_from: "2027-04-05T15:00:00Z",
      assigned_to: "2027-04-08T11:00:00Z",
      room: {
        id: "room-402",
        name: "Suite 402",
        kind: "room",
      },
    },
  ],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <WorkspacePage />
    </QueryClientProvider>,
  );
}

describe("hotel guest workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useVerifyToken).mockReturnValue({
      data: {
        user: {
          id: "guest-user",
          name: "Ada Guest",
          email: "ada@example.test",
        },
        party: relationship.party,
        workspaces: [relationship],
      },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useVerifyToken>);
    vi.mocked(contextApi.workspace).mockResolvedValue({
      management: {
        mode: "none",
        management_required: false,
        is_administrator: false,
        authoritative_place: null,
        administrators: [],
      },
    });
    vi.mocked(guestStayApi.list).mockResolvedValue({
      items: [stay],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
    vi.mocked(accessJourneyApi.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      total_pages: 0,
    });
  });

  it("combines stay details and personal invitations without management controls", async () => {
    renderPage();

    expect(await screen.findByText("Arrival scheduled")).toBeInTheDocument();
    expect(screen.getAllByText("Suite 402").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /create invitation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /assign room/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /check in guest/i }),
    ).not.toBeInTheDocument();
  });
});
