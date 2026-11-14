"use client";

import { useQuery } from "@tanstack/react-query";

import { unwrap } from "@/lib/api-envelope";
import { placeGroupsApi } from "@/features/place-groups/api";
import { hospitalityApi } from "./api";
import { hospitalityService } from "./service";

export const hospitalityRoomKeys = {
  all: ["hospitality", "rooms"] as const,
};

/** Rooms that may be offered when a reservation needs one. */
export function useHospitalityRooms(enabled = true) {
  return useQuery({
    queryKey: hospitalityRoomKeys.all,
    queryFn: async () => unwrap(await hospitalityService.listRooms()),
    enabled,
  });
}

export const hospitalityAmenityKeys = {
  all: ["hospitality", "amenities"] as const,
};

/**
 * The amenity vocabulary, straight from the server.
 *
 * Cached hard: it is a fixed catalogue that changes only with a deploy, and the
 * room editor should never wait on it twice.
 */
export function useHospitalityAmenities() {
  return useQuery({
    queryKey: hospitalityAmenityKeys.all,
    queryFn: () => hospitalityApi.amenities.list(),
    staleTime: Infinity,
  });
}

export const roomCategoryKeys = {
  all: ["hospitality", "room-categories"] as const,
};

/**
 * The Site's Place groups, presented as room categories.
 *
 * A category *is* a Place group — the generic grouping the Site already has —
 * so this reuses that transport rather than inventing a second endpoint that
 * would drift from it. `staleTime` is short because the room form reads this to
 * populate its picker, and a category created a moment ago has to appear.
 */
export function useRoomCategories(enabled = true) {
  return useQuery({
    queryKey: roomCategoryKeys.all,
    queryFn: () => placeGroupsApi.list(),
    enabled,
    staleTime: 30_000,
  });
}
