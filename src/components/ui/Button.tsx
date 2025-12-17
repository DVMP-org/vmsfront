// const variants = {
//   primary:
//     "bg-[var(--brand-primary,#1e40af)] text-primary-foreground hover:bg-[var(--brand-primary,#1e40af)] hover:opacity-90 focus-visible:ring-primary active:bg-[var(--brand-primary,#1e40af)] active:opacity-95 active:scale-[0.98]",
//   secondary:
//     "bg-[var(--brand-secondary,#475569)] text-secondary-foreground hover:bg-[var(--brand-secondary,#475569)] hover:opacity-90 focus-visible:ring-secondary active:bg-[var(--brand-secondary,#475569)] active:opacity-95 active:scale-[0.98]",
//   outline:
//     "border-2 border-[var(--brand-primary,#1e40af)] bg-white hover:bg-[var(--brand-primary,#1e40af)] hover:text-white active:bg-[var(--brand-primary,#1e40af)] active:text-white active:scale-[0.98]",
//   ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98]",
//   destructive:
//     "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive active:bg-destructive/95 active:scale-[0.98]",
// };

// const sizes = {
//   sm: "h-9 min-h-[36px] px-3 text-xs xs:text-sm",
//   md: "h-10 min-h-[40px] px-4 py-2 text-sm xs:text-base",
//   lg: "h-11 min-h-[44px] px-6 xs:px-8 text-base xs:text-lg",
// };

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader } from "./loader";
import { ButtonHTMLAttributes } from "react";
import { DetailedHTMLProps } from "react";

const buttonVariants = cva(
  "overflow-hidden isolate inline-flex h-fit items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background dark:ring-offset-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:!pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--brand-primary,#1e40af)] bg-[var(--brand-primary,#1e40af)] disabled:bg-[var(--brand-primary,#1e40af)]/70 text-white font-bold border-2",
        // "border-primary bg-primary disabled:bg-primary/70 text-white font-bold",
        destructive:
          "border-red-600 bg-red-600 disabled:bg-red-600/70 text-white font-bold",
        // secondary: "!border-0 bg-transparent text-primary disabled:opacity-60",
        secondary:
          "bg-[var(--brand-secondary,#475569)] text-secondary-foreground hover:bg-[var(--brand-secondary,#475569)] hover:opacity-90 focus-visible:ring-secondary active:bg-[var(--brand-secondary,#475569)] active:opacity-95 active:scale-[0.98]",
        // outline: "border border-primary text-primary disabled:opacity-60",
        // "destructive-outlined":
        outline:
          "border-2 border-[var(--brand-primary,#1e40af)] bg-white hover:bg-[var(--brand-primary,#1e40af)] hover:text-white active:bg-[var(--brand-primary,#1e40af)] active:text-white active:scale-[0.98]",
        "destructive-outlined":
          "border border-red-600 text-red-600 disabled:opacity-60",
        "light-outlined": "border-white text-white disabled:opacity-60",
        "dark-text":
          "border-transparent bg-transparent hover:bg-opacity-70 disabled:bg-opacity-70  text-black font-medium",
        light:
          "border-white bg-white hover:bg-opacity-70 disabled:bg-opacity-70  text-primary font-semibold",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
      },
      size: {
        // lg: "h-15 px-8 items-center",
        // sm: "h-10 px-3.5 items-center text-sm",
        default:
          "py-[0.625rem] px-[1.5rem] text-[0.875rem] leading-[1.25rem] font-medium rounded-sm",
        sm: "py-[0.375rem] px-[1rem]  leading-[1rem] font-normal text-sm rounded-sm",
        lg: "py-[0.75rem] px-[1.5rem] text-[1rem] leading-[1.5rem] font-medium rounded-sm",
        md: "py-[0.625rem] px-[1.5rem] text-[0.875rem] leading-[1.25rem] font-medium rounded-sm",
        "icon-sm":
          "h-[1.75rem] w-[1.75rem] flex justify-center items-center font-medium rounded-sm",
        icon: "h-[2.5rem] w-[2.75rem] flex justify-center items-center font-medium rounded-sm",
        "icon-lg":
          "h-[3rem] w-[3rem] flex justify-center items-center font-medium rounded-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export interface ButtonProps
  // extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  extends DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
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
      leftNode,
      rightNode,
      LoaderSize,
      // ref,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : "button";

    const { children, disabled, ...rest } = props;
    const reference = React.useRef<HTMLButtonElement>(null);

    return (
      <Component
        className={cn(buttonVariants({ variant, size, className }))}
        ref={reference || ref}
        disabled={disabled || isLoading}
        {...rest}
        children={
          <div className="flex font-medium justify-center items-center gap-2">
            {/* {leftNode}
        {children}
        {rightNode}
        {isLoading && <Loader />} */}

            {isLoading ? (
              <>
                <span className="mx-auto">
                  <Loader size={LoaderSize} colour="secondary" />
                </span>
              </>
            ) : (
              <>
                {leftNode}
                {children}
                {rightNode}
              </>
            )}
          </div>
        }
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
