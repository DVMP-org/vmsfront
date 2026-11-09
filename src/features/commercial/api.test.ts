import { describe, expect, it } from "vitest";

import { descendantIds, flattenPlaces, isCommercialInventory } from "./api";

const tree = [
  {
    id: "site",
    parent_id: null,
    name: "Harbour Offices",
    kind: "site",
    building_type: null,
    description: null,
    address: "1 Harbour Way",
    is_active: true,
    updated_at: "2026-11-09T00:00:00Z",
    children: [
      {
        id: "building",
        parent_id: "site",
        name: "Tower",
        kind: "building",
        building_type: "office",
        description: null,
        address: "1 Harbour Way",
        is_active: true,
        updated_at: "2026-11-09T00:00:00Z",
        children: [
          {
            id: "shop",
            parent_id: "building",
            name: "Shop 2",
            kind: "unit",
            building_type: "shop",
            description: null,
            address: "1 Harbour Way",
            is_active: true,
            updated_at: "2026-11-09T00:00:00Z",
            children: [],
          },
        ],
      },
    ],
  },
] as const;

describe("commercial place scope", () => {
  it("flattens and limits records to the selected property subtree", () => {
    expect(flattenPlaces([...tree]).map((place) => place.id)).toEqual([
      "site",
      "building",
      "shop",
    ]);
    expect([...descendantIds([...tree], "building")]).toEqual([
      "building",
      "shop",
    ]);
  });

  it("recognizes commercial space types only", () => {
    expect(isCommercialInventory(tree[0].children[0].children[0])).toBe(true);
    expect(isCommercialInventory(tree[0].children[0])).toBe(false);
  });
});
