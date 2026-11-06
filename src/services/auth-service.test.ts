import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { authService } from "@/services/auth-service";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("authService.getUser", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("unwraps the current-user endpoint's user wrapper", async () => {
    const user = {
      id: "user-1",
      email: "codex@example.test",
      first_name: "Codex",
      last_name: "Browser",
    };
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      status_code: 200,
      message: "Success",
      data: { user, resident: null, admin: null, staff: null },
    });

    const response = await authService.getUser();

    expect(apiClient.get).toHaveBeenCalledWith("/user/me");
    expect(response.data).toEqual(user);
  });
});
