import { cn } from "@/lib/utils";
import React from "react";

const ErrorMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    error?: string;
  }
>(({ className, children, error, ...props }, ref) => {
  const body = error ?? children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-xs font-medium text-[var(--vms-danger)]", className)}
      {...props}
    >
      {body}
    </p>
  );
});
ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
