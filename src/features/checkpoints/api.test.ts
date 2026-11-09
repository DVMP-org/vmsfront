import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { checkpointsApi, type PassageInput } from "./api";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const passage: PassageInput = {
  authorization_code: "VISIT-001",
  direction: "entry",
  idempotency_key: "passage-key",
};

describe("checkpoint API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records through the assigned-checkpoint endpoint with the checkpoint header", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: "event" },
    });

    await checkpointsApi.record("checkpoint-1", passage);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/admin/checkpoints/passages",
      passage,
      { headers: { "X-Checkpoint": "checkpoint-1" } },
    );
  });

  it("lists and reassigns the one active operator for a checkpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { assignments: [] },
    });
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { id: "assignment" },
    });

    await checkpointsApi.operators("place-1");
    await checkpointsApi.assignOperator("checkpoint-1", "party-2");

    expect(apiClient.get).toHaveBeenCalledWith("/admin/checkpoints/operators", {
      params: { place_id: "place-1" },
    });
    expect(apiClient.put).toHaveBeenCalledWith(
      "/admin/checkpoints/checkpoint-1/operator",
      { party_id: "party-2" },
    );
  });

  it("loads the direct operator context and server-filtered access history", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: "checkpoint" } })
      .mockResolvedValueOnce({ data: { assignments: [] } })
      .mockResolvedValueOnce({ data: { items: [], total: 0 } });

    await checkpointsApi.active();
    await checkpointsApi.myAssignments();
    await checkpointsApi.accessEvents({
      page: 2,
      outcome: "denied",
      direction: "entry",
      search: "INV-123456",
    });

    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      "/admin/checkpoints/active",
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      "/admin/checkpoints/operators/mine",
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(3, "/admin/access-events", {
      params: {
        page: 2,
        outcome: "denied",
        direction: "entry",
        search: "INV-123456",
      },
    });
  });
});
