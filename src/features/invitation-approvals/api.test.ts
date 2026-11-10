import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { items: [] } }) },
}));

import { apiClient } from "@/lib/api-client";
import { invitationApprovalsApi } from "./api";

describe("invitation approvals API", () => {
  it("sends the site filter separately from the destination place filter", async () => {
    await invitationApprovalsApi.list({ status: "all", site_id: "site-1" });
    expect(apiClient.get).toHaveBeenCalledWith("/admin/visit-authorizations", {
      params: { page: 1, page_size: 25, site_id: "site-1" },
    });
  });
});
