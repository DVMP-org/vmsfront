import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setSelectedProperty: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdminProfile: () => ({
    data: { id: "admin", role: { name: "Administrator" } },
    isError: false,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useVerifyToken: () => ({ data: { workspaces: [] } }),
}));

vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      management: {
        is_administrator: true,
        authoritative_place: {
          id: "office",
          name: "Harbour Offices",
          slug: "harbour-offices",
          kind: "site",
        },
      },
    },
  }),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      selectedProperty: { id: "office", name: "Harbour Offices" },
      setSelectedProperty: mocks.setSelectedProperty,
    }),
}));

vi.mock("@/features/workspaces/catalog", () => ({
  buildWorkspaceCards: () => [
    {
      key: "management:office",
      area: "management",
      title: "Harbour Offices management",
      subtitle: "Property operations",
      roleLabel: "Administrator",
      href: "/admin",
      place: { id: "office", name: "Harbour Offices" },
    },
    {
      key: "guest:stay",
      area: "guest",
      title: "Stay at Harbour Hotel",
      subtitle: "Guest stay",
      roleLabel: "Guest",
      href: "/workspace/hotel",
      relationship: {
        id: "stay",
        role: "guest",
        place: { id: "hotel", name: "Harbour Hotel" },
      },
    },
  ],
  workspaceAreaMeta: {
    management: { title: "Management" },
    occupancy: { title: "Occupancy & tenancy" },
    staff: { title: "Staff access" },
    guest: { title: "Hospitality stays" },
  },
}));

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.setSelectedProperty.mockReset();
  });

  it("lists only place-backed management and personal access", () => {
    render(<WorkspaceSwitcher />);

    fireEvent.click(
      screen.getByRole("button", { name: /Workspace Harbour Offices/i }),
    );

    expect(screen.getByText("Place-backed workspaces")).toBeInTheDocument();
    expect(screen.getByText("Harbour Offices management")).toBeInTheDocument();
    expect(screen.getByText("Stay at Harbour Hotel")).toBeInTheDocument();
    expect(screen.queryByText("Organization overview")).toBeNull();
    expect(
      screen.getByRole("link", { name: /View all workspaces/i }),
    ).toHaveAttribute("href", "/?lobby=1");
  });

  it("sets the selected property before opening management", () => {
    render(<WorkspaceSwitcher />);
    fireEvent.click(
      screen.getByRole("button", { name: /Workspace Harbour Offices/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Harbour Offices management/i }),
    );

    expect(mocks.setSelectedProperty).toHaveBeenCalledWith({
      id: "office",
      name: "Harbour Offices",
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin?site_id=office");
  });
});
