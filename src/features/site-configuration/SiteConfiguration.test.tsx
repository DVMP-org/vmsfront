import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sitesApi } from "@/features/sites/api";
import { SiteConfiguration } from "./SiteConfiguration";

const mocks = vi.hoisted(() => ({
  selectedProperty: { id: "site-1", name: "Harbour Campus" } as {
    id: string;
    name: string;
  } | null,
  workspace: {
    data: {
      effective_use_case: "hospitality",
      management: { is_administrator: true, mode: "local" },
    },
  },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      selectedProperty: typeof mocks.selectedProperty;
    }) => unknown,
  ) => selector({ selectedProperty: mocks.selectedProperty }),
}));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => mocks.workspace,
}));
vi.mock("@/features/modules/SiteModulesPanel", () => ({
  SiteModulesPanel: ({
    siteId,
    canEdit,
  }: {
    siteId: string;
    canEdit: boolean;
  }) => (
    <div data-testid="site-modules">
      {siteId}:{String(canEdit)}
    </div>
  ),
}));
vi.mock("@/features/sites/api", () => ({
  sitesApi: { get: vi.fn() },
}));

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      <SiteConfiguration />
    </QueryClientProvider>,
  );
}

describe("SiteConfiguration", () => {
  beforeEach(() => {
    mocks.selectedProperty = { id: "site-1", name: "Harbour Campus" };
    vi.mocked(sitesApi.get).mockResolvedValue({
      id: "site-1",
      organization_id: "org-1",
      parent_site_id: null,
      name: "Harbour Campus",
      use_case: "hospitality",
      description: null,
      address: "1 Harbour Road",
      is_active: true,
      updated_at: "2026-11-09T00:00:00Z",
      created_at: "2026-11-09T00:00:00Z",
      slug: "harbour-campus",
      ancestors: [],
      child_sites: [],
      places: [],
    });
  });

  it("loads the selected site module configuration and planned access automation", async () => {
    mount();

    expect(
      await screen.findByRole("heading", { name: "Harbour Campus" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Operational settings" }),
    );
    expect(screen.getByTestId("site-modules")).toHaveTextContent("site-1:true");
    expect(
      screen.getByText(/Plugins and integrations are configured once/),
    ).toBeVisible();
  });

  it("asks the user to select a site instead of guessing a workspace", () => {
    mocks.selectedProperty = null;
    mount();

    expect(screen.getByText("Select a site workspace")).toBeVisible();
  });
});
