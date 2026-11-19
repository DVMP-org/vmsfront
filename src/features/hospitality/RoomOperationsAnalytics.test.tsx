import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import type {
  HospitalityRoom,
  HousekeepingStatus,
  RoomOperationalStatus,
} from "./contracts";
import { RoomOperationsAnalytics } from "./RoomOperationsAnalytics";
import { RoomReadinessPanel } from "./RoomReadinessPanel";

function room(
  id: string,
  status: RoomOperationalStatus,
  housekeeping_status: HousekeepingStatus,
  maintenance_open = 0,
): HospitalityRoom {
  return {
    id,
    name: `Room ${id}`,
    room_number: id,
    room_type: "standard",
    place_group_id: null,
    place_group_name: null,
    floor: null,
    capacity: 2,
    base_rate: "10000",
    currency: "NGN",
    amenities: [],
    status,
    housekeeping_status,
    current_stay_id: null,
    current_guest_name: null,
    next_arrival: null,
    next_guest_name: null,
    maintenance_open,
    updated_at: "2027-01-01T00:00:00Z",
  };
}

it("shows Site room distribution and subtle, labelled issue states", () => {
  const rooms = [
    room("1", "available", "clean"),
    room("2", "available", "dirty"),
    room("3", "out_of_service", "dirty", 1),
    room("4", "cleaning", "in_progress"),
  ];
  render(
    <>
      <RoomReadinessPanel
        rooms={rooms}
        isLoading={false}
        error={null}
        onRetry={() => {}}
      />
      <RoomOperationsAnalytics
        rooms={rooms}
        isLoading={false}
        error={null}
        onRetry={() => {}}
      />
    </>,
  );

  const inventory = screen.getByRole("table", { name: /Inventory by state/ });
  expect(
    within(inventory).getByRole("row", { name: /Available.*2/ }),
  ).toBeInTheDocument();
  expect(
    within(inventory).getByRole("row", { name: /Out of service.*1/ }),
  ).toBeInTheDocument();
  const housekeeping = screen.getByRole("table", {
    name: /Housekeeping pipeline/,
  });
  expect(
    within(housekeeping).getByRole("row", { name: /Dirty.*2/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("1 of 4 rooms ready for assignment · 3 requiring work"),
  ).toBeInTheDocument();

  const readiness = screen.getByRole("region", { name: "Room readiness" });
  expect(within(readiness).getByText("Out of service")).toHaveClass(
    "bg-[var(--vms-danger-subtle)]",
  );
  expect(within(readiness).getByText("Needs cleaning")).toHaveClass(
    "bg-[var(--vms-warning-subtle)]",
  );
  expect(within(readiness).getByText("Cleaning in progress")).toHaveClass(
    "bg-[color-mix(in_srgb,var(--vms-info)_10%,white)]",
  );
});
