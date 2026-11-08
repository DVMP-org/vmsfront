import { VmsWordmark } from "@/components/brand/VmsBrand";

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Compatibility facade for existing brand placements. New UI should use
 * VmsWordmark directly so the mark and label stay in one atomic component.
 */
export function LogoFull({ height = 32, color, className }: LogoProps) {
  return (
    <VmsWordmark
      color={color}
      className={className}
      size={height >= 40 ? "lg" : height <= 28 ? "sm" : "md"}
    />
  );
}
