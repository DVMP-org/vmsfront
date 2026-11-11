import { act, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { OrganizationShell } from "./OrganizationShell";

const navigation = vi.hoisted(() => ({ pathname: "/organization/sites", permissions: ["places.list"] }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
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
    data: { effective_permissions: navigation.permissions },
    isPending: false,
    isError: false,
  }),
}));

describe("OrganizationShell", () => {
  it.each(["/organization/roles", "/organization/roles/create", "/organization/roles/role-1/edit"])("keeps Members & Roles active at %s", (pathname) => {
    navigation.pathname = pathname;
    navigation.permissions = ["*"];
    const view = render(<OrganizationShell><div>Roles</div></OrganizationShell>);
    const active = view.container.querySelectorAll('a[aria-current="page"]');
    expect(active).toHaveLength(2);
    active.forEach((link) => expect(link).toHaveAttribute("href", "/organization/administrators"));
    navigation.pathname = "/organization/sites";
    navigation.permissions = ["places.list"];
  });
  it.each(["/organization/sites/child", "/organization/sites/child/edit", "/organization/sites/child/move", "/organization/sites/new"])("keeps Sites active at %s", (pathname) => {
    navigation.pathname = pathname;
    const view = render(<OrganizationShell><div>Site</div></OrganizationShell>);
    const active = view.container.querySelectorAll('a[aria-current="page"]');
    expect(active).toHaveLength(2);
    active.forEach((link) => expect(link).toHaveAttribute("href", "/organization/sites"));
    navigation.pathname = "/organization/sites";
  });
  it("exposes the organization-wide Site directory", () => {
    render(
      <OrganizationShell>
        <div>Site directory</div>
      </OrganizationShell>,
    );

    expect(
      screen.getAllByRole("link", { name: "Sites" })[0],
    ).toHaveAttribute("href", "/organization/sites");
    expect(
      screen.getAllByRole("link", { name: "Sites" })[0],
    ).toHaveAttribute("aria-current", "page");
  });

  it("hydrates desktop, mobile and organization-switch links after host annotations", async () => {
    const tree = (
      <OrganizationShell>
        <div>Site directory</div>
      </OrganizationShell>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors).toHaveLength(5);
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
