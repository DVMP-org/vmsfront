"use client";

import Image from "next/image";
import { useState } from "react";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarTone = "ink" | "coral" | "info" | "success" | "warning";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
};

const toneClasses: Record<AvatarTone, string> = {
  ink: "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
  coral: "bg-[var(--vms-coral-soft)] text-[var(--vms-focus)]",
  info: "bg-[color-mix(in_srgb,var(--vms-info)_10%,white)] text-[var(--vms-info)]",
  success: "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]",
  warning: "bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]",
};

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
  decorative?: boolean;
}

export function Avatar({
  name,
  src,
  size = "md",
  tone = "ink",
  className,
  decorative = false,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--vms-line)] font-semibold",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      role={decorative ? undefined : "img"}
    >
      {src && !imageFailed ? (
        <Image
          src={src}
          alt=""
          width={56}
          height={56}
          unoptimized
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound
          className={size === "lg" ? "h-6 w-6" : "h-4 w-4"}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
