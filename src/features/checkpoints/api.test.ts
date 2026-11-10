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

  it("records through the assigned-checkpoint endpoint without a checkpoint header", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: "event" },
    });

    await checkpointsApi.record(passage);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/admin/checkpoints/passages",
      passage,
    );
  });

  it("saves several managers through the checkpoint assignment endpoint", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { assignments: [] } });
    await checkpointsApi.setOperators("checkpoint-1", ["admin-1", "admin-2"]);
    expect(apiClient.put).toHaveBeenCalledWith(
      "/admin/checkpoints/checkpoint-1/operators",
      {
        site_admin_ids: ["admin-1", "admin-2"],
      },
    );
  });

  it("loads the assigned console without a gate ID", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: "checkpoint" } });
    await checkpointsApi.console();
    expect(apiClient.get).toHaveBeenCalledWith("/admin/checkpoints/console");
  });

  it("lists and adds a Site manager to a checkpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { assignments: [] },
    });
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { id: "assignment" },
    });

    await checkpointsApi.operators("place-1");
    await checkpointsApi.assignOperator("checkpoint-1", "admin-2");

    expect(apiClient.get).toHaveBeenCalledWith("/admin/checkpoints/operators", {
      params: { site_id: "place-1" },
    });
    expect(apiClient.put).toHaveBeenCalledWith(
      "/admin/checkpoints/checkpoint-1/operator",
      { site_admin_id: "admin-2" },
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
