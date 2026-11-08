import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface VmsMarkProps {
  className?: string;
  size?: number;
}

export function VmsMark({ className, size = 30 }: VmsMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <rect width="32" height="32" rx="7" fill="var(--vms-coral, #E85D3F)" />
      <path
        d="M8 9.5 15.9 24 23.8 9.5"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5h7.7"
        stroke="white"
        strokeOpacity=".55"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="24.2" cy="8.4" r="2.2" fill="white" />
    </svg>
  );
}

export interface VmsWordmarkProps {
  className?: string;
  markClassName?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
}

const wordmarkSizes = {
  sm: { mark: 24, text: "text-[15px]" },
  md: { mark: 30, text: "text-[18px]" },
  lg: { mark: 42, text: "text-[26px]" },
};

export function VmsWordmark({
  className,
  markClassName,
  color,
  size = "md",
  compact = false,
}: VmsWordmarkProps) {
  const dimensions = wordmarkSizes[size];
  const style = color ? ({ color } as CSSProperties) : undefined;

  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
      style={style}
    >
      <VmsMark
        size={dimensions.mark}
        className={cn(
          "rounded-[7px] shadow-[0_1px_0_rgba(255,255,255,.16)_inset]",
          markClassName,
        )}
      />
      {!compact ? (
        <span
          className={cn(
            "whitespace-nowrap font-semibold tracking-[-0.045em]",
            dimensions.text,
          )}
        >
          VMS{" "}
          <span className="font-normal tracking-[-0.03em] opacity-75">
            Core
          </span>
        </span>
      ) : null}
    </span>
  );
}
