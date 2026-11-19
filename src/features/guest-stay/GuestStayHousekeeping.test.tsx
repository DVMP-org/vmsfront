import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { guestStayApi } from "./api";
import { GuestStayHousekeeping } from "./GuestStayHousekeeping";

vi.mock("./api", () => ({
    guestStayApi: {
        housekeeping: vi.fn(),
        setHousekeeping: vi.fn(),
    },
}));

function mount() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <GuestStayHousekeeping stayId="stay" roomName="Suite 402" />
        </QueryClientProvider>,
    );
}

const room = {
    stay_id: "stay",
    room_id: "room",
    room_name: "Suite 402",
    status: "clean" as const,
    updated_at: "2027-04-05T15:00:00Z",
};

beforeEach(() => {
    vi.clearAllMocks();
});

it("shows the room state and lets the guest request cleaning", async () => {
    vi.mocked(guestStayApi.housekeeping).mockResolvedValue(room);
    vi.mocked(guestStayApi.setHousekeeping).mockResolvedValue({
        ...room,
        status: "dirty",
    });
    mount();

    expect(await screen.findByText("No request active")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Request cleaning" }));

    await waitFor(() => {
        expect(guestStayApi.setHousekeeping).toHaveBeenCalledWith("stay", "dirty");
    });
    expect(await screen.findByText("Cleaning requested")).toBeInTheDocument();
});

it("does not offer a second request once housekeeping is on the way", async () => {
    vi.mocked(guestStayApi.housekeeping).mockResolvedValue({
        ...room,
        status: "dirty",
    });
    mount();

    expect(await screen.findByText("Cleaning requested")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request cleaning" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "No service needed" })).toBeEnabled();
});

it("says the room is being serviced instead of offering an action", async () => {
    vi.mocked(guestStayApi.housekeeping).mockResolvedValue({
        ...room,
        status: "in_progress",
    });
    mount();

    expect(await screen.findByText("Housekeeping in progress")).toBeInTheDocument();
    expect(
        screen.queryByRole("button", { name: "Request cleaning" }),
    ).not.toBeInTheDocument();
});
