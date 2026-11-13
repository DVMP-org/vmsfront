import { describe, expect, it } from "vitest";

import { buildOccupancy } from "./lib";

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
