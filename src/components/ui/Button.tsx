import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation";

  const variants = {
    primary:
      "bg-[var(--brand-primary,#1e40af)] text-primary-foreground hover:bg-[var(--brand-primary,#1e40af)] hover:opacity-90 focus-visible:ring-primary active:bg-[var(--brand-primary,#1e40af)] active:opacity-95 active:scale-[0.98]",
    secondary:
      "bg-[var(--brand-secondary,#475569)] text-secondary-foreground hover:bg-[var(--brand-secondary,#475569)] hover:opacity-90 focus-visible:ring-secondary active:bg-[var(--brand-secondary,#475569)] active:opacity-95 active:scale-[0.98]",
    outline:
      "border-2 border-[var(--brand-primary,#1e40af)] bg-white hover:bg-[var(--brand-primary,#1e40af)] hover:text-white active:bg-[var(--brand-primary,#1e40af)] active:text-white active:scale-[0.98]",
    ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98]",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive active:bg-destructive/95 active:scale-[0.98]",
  };



  const sizes = {
    sm: "h-9 min-h-[36px] px-3 text-xs xs:text-sm",
    md: "h-10 min-h-[40px] px-4 py-2 text-sm xs:text-base",
    lg: "h-11 min-h-[44px] px-6 xs:px-8 text-base xs:text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="hidden xs:inline">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

