"use client";

import Image from "next/image";
import { useState } from "react";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function PropertyImage({
  name,
  src,
  wide = false,
  className,
}: {
  name: string;
  src?: string | null;
  wide?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[linear-gradient(145deg,var(--vms-surface-subtle),color-mix(in_srgb,var(--vms-info)_8%,white))] text-[var(--vms-ink-muted)]",
        wide ? "aspect-[16/9] w-full" : "h-11 w-14",
        className,
      )}
      role={src && !failed ? undefined : "img"}
      aria-label={src && !failed ? undefined : name}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes={wide ? "(min-width: 768px) 33vw, 100vw" : "56px"}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <>
          <Building2
            className={cn(wide ? "h-10 w-10" : "h-5 w-5")}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-1.5 h-1 rounded-full bg-[color-mix(in_srgb,var(--vms-ink-muted)_20%,transparent)]"
          />
        </>
      )}
    </span>
  );
}
