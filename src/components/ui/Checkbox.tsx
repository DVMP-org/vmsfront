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
            "mt-0.5 h-4 w-4 rounded border-gray-300 bg-gray-500 text-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-300",
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
