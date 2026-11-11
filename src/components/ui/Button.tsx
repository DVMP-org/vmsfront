"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader } from "./loader";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--vms-radius-control)] border text-sm font-semibold",
    "transition-[background-color,border-color,color,box-shadow] duration-[var(--vms-motion)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)] hover:border-[var(--vms-action-hover)] hover:bg-[var(--vms-action-hover)]",
        secondary:
          "border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] hover:border-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
        outline:
          "border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] hover:border-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]",
        ghost:
          "border-transparent bg-transparent text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]",
        destructive:
          "border-[var(--vms-danger)] bg-[var(--vms-danger)] text-white hover:border-[#8f1b12] hover:bg-[#8f1b12]",
        "destructive-outlined":
          "border-[var(--vms-danger)] bg-[var(--vms-surface)] text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)]",
        "light-outlined":
          "border-white/70 bg-transparent text-white hover:bg-white/10",
        "dark-text":
          "border-transparent bg-transparent text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]",
        light:
          "border-white bg-white text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]",
      },
      size: {
        sm: "h-8 min-w-8 px-3 text-xs [@media(pointer:coarse)]:min-h-11",
        default:
          "h-[var(--vms-control-height)] min-w-[var(--vms-control-height)] px-4 text-sm [@media(pointer:coarse)]:min-h-11",
        md: "h-10 min-w-10 px-4 text-sm [@media(pointer:coarse)]:min-h-11",
        lg: "h-[var(--vms-control-height-touch)] min-w-[var(--vms-control-height-touch)] px-5 text-base",
        "icon-sm":
          "h-8 w-8 min-w-8 p-0 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
        icon:
          "h-10 w-10 min-w-10 p-0 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
        "icon-lg": "h-11 w-11 min-w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  LoaderSize?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size,
      asChild = false,
      isLoading = false,
      loadingLabel = "Working…",
      leftNode,
      rightNode,
      LoaderSize = 16,
      children,
      disabled,
      type,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    const content = isLoading ? (
      <>
        <Loader size={LoaderSize} colour="current" />
        <span>{children || loadingLabel}</span>
      </>
    ) : (
      <>
        {leftNode}
        {children}
        {rightNode}
      </>
    );

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type || "button"}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || isLoading}
        aria-busy={isLoading || undefined}
        aria-disabled={asChild && (disabled || isLoading) ? true : undefined}
        {...props}
      >
        {asChild ? children : content}
      </Component>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
