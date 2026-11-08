import React from "react";

import * as LabelPrimitive from "@radix-ui/react-label";
import { Label } from ".";
import { cn } from "@/lib/utils";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    showAsterisk?: boolean;
    error?: string;
    formItemId?: string;
  }
>(({ className, children, showAsterisk, error, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn(error && "text-red-500", className)}
      {...props}
    >
      {showAsterisk ? (
        <span>
          {children}
          <span aria-hidden="true" className="ml-0.5 text-[var(--vms-danger)]">
            *
          </span>
          <span className="sr-only"> (required)</span>
        </span>
      ) : (
        children
      )}
    </Label>
  );
});

FormLabel.displayName = "FormLabel";

export { FormLabel };
