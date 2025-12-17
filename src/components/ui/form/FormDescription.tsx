import { cn } from "@/lib/utils";
import React from "react";

const FormDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("text-sm text-[#8E98A8", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

export { FormDescription };
