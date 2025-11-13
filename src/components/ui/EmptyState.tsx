import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 xs:py-12 px-3 xs:px-4 text-center">
      {Icon && (
        <div className="mb-3 xs:mb-4 rounded-full bg-muted p-3 xs:p-4">
          <Icon className="h-6 w-6 xs:h-8 xs:w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base xs:text-lg font-semibold text-foreground mb-1.5 xs:mb-2 px-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs xs:text-sm text-muted-foreground mb-4 xs:mb-6 max-w-md px-2">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}

