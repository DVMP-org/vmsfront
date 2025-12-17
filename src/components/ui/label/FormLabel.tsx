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
        <p>
          {children}
          <span className="text-red-500">*</span>
        </p>
      ) : (
        children
      )}
    </Label>
  );
});

FormLabel.displayName = "FormLabel";

export { FormLabel };
