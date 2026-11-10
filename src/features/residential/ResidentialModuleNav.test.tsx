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
      screen.getByRole("link", { name: "Residents & households" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Residency directory" }),
    ).toHaveAttribute("href", "/admin/residential/units");
    expect(screen.getByRole("link", { name: "Visitors" })).toHaveAttribute(
      "href",
      "/admin/residential/visitors",
    );
    expect(screen.getByRole("link", { name: "Announcements" })).toHaveAttribute(
      "href",
      "/admin/residential/announcements",
    );
    expect(screen.getByRole("link", { name: "Checkpoints" })).toHaveAttribute(
      "href",
      "/admin/checkpoints",
    );
    expect(screen.getByRole("link", { name: "Invitations" })).toHaveAttribute(
      "href",
      "/admin/invitations",
    );
    expect(
      screen.getByRole("link", { name: "Check-in console" }),
    ).toHaveAttribute("href", "/admin/checkpoints/console");
    expect(screen.getByRole("link", { name: "Movement log" })).toHaveAttribute(
      "href",
      "/admin/passages",
    );
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
