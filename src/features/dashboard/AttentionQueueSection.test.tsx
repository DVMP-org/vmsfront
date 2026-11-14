import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AttentionQueueSection } from "./AttentionQueueSection";

const mocks = vi.hoisted(() => ({
  attention: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/hooks/use-admin", () => ({
  useOperationsAttention: mocks.attention,
}));

const queue = {
  site_id: "place",
  site_name: "Harbour Complex",
  generated_at: "2026-01-01T10:00:00Z",
  total: 1,
  categories: [
    {
      kind: "maintenance" as const,
      count: 1,
      items: [
        {
          code: "maintenance.past_due",
          kind: "maintenance" as const,
          subject_type: "maintenance_request",
          subject_id: "request",
          site_id: "place",
          place_id: "place",
          place_name: "Block A",
          party_name: "Facilities",
          domain: "mixed_use",
          due_at: "2026-01-02T09:00:00Z",
          amount: null,
          currency: null,
        },
      ],
    },
  ],
};

function mount() {
  return render(
    <AttentionQueueSection useCase="mixed_use" propertyName="Harbour Complex" />,
  );
}

describe("attention queue section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the grouped work it receives from the queue", () => {
    mocks.attention.mockReturnValue({
      data: queue,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    mount();

    const region = screen.getByRole("region", { name: "Attention required" });
    expect(region).toHaveTextContent("Maintenance past due");
    expect(region).toHaveTextContent("1 open");
  });

  it("distinguishes a failed queue from the rest of the dashboard", () => {
    mocks.attention.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: mocks.refetch,
    });

    mount();

    expect(
      screen.getByText("The work queue could not be loaded"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry work queue" }),
    ).toBeInTheDocument();
  });

  it("says nothing is waiting when the queue is empty", () => {
    mocks.attention.mockReturnValue({
      data: { ...queue, total: 0, categories: [] },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    mount();

    expect(
      screen.getByText("Nothing is overdue or waiting for a decision."),
    ).toBeInTheDocument();
  });

  it("routes a mixed-use maintenance item to the mixed-use work order page", () => {
    mocks.attention.mockReturnValue({
      data: queue,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    mount();

    expect(
      screen.getByRole("link", { name: /Maintenance past due/ }),
    ).toHaveAttribute("href", "/admin/mixed-use/maintenance");
  });
});
