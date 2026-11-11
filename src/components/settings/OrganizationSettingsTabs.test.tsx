import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OrganizationSettingsTabs,
  organizationSettingsSectionFromPath,
} from "./OrganizationSettingsTabs";

describe("OrganizationSettingsTabs", () => {
  it("uses organization routes and marks the active configuration section", () => {
    render(<OrganizationSettingsTabs active="roles" />);

    expect(
      screen.getByRole("link", { name: "General details" }),
    ).toHaveAttribute("href", "/organization/settings");
    expect(
      screen.getByRole("link", { name: "Roles & permissions" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Administrators" }),
    ).toHaveAttribute("href", "/organization/settings/administrators");
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "href",
      "/organization/settings/payment",
    );
    expect(screen.getByRole("link", { name: "Plugins" })).toHaveAttribute(
      "href",
      "/organization/plugins",
    );
    expect(screen.getByRole("link", { name: "Integrations" })).toHaveAttribute(
      "href",
      "/organization/settings/integrations",
    );
  });

  it("derives the active section from settings paths", () => {
    expect(organizationSettingsSectionFromPath("/organization/settings")).toBe(
      "general",
    );
    expect(
      organizationSettingsSectionFromPath(
        "/organization/settings/administrators",
      ),
    ).toBe("administrators");
    expect(
      organizationSettingsSectionFromPath("/organization/settings/roles"),
    ).toBe("roles");
  });
});
