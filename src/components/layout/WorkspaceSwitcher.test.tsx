import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setSelectedSite: vi.fn(),
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
  useVerifyToken: () => ({
    data: {
      workspaces: [
        {
          id: "stay",
          role: "guest",
          site_id: "office",
          place: {
            id: "hotel",
            name: "Harbour Hotel",
            site_name: "Harbour Offices",
          },
        },
        {
          id: "other-stay",
          role: "resident",
          site_id: "other-site",
          place: {
            id: "cadwell-flat",
            name: "Suite A",
            site_name: "Cadwell Close",
          },
        },
      ],
    },
  }),
}));

vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      management: {
        is_administrator: true,
        authoritative_site: {
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
      selectedSite: { id: "office", name: "Harbour Offices" },
      setSelectedSite: mocks.setSelectedSite,
    }),
}));

vi.mock("@/features/workspaces/catalog", () => ({
  buildWorkspaceCards: (
    _admin: unknown,
    relationships: Array<{
      id: string;
      role: string;
      place: { id: string; name: string };
    }>,
    managementPlace?: { id: string; name: string } | null,
  ) => [
      ...(managementPlace
        ? [
          {
          key: `management:${managementPlace.id}`,
          area: "management",
          title: `${managementPlace.name} management`,
          subtitle: "Property operations",
          roleLabel: "Administrator",
          href: "/admin",
          place: managementPlace,
        },
        ]
        : []),
      ...relationships.map((relationship) => ({
        key: `guest:${relationship.id}`,
      area: "guest",
      title: `Stay at ${relationship.place.name}`,
      subtitle: "Guest stay",
      roleLabel: "Guest",
      href: `/workspace/${relationship.place.id}`,
      relationship,
    })),
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
    mocks.setSelectedSite.mockReset();
  });

  it("lists only place-backed management and personal access for the active Site", () => {
    render(<WorkspaceSwitcher />);

    fireEvent.click(
      screen.getByRole("button", { name: /Workspace Harbour Offices/i }),
    );

    expect(screen.getByText("Place-backed workspaces")).toBeInTheDocument();
    expect(screen.getByText("Harbour Offices management")).toBeInTheDocument();
    expect(screen.getByText("Stay at Harbour Hotel")).toBeInTheDocument();
    expect(screen.queryByText("Stay at Suite A")).toBeNull();
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

    expect(mocks.setSelectedSite).toHaveBeenCalledWith({
      id: "office",
      name: "Harbour Offices",
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin?site_id=office");
  });

  it("keeps the Site context when opening a place workspace", () => {
    render(<WorkspaceSwitcher />);
    fireEvent.click(
      screen.getByRole("button", { name: /Workspace Harbour Offices/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Stay at Harbour Hotel/i }),
    );

    expect(mocks.setSelectedSite).toHaveBeenCalledWith({
      id: "office",
      name: "Harbour Offices",
    });
    expect(mocks.push).toHaveBeenCalledWith("/workspace/hotel");
  });
});
