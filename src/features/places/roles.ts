/**
 * The place detail screen is shared by every domain, so the people who occupy a
 * Place cannot use one vocabulary. A commercial space holds a business tenant
 * or member; a residential unit holds a household; a hotel room holds a guest.
 */

export type PlaceRole = { value: string; label: string };

const residentialRoles: PlaceRole[] = [
  { value: "resident", label: "Resident" },
  { value: "owner", label: "Owner" },
  { value: "tenant", label: "Tenant" },
  { value: "household_member", label: "Household member" },
];

const commercialRoles: PlaceRole[] = [
  { value: "tenant", label: "Business tenant" },
  { value: "member", label: "Member" },
];

const hospitalityRoles: PlaceRole[] = [
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member" },
];

const mixedUseRoles: PlaceRole[] = [
  { value: "resident", label: "Resident" },
  { value: "owner", label: "Owner" },
  { value: "tenant", label: "Business tenant" },
  { value: "member", label: "Member" },
];

export function placeRolesFor(useCase?: string | null): PlaceRole[] {
  switch (useCase) {
    case "commercial":
      return commercialRoles;
    case "hospitality":
      return hospitalityRoles;
    case "mixed_use":
      return mixedUseRoles;
    default:
      return residentialRoles;
  }
}

/**
 * A household is a person. A business tenant is usually an organization, so
 * business domains may pick either kind and create a business Party inline.
 */
export function placePartyKindFor(useCase?: string | null): "person" | "any" {
  return useCase && useCase !== "residential" ? "any" : "person";
}

export type PlaceAssignmentCopy = {
  title: string;
  description: string;
  action: string;
  placeLabel: string;
  /** Label for creating a brand-new Party from the assignment form. */
  newPartyLabel: string;
  partyLabel: string;
};

export function placeAssignmentCopyFor(
  useCase?: string | null,
): PlaceAssignmentCopy {
  switch (useCase) {
    case "commercial":
      return {
        title: "Add party to this space",
        description:
          "Attach a business tenant or member Party to this commercial space, with the term it occupies it for.",
        action: "Add party",
        placeLabel: "Commercial space",
        newPartyLabel: "New business Party",
        partyLabel: "Business Party",
      };
    case "hospitality":
      return {
        title: "Add guest or member",
        description:
          "Attach a guest or member Party to this room or unit, with their stay period.",
        action: "Add party",
        placeLabel: "Room or unit",
        newPartyLabel: "New guest Party",
        partyLabel: "Party",
      };
    case "mixed_use":
      return {
        title: "Add party to this place",
        description:
          "Attach a resident, owner, business tenant or member Party to this place.",
        action: "Add party",
        placeLabel: "Place",
        newPartyLabel: "New Party",
        partyLabel: "Party",
      };
    default:
      return {
        title: "Assign resident",
        description:
          "Assign an existing person or add a new resident to this place.",
        action: "Assign relationship",
        placeLabel: "Unit",
        newPartyLabel: "New resident",
        partyLabel: "Person",
      };
  }
}
