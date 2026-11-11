import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceContext } from "./use-workspace-context";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const mocks = vi.hoisted(() => ({
  workspace: vi.fn(),
  clearProperty: vi.fn(),
  property: { id: "stale-place", name: "Old property" } as {
    id: string;
    name: string;
  } | null,
}));

vi.mock("./api", () => ({
  contextApi: { workspace: mocks.workspace },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      organization: { id: string; slug: string };
      selectedProperty: { id: string; name: string } | null;
      setSelectedProperty: typeof mocks.clearProperty;
    }) => unknown,
  ) =>
    selector({
      organization: { id: "org", slug: "acme" },
      selectedProperty: mocks.property,
      setSelectedProperty: mocks.clearProperty,
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
    window.history.replaceState(null, "", "/");
    mocks.property = { id: "stale-place", name: "Old property" };
    document.cookie =
      "selected-site=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie =
      "selected-site-organization=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it.each([403, 404])(
    "retains the selected Site when the server rejects its context (%s)",
    async (status) => {
      mocks.workspace.mockRejectedValue({
        isAxiosError: true,
        response: { status },
      });
      render(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <Harness />
        </QueryClientProvider>,
      );

      await screen.findByText("context failed");
      expect(mocks.clearProperty).not.toHaveBeenCalled();
      expect(mocks.workspace).toHaveBeenCalledWith("stale-place");
    },
  );

  it("retains the selected property on a retryable network failure", async () => {
    mocks.workspace.mockRejectedValue(new Error("offline"));
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Harness />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.workspace).toHaveBeenCalled());
    expect(mocks.clearProperty).not.toHaveBeenCalled();
  });

  function mountContext() {
    return render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Harness />
      </QueryClientProvider>,
    );
  }

  it("uses a direct-link Site instead of the previous persisted selection", async () => {
    window.history.replaceState(null, "", "/admin?site_id=linked-site");
    mocks.workspace.mockResolvedValue({
      management: { selected_site: { id: "linked-site", name: "Linked Site" } },
    });
    mountContext();
    await waitFor(() =>
      expect(mocks.clearProperty).toHaveBeenCalledWith({
        id: "linked-site",
        name: "Linked Site",
      }),
    );
    expect(mocks.workspace).toHaveBeenCalledWith("linked-site");
  });

  it("restores a cookie Site before workspace validation when memory has no selection", async () => {
    mocks.property = null;
    document.cookie = "selected-site=cookie-site; path=/";
    document.cookie = "selected-site-organization=acme; path=/";
    mocks.workspace.mockResolvedValue({
      management: { selected_site: { id: "cookie-site", name: "Cookie Site" } },
    });
    mountContext();
    await waitFor(() =>
      expect(mocks.workspace).toHaveBeenCalledWith("cookie-site"),
    );
  });

  it("does not replace the selected child Site with its management authority", async () => {
    mocks.workspace.mockResolvedValue({
      management: { authoritative_site: { id: "parent-site", name: "Parent" } },
    });
    mountContext();
    await waitFor(() =>
      expect(mocks.workspace).toHaveBeenCalledWith("stale-place"),
    );
    expect(mocks.clearProperty).not.toHaveBeenCalled();
  });
});
