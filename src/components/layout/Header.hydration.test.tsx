import { act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
  useProfile: () => ({ data: null }),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: () => ({ organization: null }),
}));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({ data: null }),
}));
vi.mock("./CommandNavigation", () => ({ CommandNavigation: () => null }));
vi.mock("./NotificationDropdown", () => ({ NotificationDropdown: () => null }));
vi.mock("./OrganizationSwitcher", () => ({ OrganizationSwitcher: () => null }));

describe("Header hydration", () => {
  it("hydrates the logo link after the reported host-editor annotations", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const tree = (
      <QueryClientProvider client={client}>
        <Header type="admin" />
      </QueryClientProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    const logo = container.querySelector<HTMLAnchorElement>(
      'a[aria-label="VMSCore organizations"]',
    )!;
    // Reproduce the exact DOM annotations shown in the hydration report.
    logo.setAttribute("contenteditable", "false");
    logo.style.cursor = "pointer";
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
      expect(recoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(
        container.querySelector('a[aria-label="VMSCore organizations"]'),
      ).toBe(logo);
      expect(logo.getAttribute("href")).toMatch(/^\/organizations\/?$/);
    } finally {
      act(() => root?.unmount());
      consoleError.mockRestore();
      container.remove();
      client.clear();
    }
  });
});
