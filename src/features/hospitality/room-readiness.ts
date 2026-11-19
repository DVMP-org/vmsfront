import type { HospitalityRoom } from "./contracts";

export type RoomIssue = {
  room: HospitalityRoom;
  reason: string;
  rank: number;
  kind: "out_of_service" | "maintenance" | "dirty" | "cleaning";
};

export function roomReadiness(rooms: HospitalityRoom[]) {
  const ready = rooms.filter(
    (room) =>
      room.status === "available" &&
      (room.housekeeping_status === "clean" ||
        room.housekeeping_status === "inspected") &&
      room.maintenance_open === 0,
  ).length;

  const issues = rooms.flatMap<RoomIssue>((room) => {
    if (room.status === "out_of_service")
      return [
        {
          room,
          reason: "Out of service",
          rank: 0,
          kind: "out_of_service" as const,
        },
      ];
    if (room.maintenance_open > 0)
      return [
        {
          room,
          reason: `${room.maintenance_open} open issue${room.maintenance_open === 1 ? "" : "s"}`,
          rank: 1,
          kind: "maintenance" as const,
        },
      ];
    if (room.housekeeping_status === "dirty")
      return [
        { room, reason: "Needs cleaning", rank: 2, kind: "dirty" as const },
      ];
    if (
      room.status === "cleaning" ||
      room.housekeeping_status === "in_progress"
    )
      return [
        {
          room,
          reason: "Cleaning in progress",
          rank: 3,
          kind: "cleaning" as const,
        },
      ];
    return [];
  });
  issues.sort(
    (left, right) =>
      left.rank - right.rank || left.room.name.localeCompare(right.room.name),
  );

  return { ready, issues };
}
