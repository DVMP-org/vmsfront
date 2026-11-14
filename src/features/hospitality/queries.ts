"use client";

import { useQuery } from "@tanstack/react-query";

import { unwrap } from "@/lib/api-envelope";
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
