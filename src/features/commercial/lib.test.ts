import { describe, expect, it } from "vitest";

import type { Place } from "@/features/places/api";

import {
  ageingBucket,
  ageingTotals,
  buildInventoryRows,
  buildOccupancy,
  buildRentRoll,
  defaultExpandedInventoryIds,
  flattenInventoryRows,
} from "./lib";

const places = [
  { id: "tower", name: "Harbour Tower" },
  { id: "annex", name: "Annex" },
  { id: "shop-1", name: "Corner Shop" },
  { id: "office-9", name: "Office 9" },
];

const inventory = [
  { id: "suite-1", name: "Suite 1", parent_id: "tower" },
  { id: "suite-2", name: "Suite 2", parent_id: "tower" },
  { id: "suite-3", name: "Suite 3", parent_id: "annex" },
  { id: "shop-1", name: "Corner Shop", parent_id: null },
  { id: "office-9", name: "Office 9", parent_id: null },
];

describe("commercial occupancy grouping", () => {
  it("groups spaces under their building", () => {
    const rows = buildOccupancy(inventory, places, [
      { place: { id: "suite-1" } },
    ]);
    const tower = rows.find((row) => row.label === "Harbour Tower");
    expect(tower).toMatchObject({ total: 2, occupied: 1, standalone: false });
  });

  it("shows a space without a building as its own row", () => {
    const rows = buildOccupancy(inventory, places, [
      { place: { id: "shop-1" } },
    ]);
    const standalone = rows.filter((row) => row.standalone);
    expect(standalone.map((row) => row.label).sort()).toEqual([
      "Corner Shop",
      "Office 9",
    ]);
    expect(
      standalone.find((row) => row.label === "Corner Shop"),
    ).toMatchObject({ total: 1, occupied: 1 });
    expect(rows.some((row) => row.label === "Unassigned")).toBe(false);
  });

  it("lists buildings before standalone places", () => {
    const rows = buildOccupancy(inventory, places, []);
    expect(rows.map((row) => row.standalone)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });
});

const today = new Date("2026-11-13T09:00:00Z");

const relationship = (
  overrides: Partial<{
    role: string;
    status: string;
    effective_from: string;
    effective_to: string | null;
    tenant: string;
    placeId: string;
  }> = {},
) => ({
  role: overrides.role ?? "tenant",
  status: overrides.status ?? "active",
  effective_from: overrides.effective_from ?? "2026-01-01T00:00:00Z",
  effective_to: overrides.effective_to ?? "2027-01-01T00:00:00Z",
  party: { display_name: overrides.tenant ?? "Acme Studio" },
  place: { id: overrides.placeId ?? "suite-1" },
});

const assignment = (placeId: string, outstanding: number, due?: string) => ({
  target_place: { id: placeId },
  outstanding_amount: outstanding.toFixed(2),
  next_due_date: due ?? null,
});

describe("commercial rent roll", () => {
  it("ages an unpaid charge from its next due date", () => {
    expect(ageingBucket(null, today)).toBe("current");
    expect(ageingBucket("2026-12-01", today)).toBe("current");
    expect(ageingBucket("2026-11-01", today)).toBe("1_30");
    expect(ageingBucket("2026-10-01", today)).toBe("31_60");
    expect(ageingBucket("2026-09-01", today)).toBe("61_90");
    expect(ageingBucket("2026-06-01", today)).toBe("90_plus");
  });

  it("pairs a space with its live tenant, balance and oldest due date", () => {
    const rows = buildRentRoll(
      inventory,
      [relationship()],
      [
        assignment("suite-1", 500, "2026-10-01"),
        assignment("suite-1", 250, "2026-08-01"),
        assignment("suite-1", 0, "2026-01-01"),
      ],
      today,
    );
    expect(rows).toEqual([
      {
        id: "suite-1",
        space: "Suite 1",
        tenant: "Acme Studio",
        lease_ends_at: "2027-01-01T00:00:00Z",
        balance: 750,
        oldest_due: "2026-08-01",
        bucket: "90_plus",
      },
    ]);
  });

  it("keeps arrears for a space whose tenant has left", () => {
    const rows = buildRentRoll(
      inventory,
      [relationship({ placeId: "suite-1" })],
      [assignment("suite-2", 300, "2026-11-05")],
      today,
    );
    const former = rows.find((row) => row.id === "suite-2");
    expect(former).toMatchObject({ tenant: null, balance: 300, bucket: "1_30" });
  });

  it("ignores ended and non-business relationships, and sorts by balance", () => {
    const rows = buildRentRoll(
      inventory,
      [
        relationship({ placeId: "suite-3", status: "ended" }),
        relationship({ placeId: "office-9", role: "owner" }),
        relationship({ placeId: "suite-1" }),
      ],
      [assignment("suite-3", 100), assignment("suite-1", 900)],
      today,
    );
    expect(rows.map((row) => row.id)).toEqual(["suite-1", "suite-3"]);
    expect(rows[1]).toMatchObject({ tenant: null, balance: 100 });
  });

  it("totals outstanding money per ageing bucket", () => {
    const rows = buildRentRoll(
      inventory,
      [relationship()],
      [
        assignment("suite-1", 750, "2026-08-01"),
        assignment("suite-2", 300, "2026-11-05"),
        assignment("suite-3", 50),
      ],
      today,
    );
    const totals = ageingTotals(rows);
    expect(totals.find((bucket) => bucket.key === "90_plus")?.amount).toBe(750);
    expect(totals.find((bucket) => bucket.key === "1_30")?.amount).toBe(300);
    expect(totals.find((bucket) => bucket.key === "current")?.amount).toBe(50);
  });
});

const place = (
  overrides: Partial<Place> & { id: string; name: string },
): Place => ({
  site_id: "site",
  parent_id: null,
  kind: "unit",
  building_type: "office",
  description: null,
  address: "",
  is_active: true,
  updated_at: "2026-11-09T00:00:00Z",
  ...overrides,
});

const tower = place({
  id: "tower",
  name: "Harbour Tower",
  kind: "building",
  building_type: "building",
});
const suite4a = place({ id: "suite-4a", name: "Suite 4A", parent_id: "tower" });
const suite2b = place({ id: "suite-2b", name: "Suite 2B", parent_id: "tower" });
const kiosk = place({ id: "kiosk", name: "Kiosk 1" });
const inventoryPlaces = [tower, suite4a, suite2b, kiosk];

const inventoryRows = buildInventoryRows(
  inventoryPlaces,
  inventoryPlaces,
  [{ party: { display_name: "Acme Studio" }, place: { id: "suite-4a" } }],
);

describe("commercial inventory hierarchy", () => {
  it("marks a building as a container and locates the spaces it holds", () => {
    const building = inventoryRows.find((row) => row.id === "tower");
    expect(building).toMatchObject({
      is_container: true,
      occupancy: "container",
      location: "Top level of this Site",
    });

    const suite = inventoryRows.find((row) => row.id === "suite-4a");
    expect(suite).toMatchObject({
      is_container: false,
      occupancy: "occupied",
      occupants: "Acme Studio",
      location: "Harbour Tower",
    });
  });

  it("puts the building at the top level with its spaces underneath", () => {
    const rows = flattenInventoryRows(
      inventoryRows,
      defaultExpandedInventoryIds(inventoryRows),
    );
    expect(rows.map((row) => [row.name, row.depth])).toEqual([
      ["Harbour Tower", 0],
      ["Suite 2B", 1],
      ["Suite 4A", 1],
      ["Kiosk 1", 0],
    ]);
    expect(rows[0]).toMatchObject({ has_children: true, child_count: 2 });
  });

  it("hides the spaces of a collapsed building", () => {
    const rows = flattenInventoryRows(inventoryRows, new Set());
    expect(rows.map((row) => row.name)).toEqual(["Harbour Tower", "Kiosk 1"]);
  });

  it("keeps a space whose building is outside the scope at the top level", () => {
    const scoped = buildInventoryRows([suite4a], inventoryPlaces, []);
    const rows = flattenInventoryRows(scoped, new Set());
    expect(rows).toEqual([
      expect.objectContaining({ id: "suite-4a", depth: 0, has_children: false }),
    ]);
  });
});
