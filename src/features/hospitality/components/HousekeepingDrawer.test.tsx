import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";

import { HousekeepingDrawer } from "./HousekeepingDrawer";

const mocks = vi.hoisted(() => ({
    detail: vi.fn(),
    update: vi.fn(),
}));

vi.mock("../api", () => ({
    hospitalityApi: {
        housekeeping: {
            detail: mocks.detail,
            update: mocks.update,
        },
    },
}));

const room = {
    id: "room-1",
    name: "Room 101",
    room_number: "101",
    room_type: "double",
    place_group_id: null,
    place_group_name: null,
    floor: "1",
    capacity: 2,
    base_rate: "100.00",
    currency: "USD",
    amenities: [],
    status: "cleaning",
    housekeeping_status: "dirty",
    current_stay_id: null,
    current_guest_name: null,
    next_arrival: null,
    next_guest_name: null,
    maintenance_open: 0,
    updated_at: "2026-11-19T10:00:00Z",
};

beforeEach(() => {
    vi.resetAllMocks();
    mocks.detail.mockResolvedValue({
        room,
        task: {
            id: "room-1",
            room_id: "room-1",
            room_name: "Room 101",
            status: "dirty",
            priority: "normal",
            assigned_to: null,
            notes: null,
            due_at: null,
            updated_at: "2026-11-19T10:00:00Z",
        },
        history: [
            {
                id: "event-1",
                event_type: "stay_checked_out",
                from_status: "clean",
                to_status: "dirty",
                from_operational_status: "occupied",
                to_operational_status: "cleaning",
                assigned_to: null,
                assigned_to_name: null,
                previous_assigned_to: null,
                previous_assigned_to_name: null,
                priority: "normal",
                previous_priority: "normal",
                notes: null,
                due_at: null,
                actor_name: null,
                created_at: "2026-11-19T10:00:00Z",
            },
        ],
    });
    mocks.update.mockResolvedValue({
        id: "room-1",
        room_id: "room-1",
        room_name: "Room 101",
        status: "clean",
        priority: "normal",
        assigned_to: null,
        notes: null,
        due_at: null,
        updated_at: "2026-11-19T10:05:00Z",
    });
});

function mount() {
    render(
        <QueryClientProvider
            client={
                new QueryClient({ defaultOptions: { queries: { retry: false } } })
            }
        >
            <HousekeepingDrawer
                roomId="room-1"
                contextKey="context"
                onClose={() => { }}
                canEdit
                assignees={[{ value: "party-1", label: "Casey Cleaner" }]}
            />
        </QueryClientProvider>,
    );
}

it("shows the current state, history and housekeeping actions", async () => {
    mount();

    expect(await screen.findByText("Room 101")).toBeInTheDocument();
    expect(screen.getByText("Guest checked out")).toBeInTheDocument();
    expect(screen.getByText("Current state")).toBeInTheDocument();
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Mark clean/ }));

    await waitFor(() =>
        expect(mocks.update).toHaveBeenCalledWith("room-1", { status: "clean" }),
    );
});
