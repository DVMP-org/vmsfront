"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SlideOver } from "./SlideOver";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: "left" | "right";
  icon?: LucideIcon;
  eyebrow?: string;
  footer?: ReactNode;
}

/** The same motion, focus and scroll contract as form slideovers. */
export function Drawer({ contentClassName, className, ...props }: DrawerProps) {
  return (
    <SlideOver
      {...props}
      size="custom"
      className={cn("max-w-xl", className)}
      bodyClassName={contentClassName}
      closeLabel="Close drawer"
      initialFocusSelector="input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
    />
  );
}
