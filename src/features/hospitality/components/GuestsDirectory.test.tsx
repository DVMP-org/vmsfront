import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { GuestsDirectory } from "./GuestsDirectory";

const guest = {
    party_id: "party-1",
    display_name: "Ada Guest",
    email: "ada@example.test",
    phone: "+234 800 000 0000",
    is_active: true,
    stays_count: 2,
    stay_id: "stay-1",
    stay_status: "checked_in" as const,
    planned_check_in: "2027-01-02T15:00:00Z",
    planned_check_out: "2027-01-04T11:00:00Z",
    actual_check_in: "2027-01-02T15:10:00Z",
    actual_check_out: null,
};

vi.mock("../queries", () => ({
    useHospitalityGuests: () => ({
        data: { items: [guest], total: 1, page: 1, page_size: 20, total_pages: 1 },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
    }),
    useHospitalityGuest: () => ({ data: null, isPending: true, isError: false }),
    useResendGuestOnboarding: () => ({ mutate: vi.fn(), isPending: false }),
}));

it("lists one row per guest with their stay state and contact", () => {
    render(<GuestsDirectory />);

    expect(screen.getByRole("heading", { name: "Guests" })).toBeInTheDocument();
    expect(screen.getAllByText("Ada Guest").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ada@example.test").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Checked in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 stays").length).toBeGreaterThan(0);
});
