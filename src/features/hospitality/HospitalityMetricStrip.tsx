import { BedDouble, CalendarClock, CircleAlert, DoorOpen } from "lucide-react";
import { MetricStrip } from "@/features/dashboard/MetricStrip";
import type { HospitalityRoom } from "./contracts";
import { roomReadiness } from "./room-readiness";

export function HospitalityMetricStrip({
  rooms,
  reservedCount,
  checkedInCount,
  arrivalsToday,
  departuresToday,
  dailyFlowLoading,
  dailyFlowError,
  roomsLoading,
  roomsError,
  staysLoading,
  staysError,
  checkedInLoading,
  checkedInError,
}: {
  rooms: HospitalityRoom[];
  reservedCount: number;
  checkedInCount: number;
  arrivalsToday: number;
  departuresToday: number;
  dailyFlowLoading: boolean;
  dailyFlowError: boolean;
  roomsLoading: boolean;
  roomsError: boolean;
  staysLoading: boolean;
  staysError: boolean;
  checkedInLoading: boolean;
  checkedInError: boolean;
}) {
  const roomState = roomsLoading ? "loading" : roomsError ? "error" : "ready";
  const readiness = roomReadiness(rooms);
  return (
    <MetricStrip
      label="Hospitality operating summary"
      metrics={[
        {
          icon: CalendarClock,
          label: "Reserved stays",
          value: reservedCount,
          detail: "Awaiting arrival review at this Site",
          href: "#stays",
          state: staysLoading ? "loading" : staysError ? "error" : "ready",
        },
        {
          icon: BedDouble,
          label: "Checked in",
          value: checkedInCount,
          detail: "Active guest stays at this Site",
          href: "#stays",
          state: checkedInLoading
            ? "loading"
            : checkedInError
              ? "error"
              : "ready",
        },
        {
          icon: CalendarClock,
          label: "Arrivals today",
          value: arrivalsToday,
          detail: "Reserved stays due to check in today",
          state: dailyFlowLoading
            ? "loading"
            : dailyFlowError
              ? "error"
              : "ready",
        },
        {
          icon: DoorOpen,
          label: "Departures today",
          value: departuresToday,
          detail: "Checked-in stays due to check out today",
          state: dailyFlowLoading
            ? "loading"
            : dailyFlowError
              ? "error"
              : "ready",
        },
        {
          icon: DoorOpen,
          label: "Ready rooms",
          value: readiness.ready,
          detail: "Available, clean and without open issues",
          hint: "Rooms that are available, clean or inspected, and have no open maintenance request.",
          href: "/admin/hospitality/rooms",
          state: roomState,
        },
        {
          icon: CircleAlert,
          label: "Rooms needing work",
          value: readiness.issues.length,
          detail: "Cleaning, maintenance or out of service",
          hint: "Rooms that are dirty or in progress, out of service, or have open maintenance.",
          href: "/admin/hospitality/rooms",
          state: roomState,
        },
      ]}
    />
  );
}
