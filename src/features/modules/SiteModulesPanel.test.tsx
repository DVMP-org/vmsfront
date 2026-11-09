import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { siteModulesApi, type SiteModuleList } from "@/features/modules/api";
import { SiteModulesPanel } from "@/features/modules/SiteModulesPanel";

vi.mock("@/features/modules/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/modules/api")>(
    "@/features/modules/api",
  );
  return {
    ...actual,
    siteModulesApi: {
      get: vi.fn(),
      update: vi.fn(),
    },
  };
});

const initial: SiteModuleList = {
  site_id: "place-1",
  effective_use_case: "mixed_use",
  modules: [
    {
      key: "properties",
      label: "Property management",
      description: "Properties, buildings, floors and spaces.",
      enabled: true,
      supported: true,
      settings: {},
    },
    {
      key: "hospitality",
      label: "Hospitality operations",
      description: "Rooms, guests, stays and hotel billing.",
      enabled: true,
      supported: true,
      settings: {},
    },
    {
      key: "expense_allocation",
      label: "Shared expense allocation",
      description: "Allocate shared expenses across mixed-use domains.",
      enabled: true,
      supported: true,
      settings: {},
    },
  ],
};

function renderPanel(canEdit = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SiteModulesPanel
        siteId="place-1"
        siteName="Harbour Complex"
        canEdit={canEdit}
      />
    </QueryClientProvider>,
  );
}

describe("SiteModulesPanel", () => {
  beforeEach(() => {
    vi.mocked(siteModulesApi.get).mockResolvedValue(initial);
    vi.mocked(siteModulesApi.update).mockResolvedValue(initial);
  });

  it("stages module changes and saves the property configuration", async () => {
    renderPanel();

    expect(
      await screen.findByText("Modules for Harbour Complex"),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("switch", {
        name: "Hospitality operations enabled",
      }),
    );
    expect(screen.getByRole("button", { name: /Save 1 change/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Save 1 change/ }));

    await waitFor(() =>
      expect(siteModulesApi.update).toHaveBeenCalledWith(
        "place-1",
        expect.arrayContaining([
          expect.objectContaining({ key: "hospitality", enabled: false }),
          expect.objectContaining({ key: "properties", enabled: true }),
        ]),
      ),
    );
  });

  it("does not expose edit controls to read-only administrators", async () => {
    renderPanel(false);

    expect(
      await screen.findByText("Modules for Harbour Complex"),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Save changes/ }),
    ).not.toBeInTheDocument();
  });
});
