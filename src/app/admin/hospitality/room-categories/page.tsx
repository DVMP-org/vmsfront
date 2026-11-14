"use client";

import { HospitalityAdminPage } from "@/features/hospitality/HospitalityAdminPage";
import { RoomCategoriesWorkspace } from "@/features/hospitality/components/RoomCategoriesWorkspace";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";
import { useSiteAccess } from "@/features/context/use-site-access";

/**
 * What a hospitality Site sells, as categories rather than as rooms.
 *
 * This is the hospitality view of Place groups. The generic page exists and
 * still serves grouping for charges and policies; this one speaks the language of
 * a hotel, where a group is a room category and its job is to be attached to
 * rooms and priced against.
 */
export default function HospitalityRoomCategoriesPage() {
  const access = useHospitalityAccess();
  const siteAccess = useSiteAccess();
  const canManage = siteAccess.allowed([
    "place_groups.create",
    "place_groups.update",
  ]);

  return (
    <HospitalityAdminPage
      access={access}
      title="Room categories"
      description="The types of room this Site sells. Guests book a category; a room is assigned later."
    >
      <RoomCategoriesWorkspace canManage={canManage} />
    </HospitalityAdminPage>
  );
}
