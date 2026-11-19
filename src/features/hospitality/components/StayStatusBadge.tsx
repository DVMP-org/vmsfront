import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { statusLabel, type StayStatus } from "../contracts";

const tones: Record<StayStatus, StatusTone> = {
  reserved: "warning",
  checked_in: "success",
  checked_out: "neutral",
  cancelled: "danger",
  no_show: "danger",
};

export function StayStatusBadge({ status }: { status: StayStatus }) {
  return <StatusBadge tone={tones[status]}>{statusLabel(status)}</StatusBadge>;
}
