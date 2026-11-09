import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResidentialModuleNav } from "./ResidentialModuleNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/residential/occupancies",
}));

describe("residential module navigation", () => {
  it("exposes every residential workflow and marks the active route", () => {
    render(<ResidentialModuleNav />);

    expect(
      screen.getByRole("navigation", { name: "Residential operations" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Households & leases" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Units" })).toHaveAttribute(
      "href",
      "/admin/residential/units",
    );
    expect(
      screen.getByRole("link", { name: "Visitors & access" }),
    ).toHaveAttribute("href", "/admin/residential/visitors");
    expect(screen.getByRole("link", { name: "Announcements" })).toHaveAttribute(
      "href",
      "/admin/residential/announcements",
    );
  });
});
