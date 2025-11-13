import React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className="flex items-start gap-2 xs:gap-3 text-xs xs:text-sm text-foreground cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "mt-0.5 xs:mt-1 h-4 w-4 min-h-[20px] min-w-[20px] rounded border border-input text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
            className
          )}
          {...props}
        />
        <span className="flex-1">
          {label && <span className="font-medium">{label}</span>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
