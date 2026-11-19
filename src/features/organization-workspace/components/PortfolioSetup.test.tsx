import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OrganizationSiteSummary } from "../api";
import { PortfolioSetup } from "./PortfolioSetup";

function site(
  overrides: Partial<OrganizationSiteSummary> = {},
): OrganizationSiteSummary {
  return {
    id: "site-1",
    organization_id: "org-1",
    parent_site_id: null,
    parent_site_name: null,
    name: "Harbour Court",
    slug: "harbour-court",
    use_case: "residential",
    description: null,
    address: "",
    timezone: "Africa/Lagos",
    is_active: true,
    place_count: 0,
    child_site_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("PortfolioSetup", () => {
  it("offers the first Site action only when creation is permitted", () => {
    const onCreate = vi.fn();
    const view = render(
      <PortfolioSetup sites={[]} canCreate onCreate={onCreate} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create Site" }));
    expect(onCreate).toHaveBeenCalledOnce();

    view.rerender(
      <PortfolioSetup sites={[]} canCreate={false} onCreate={onCreate} />,
    );
    expect(screen.queryByRole("button", { name: "Create Site" })).toBeNull();
    expect(
      screen.getByText(/Ask an organization administrator/),
    ).toBeInTheDocument();
  });

  it("lists only active Sites without Places and disappears when setup is complete", () => {
    const view = render(
      <PortfolioSetup
        sites={[
          site(),
          site({ id: "site-2", name: "Archived", is_active: false }),
        ]}
        canCreate
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "Harbour Court" })).toHaveAttribute(
      "href",
      "/organization/sites/site-1",
    );
    expect(screen.queryByText("Archived")).toBeNull();

    view.rerender(
      <PortfolioSetup
        sites={[site({ place_count: 3 })]}
        canCreate
        onCreate={vi.fn()}
      />,
    );
    expect(screen.queryByText("Sites without Places")).toBeNull();
  });
});
