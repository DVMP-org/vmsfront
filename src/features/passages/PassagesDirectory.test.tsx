import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkpointsApi } from "@/features/checkpoints/api";
import { placesApi } from "@/features/places/api";
import { PassagesDirectory } from "./PassagesDirectory";

const mocks = vi.hoisted(() => ({
  gates: vi.fn(),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedSite: { id: "site-1", name: "Harbour Campus" },
    }),
}));
vi.mock("@/hooks/use-admin", () => ({
  useAdminGates: () => ({
    data: {
      items: [{ id: "gate-1", name: "Main entrance", place_id: "site-1" }],
    },
  }),
}));
vi.mock("@/features/places/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/places/api")
  >("@/features/places/api");
  return { ...actual, placesApi: { list: vi.fn() } };
});
vi.mock("@/features/checkpoints/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/checkpoints/api")
  >("@/features/checkpoints/api");
  return {
    ...actual,
    checkpointsApi: {
      accessEvents: vi.fn(),
      presence: vi.fn(),
    },
  };
});

const event = {
  id: "event-1",
  subject_type: "party" as const,
  person_name: "Ada Okafor",
  place_id: "site-1",
  place_name: "Harbour Campus",
  gate_id: "gate-1",
  gate_name: "Main entrance",
  direction: "entry" as const,
  outcome: "allowed",
  reason_code: "authorization_valid",
  state_before: "not_checked_in",
  state_after: "checked_in",
  credential_type: "permanent_code",
  credential_reference: "permanent_code",
  occurred_at: "2026-11-09T08:00:00Z",
};

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      <PassagesDirectory />
    </QueryClientProvider>,
  );
}

describe("PassagesDirectory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(placesApi.list).mockResolvedValue({
      items: [],
      page: 1,
      total: 0,
      total_pages: 0,
    });
    vi.mocked(checkpointsApi.accessEvents).mockResolvedValue({
      items: [event],
      page: 1,
      page_size: 20,
      total: 1,
      total_pages: 1,
    });
    vi.mocked(checkpointsApi.presence).mockResolvedValue({
      items: [],
      total: 2,
    });
  });

  it("renders unified identity, movement, state and current presence", async () => {
    mount();

    expect((await screen.findAllByText("Ada Okafor")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Currently on site")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("checked in")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Movement logs" }),
    ).toBeVisible();
  });

  it("expands only the clicked movement row, not every scan in the group", async () => {
    vi.mocked(checkpointsApi.accessEvents).mockResolvedValue({
      items: [
        {
          ...event,
          id: "event-1",
          visit_authorization_id: "invite-1",
          visit_guest_id: "guest-1",
          person_name: "Ada Okafor",
          occurred_at: "2026-11-09T08:00:00Z",
        },
        {
          ...event,
          id: "event-2",
          visit_authorization_id: "invite-1",
          visit_guest_id: "guest-1",
          person_name: "Ada Okafor",
          gate_name: "Gate 2",
          occurred_at: "2026-11-09T09:00:00Z",
        },
      ],
      page: 1,
      page_size: 20,
      total: 2,
      total_pages: 1,
    });
    mount();

    const expanders = await screen.findAllByRole("button", {
      name: /Expand movement progress/i,
    });
    fireEvent.click(expanders[0]);

    expect(screen.getAllByText(/Movement progress/)).toHaveLength(1);
  });

  it("opens event details and sends collection search to the server", async () => {
    mount();
    fireEvent.click(await screen.findByText("Ada Okafor"));
    expect(
      await screen.findByRole("complementary", { name: "Movement details" }),
    ).toBeVisible();
    expect(screen.getByText("Checkpoint progression")).toBeVisible();
    fireEvent.change(
      await screen.findByPlaceholderText(
        "Search by name, credential or checkpoint...",
      ),
      { target: { value: "Ada" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() =>
      expect(checkpointsApi.accessEvents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "Ada",
          page: 1,
          page_size: 20,
        }),
      ),
    );
  });
});
