import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OrganizationSettingsTabs,
  organizationSettingsSectionFromPath,
} from "./OrganizationSettingsTabs";

describe("OrganizationSettingsTabs", () => {
  it("uses organization routes and marks the active configuration section", () => {
    render(<OrganizationSettingsTabs active="plugins" />);

    expect(
      screen.getByRole("link", { name: "General details" }),
    ).toHaveAttribute("href", "/organization/settings");
    expect(screen.getByRole("link", { name: "Plugins" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Administrators" }),
    ).toHaveAttribute("href", "/organization/settings/administrators");
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "href",
      "/organization/settings/payment",
    );
    expect(screen.getByRole("link", { name: "Integrations" })).not.toHaveAttribute(
      "aria-current",
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
      organizationSettingsSectionFromPath("/organization/settings/plugins"),
    ).toBe("plugins");
  });
});
