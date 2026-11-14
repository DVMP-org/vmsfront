/**
 * Transport for the hospitality room directory.
 *
 * The booking register needs one thing from this module today: which rooms may
 * be assigned to a reservation. Rooms live under hospitality, so the call does
 * too — the bookings feature should not grow a second copy of the rooms endpoint.
 *
 * Returns the API envelope; the query hook unwraps it.
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/** The subset of the room payload a picker needs. */
export interface AssignableRoom {
  id: string;
  name: string;
  room_number: string | null;
  status: string;
  /**
   * The Place group the room is sold as. A picker does not need it, but the
   * categories page totals rooms per category from this same list rather than
   * asking the server for a count that would then have to be kept in step.
   */
  place_group_id: string | null;
}

export const hospitalityService = {
  async listRooms(): Promise<ApiResponse<AssignableRoom[]>> {
    return apiClient.get("/admin/hospitality/rooms");
  },
};
