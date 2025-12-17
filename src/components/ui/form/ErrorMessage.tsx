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
      className={cn("text-xs font-normal text-[#F04248]", className)}
      {...props}
    >
      {body}
    </p>
  );
});
ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
