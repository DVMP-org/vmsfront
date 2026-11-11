import { act, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { OrganizationShell } from "./OrganizationShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/organization/properties",
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: { organization: { name: string } | null }) => unknown,
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

  it("hydrates desktop, mobile and organization-switch links after host annotations", async () => {
    const tree = (
      <OrganizationShell>
        <div>Property register</div>
      </OrganizationShell>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors).toHaveLength(7);
    for (const anchor of anchors) {
      anchor.setAttribute("contenteditable", "false");
      anchor.style.cursor = "pointer";
    }
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const recoverableError = vi.fn();
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree, {
          onRecoverableError: recoverableError,
        });
      });
      expect(consoleError).not.toHaveBeenCalled();
      expect(recoverableError).not.toHaveBeenCalled();
      expect(Array.from(container.querySelectorAll("a"))).toEqual(anchors);
      expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(
        2,
      );
    } finally {
      act(() => root?.unmount());
      consoleError.mockRestore();
      container.remove();
    }
  });
});
