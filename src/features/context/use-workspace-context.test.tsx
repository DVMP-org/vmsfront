import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceContext } from "./use-workspace-context";

const mocks = vi.hoisted(() => ({
  workspace: vi.fn(),
  clearProperty: vi.fn(),
}));

vi.mock("./api", () => ({
  contextApi: { workspace: mocks.workspace },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      organization: { id: string };
      selectedSite: { id: string; name: string };
      setSelectedSite: typeof mocks.clearProperty;
    }) => unknown,
  ) =>
    selector({
      organization: { id: "org" },
      selectedSite: { id: "stale-place", name: "Old property" },
      setSelectedSite: mocks.clearProperty,
    }),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user" } }),
}));

function Harness() {
  const context = useWorkspaceContext();
  return <p>{context.isError ? "context failed" : "loading"}</p>;
}

describe("workspace context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears a stale property when the server rejects its context", async () => {
    mocks.workspace.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Harness />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.clearProperty).toHaveBeenCalledWith(null),
    );
    expect(mocks.workspace).toHaveBeenCalledWith("stale-place");
  });

  it("retains the selected property on a retryable network failure", async () => {
    mocks.workspace.mockRejectedValue(new Error("offline"));
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Harness />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.workspace).toHaveBeenCalled());
    expect(mocks.clearProperty).not.toHaveBeenCalled();
  });
});
