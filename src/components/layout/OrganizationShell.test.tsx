import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganizationShell } from "./OrganizationShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/organization/properties",
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: {
      organization: { name: string } | null;
    }) => unknown,
  ) => selector({ organization: { name: "Harbour Group" } }),
}));
vi.mock("./Header", () => ({
  Header: () => <header>Organization header</header>,
}));
vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: { effective_permissions: ["places.list"] },
    isPending: false,
    isError: false,
  }),
}));

describe("OrganizationShell", () => {
  it("exposes the organization-wide property register", () => {
    render(
      <OrganizationShell>
        <div>Property register</div>
      </OrganizationShell>,
    );

    expect(
      screen.getAllByRole("link", { name: "Properties" })[0],
    ).toHaveAttribute("href", "/organization/properties");
    expect(
      screen.getAllByRole("link", { name: "Properties" })[0],
    ).toHaveAttribute("aria-current", "page");
  });
});
