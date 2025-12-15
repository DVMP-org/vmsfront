import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-base card-inset",
        "w-full min-w-0 text-card-foreground",
        "max-w-full overflow-hidden",
        className
      )}
      style={{
        borderRadius: "var(--radius-lg)",
      }}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5",
        "p-3 pb-2 xs:p-4 xs:pb-3 sm:p-5 sm:pb-3 md:p-6 md:pb-4",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-semibold leading-none tracking-tight",
        "text-lg xs:text-xl sm:text-2xl",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-muted-foreground",
        "text-xs xs:text-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "pt-0",
        "p-3 xs:p-4 sm:p-5 md:p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        "p-3 pt-0 xs:p-4 xs:pt-0 sm:flex-row sm:items-center sm:p-5 sm:pt-0 md:p-6 md:pt-0",
        className
      )}
      {...props}
    />
  );
}
