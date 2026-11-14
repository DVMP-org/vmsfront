"use client";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatDate } from "@/lib/datetime";
import { PublicRoomCategoryCard } from "./PublicRoomCategoryCard";
import type { PublicRoomCategory } from "../../public-api-types";

/**
 * Screen 2: what the Site can sell for the dates the guest chose.
 *
 * Categories, not rooms. An empty result is a real answer — the property is full
 * — so it is said plainly rather than dressed up as a loading state.
 */
export function PublicCategoryChooser({
  categories,
  nights,
  checkInAt,
  checkOutAt,
  isLoading,
  error,
  onBack,
  onChoose,
}: {
  categories: PublicRoomCategory[];
  nights: number;
  checkInAt: string;
  checkOutAt: string;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onChoose: (category: PublicRoomCategory, rooms: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--vms-ink)]">
          {formatDate(checkInAt)} → {formatDate(checkOutAt)} · {nights}{" "}
          {nights === 1 ? "night" : "nights"}
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          Change dates
        </Button>
      </div>

      {isLoading ? (
        <PanelState
          kind="loading"
          title="Checking availability"
          description="Looking at what is free for those dates."
        />
      ) : error ? (
        <PanelState
          kind="error"
          title="Availability could not be checked"
          description={error}
          onRetry={onBack}
          retryLabel="Change dates"
        />
      ) : categories.length === 0 ? (
        <PanelState
          kind="empty"
          title="Nothing available for those dates"
          description="Try a different window, or shorter stay."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category) => (
            <PublicRoomCategoryCard
              key={category.id}
              category={category}
              nights={nights}
              onChoose={(rooms) => onChoose(category, rooms)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
