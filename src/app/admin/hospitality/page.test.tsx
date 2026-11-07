import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, it, expect, beforeEach } from "vitest";
import Page from "./page";
const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  action: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (select: any) => select({ organization: { id: "org" } }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (select: any) => select({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));
vi.mock("@/features/hospitality/api", () => ({ hospitalityApi: mocks }));
vi.mock("@/components/facets/FacetPicker", () => ({ FacetPicker: () => null }));
const stay = {
  id: "stay",
  status: "reserved",
  planned_check_in: "2027-01-02T15:00:00Z",
  planned_check_out: "2027-01-04T11:00:00Z",
  actual_check_in: null,
  actual_check_out: null,
  notes: null,
  guests: [
    { id: "g", role: "primary", party: { id: "p", display_name: "Ada Guest" } },
  ],
  room_assignments: [
    {
      id: "r",
      assigned_from: "2027-01-02T15:00:00Z",
      assigned_to: "2027-01-04T11:00:00Z",
      room: { id: "room", name: "Suite 12" },
    },
  ],
};
function mount() {
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
      <Page />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.profile.mockResolvedValue({ data: { effective_permissions: ["*"] } });
  mocks.list.mockResolvedValue({
    items: [stay],
    page: 1,
    total: 1,
    total_pages: 1,
  });
  mocks.get.mockResolvedValue(stay);
});
it("renders empty and failed lists explicitly with retry", async () => {
  mocks.list.mockRejectedValueOnce(new Error("unavailable"));
  mount();
  await screen.findByRole("button", { name: "Retry stays" });
  mocks.list.mockResolvedValue({
    items: [],
    page: 1,
    total: 0,
    total_pages: 0,
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry stays" }));
  await screen.findByText("No stays found");
});
it("hides lifecycle actions from read-only operators", async () => {
  mocks.profile.mockResolvedValue({
    data: {
      effective_permissions: ["hospitality_stays.list", "hospitality_stays.show"],
    },
  });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Ada Guest/ }));
  await screen.findByRole("heading", { name: "Ada Guest" });
  expect(screen.queryByRole("button", { name: "Check in" })).toBeNull();
  expect(screen.queryByRole("button", { name: "New reservation" })).toBeNull();
});
it("requires confirmation and refreshes state after check-in", async () => {
  mocks.action.mockResolvedValue({ ...stay, status: "checked_in" });
  mocks.get
    .mockResolvedValueOnce(stay)
    .mockResolvedValue({ ...stay, status: "checked_in" });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Ada Guest/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Check in" }));
  expect(mocks.action).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
  await waitFor(() =>
    expect(mocks.action).toHaveBeenCalledWith("stay", "check-in", undefined),
  );
  await screen.findByRole("button", { name: "Check out" });
});
it("preserves the editor and surfaces a conflict for retry", async () => {
  mocks.update.mockRejectedValue({
    isAxiosError: true,
    response: { data: { message: "Room overlaps another stay" } },
  });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Ada Guest/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Reschedule / edit" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save dates and notes" }));
  await screen.findByText("Room overlaps another stay");
  expect(screen.getByLabelText("Planned arrival")).toBeInTheDocument();
});

it("uses canonical checkin grants for a scoped operator", async () => {
  mocks.profile.mockResolvedValue({
    data: {
      effective_permissions: [
          "hospitality_stays.list",
          "hospitality_stays.show",
          "hospitality_stays.checkin",
        ],
    },
  });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: /Ada Guest/ }));
  expect(await screen.findByRole("button", { name: "Check in" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Reschedule / edit" }),
  ).toBeNull();
});
