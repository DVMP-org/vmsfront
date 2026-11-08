import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrganizationSettingsTabs } from "./OrganizationSettingsTabs";

describe("OrganizationSettingsTabs", () => {
  it("uses organization routes and marks the active configuration section", () => {
    render(<OrganizationSettingsTabs active="branding" />);

    expect(
      screen.getByRole("link", { name: "General details" }),
    ).toHaveAttribute("href", "/organization/settings");
    expect(screen.getByRole("link", { name: "Branding" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "href",
      "/organization/settings/payment",
    );
    expect(screen.getByRole("link", { name: "Integrations" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
