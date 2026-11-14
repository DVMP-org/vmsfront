"use client";

import { useQuery } from "@tanstack/react-query";

import { unwrap } from "@/lib/api-envelope";
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
