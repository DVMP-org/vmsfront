import { describe, expect, it } from "vitest";

import { descendantIds, flattenPlaces } from "./api";

const tree = [
  {
    id: "site",
    parent_id: null,
    name: "Harbour Residences",
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
        name: "Block A",
        kind: "building",
        building_type: "apartment_block",
        description: null,
        address: "1 Harbour Way",
        is_active: true,
        updated_at: "2026-11-09T00:00:00Z",
        children: [
          {
            id: "unit",
            parent_id: "building",
            name: "Unit A1",
            kind: "unit",
            building_type: "apartment",
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

describe("residential place scope", () => {
  it("flattens the canonical hierarchy for registers and facets", () => {
    expect(flattenPlaces([...tree]).map((place) => place.id)).toEqual([
      "site",
      "building",
      "unit",
    ]);
  });

  it("limits residential records to the selected property subtree", () => {
    expect([...descendantIds([...tree], "building")]).toEqual([
      "building",
      "unit",
    ]);
    expect([...descendantIds([...tree], "missing")]).toEqual([]);
  });
});
