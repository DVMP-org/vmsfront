import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg xs:max-w-xl",
    lg: "max-w-2xl xs:max-w-3xl",
    xl: "max-w-4xl xs:max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 xs:px-4 xs:py-6 sm:px-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full rounded-xl bg-background shadow-lg",
          "max-h-[95vh] xs:max-h-[90vh] overflow-y-auto",
          "animate-in fade-in zoom-in-95 duration-200",
          sizes[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b px-3 py-3 xs:px-4 xs:py-4 sm:px-6">
            <h2 className="text-base xs:text-lg sm:text-xl font-semibold pr-2 truncate">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-accent transition-colors flex-shrink-0 touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-3 py-4 xs:px-4 xs:py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
