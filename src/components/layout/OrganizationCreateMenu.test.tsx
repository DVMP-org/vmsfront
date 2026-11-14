import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganizationCreateMenu } from "./OrganizationCreateMenu";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

describe("OrganizationCreateMenu", () => {
  it("shows only creation actions granted to the current administrator", () => {
    render(<OrganizationCreateMenu permissions={["places.create"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Create a resource" }));
    expect(screen.getByRole("menuitem", { name: /Site Add/ })).toBeVisible();
    expect(
      screen.queryByRole("menuitem", { name: /Site manager/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Organization administrator/ }),
    ).not.toBeInTheDocument();
  });

  it("opens a creation flow and closes the menu", () => {
    navigation.push.mockReset();
    render(<OrganizationCreateMenu permissions={["*"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Create a resource" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Site manager/ }));

    expect(navigation.push).toHaveBeenCalledWith(
      "/organization/managers?create=manager",
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not render an unavailable create control", () => {
    render(<OrganizationCreateMenu permissions={["places.list"]} />);
    expect(
      screen.queryByRole("button", { name: "Create a resource" }),
    ).not.toBeInTheDocument();
  });
});
