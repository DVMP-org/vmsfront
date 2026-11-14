import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicPayStep } from "./PublicPayStep";
import type { PublicBookingCreated } from "../../public-api-types";

vi.mock("../PublicBookingPayment", () => ({
    PublicBookingPayment: () => <div data-testid="payment">payment</div>,
}));

const base: PublicBookingCreated = {
    id: "booking-1",
    status: "pending_payment",
    kind: "booking",
    site_name: "Harbour Hotel",
    place_name: null,
    room_category_name: "Deluxe Super",
    rooms: 1,
    check_in_at: "2027-06-01T14:00:00Z",
    check_out_at: "2027-06-02T10:00:00Z",
    guest_count: 2,
    nights: 1,
    nightly_rate: "50000.00",
    currency: "USD",
    amount_due: "50000.00",
    payable: true,
    payment_required: true,
    hold_expires_at: "2027-05-30T18:00:00Z",
};

describe("the pay step", () => {
    it("does not let a paid-on-booking guest leave without paying", () => {
        render(<PublicPayStep siteSlug="harbour-hotel" created={base} onDone={vi.fn()} />);

        expect(
            screen.getByRole("heading", { name: /complete your booking/i }),
        ).toBeTruthy();
        expect(screen.getByTestId("payment")).toBeTruthy();
        // A booking is money now, so there is no way past this screen.
        expect(
            screen.queryByRole("button", { name: /pay later/i }),
        ).toBeNull();
        // And the guest is told how long the rooms stay theirs.
        expect(screen.getByText(/go back on sale/i)).toBeTruthy();
    });

    it("lets a reservation walk away and pay later", () => {
        const onDone = vi.fn();
        render(
            <PublicPayStep
                siteSlug="harbour-hotel"
                created={{
                    ...base,
                    kind: "reservation",
                    status: "requested",
                    payment_required: false,
                }}
                onDone={onDone}
            />,
        );

        expect(
            screen.getByRole("heading", { name: /rooms are held/i }),
        ).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /pay later/i }));
        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it("says nothing has been charged when the guest chose to reserve", () => {
        render(
            <PublicPayStep
                siteSlug="harbour-hotel"
                created={{ ...base, payment_required: false }}
                onDone={vi.fn()}
            />,
        );

        expect(screen.getByText(/Nothing has been charged/i)).toBeTruthy();
    });
});
