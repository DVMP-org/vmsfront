import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoomCategoriesWorkspace } from "./RoomCategoriesWorkspace";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

const categories = [
  {
    id: "group-deluxe",
    organization_id: "org",
    site_id: "site",
    name: "Deluxe Super",
    description: "King bed, city view",
    created_by_site_admin_id: null,
    places: [],
    created_at: "2026-11-01T09:00:00Z",
    updated_at: "2026-11-01T09:00:00Z",
  },
  {
    id: "group-suite",
    organization_id: "org",
    site_id: "site",
    name: "Executive Suite",
    description: null,
    created_by_site_admin_id: null,
    places: [],
    created_at: "2026-11-02T09:00:00Z",
    updated_at: "2026-11-02T09:00:00Z",
  },
];

vi.mock("@/store/app-store", () => ({
  useAppStore: (
    selector: (state: { selectedSite: { id: string } }) => unknown,
  ) => selector({ selectedSite: { id: "site" } }),
}));

vi.mock("@/features/place-groups/api", () => ({
  placeGroupsApi: {
    list: async () => categories,
    create: mocks.create,
    update: mocks.update,
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

vi.mock("../queries", () => ({
  roomCategoryKeys: { all: ["hospitality", "room-categories"] },
  hospitalityRoomKeys: { all: ["hospitality", "rooms"] },
  useRoomCategories: () => ({
    data: categories,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useHospitalityRooms: () => ({
    data: [
      {
        id: "room-1",
        name: "101",
        room_number: "101",
        status: "available",
        place_group_id: "group-deluxe",
      },
      {
        id: "room-2",
        name: "102",
        room_number: "102",
        status: "available",
        place_group_id: "group-deluxe",
      },
    ],
    isPending: false,
  }),
}));

function mount(canManage = true) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <RoomCategoriesWorkspace canManage={canManage} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocks.create.mockReset();
  mocks.update.mockReset();
});

describe("room categories", () => {
  it("counts the rooms in each category instead of trusting a stored count", () => {
    mount();

    expect(screen.getAllByText("2 rooms").length).toBeGreaterThan(0);
    // A category with nothing in it is allowed, and says so.
    expect(screen.getAllByText("No rooms yet").length).toBeGreaterThan(0);
  });

  it("creates a category with no rooms at all", async () => {
    mocks.create.mockResolvedValue(categories[0]);
    mount();

    fireEvent.click(screen.getByRole("button", { name: "New category" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Category name"), {
      target: { value: "Garden Twin" },
    });

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create category" }),
    );

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        site_id: "site",
        name: "Garden Twin",
        place_ids: [],
      }),
    );
  });

  it("renames without re-sending the membership list", async () => {
    mocks.update.mockResolvedValue(categories[0]);
    mount();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Category name"), {
      target: { value: "Deluxe Superior" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    const [, body] = mocks.update.mock.calls[0];
    expect(body).toMatchObject({ name: "Deluxe Superior" });
    // Rooms are attached from the room, so a rename must not blank the group.
    expect(body).not.toHaveProperty("place_ids");
  });

  it("offers no way to create a category without permission", () => {
    mount(false);

    expect(screen.queryByRole("button", { name: "New category" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
