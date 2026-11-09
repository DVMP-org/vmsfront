import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkpointsApi } from "@/features/checkpoints/api";
import { propertiesApi } from "@/features/properties/api";
import { PassagesDirectory } from "./PassagesDirectory";

const mocks = vi.hoisted(() => ({
  gates: vi.fn(),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedProperty: { id: "site-1", name: "Harbour Campus" },
    }),
}));
vi.mock("@/hooks/use-admin", () => ({
  useAdminGates: () => ({
    data: {
      items: [{ id: "gate-1", name: "Main entrance", place_id: "site-1" }],
    },
  }),
}));
vi.mock("@/features/properties/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/properties/api")
  >("@/features/properties/api");
  return { ...actual, propertiesApi: { list: vi.fn() } };
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
    vi.mocked(propertiesApi.list).mockResolvedValue({
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
      1,
    );
    expect(screen.getByText("Current presence")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("not checked in to checked in")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Passage history" }),
    ).toBeVisible();
  });

  it("sends collection search and property scope to the server", async () => {
    mount();
    fireEvent.change(
      await screen.findByPlaceholderText(
        "Search person, credential, checkpoint, property or reason",
      ),
      { target: { value: "Ada" } },
    );

    await waitFor(() =>
      expect(checkpointsApi.accessEvents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "Ada",
          place_id: "site-1",
          page: 1,
          page_size: 20,
        }),
      ),
    );
  });
});
