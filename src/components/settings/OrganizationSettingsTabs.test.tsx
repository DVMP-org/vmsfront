import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OrganizationSettingsTabs,
  organizationSettingsSectionFromPath,
} from "./OrganizationSettingsTabs";

describe("OrganizationSettingsTabs", () => {
  it("uses organization routes and marks the active configuration section", () => {
    render(<OrganizationSettingsTabs active="general" />);

    expect(
      screen.getByRole("link", { name: "General details" }),
    ).toHaveAttribute("href", "/organization/settings");
    expect(
      screen.queryByRole("link", { name: "Roles & permissions" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Administrators" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Email templates" }),
    ).toHaveAttribute("href", "/organization/settings/templates");
    expect(screen.queryByRole("link", { name: "Payments" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Mail delivery" })).toBeNull();
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
    ).toBe("general");
    expect(
      organizationSettingsSectionFromPath("/organization/settings/roles"),
    ).toBe("general");
    expect(
      organizationSettingsSectionFromPath("/organization/settings/templates"),
    ).toBe("templates");
  });
});
