"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function SlideOver({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = "md",
}: SlideOverProps) {
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

    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg xs:max-w-xl",
        lg: "max-w-2xl xs:max-w-3xl",
        xl: "max-w-4xl xs:max-w-5xl",
        full: "max-w-full",
    };

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex justify-end overflow-hidden transition-opacity duration-300",
                isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={cn(
                    "relative flex w-full flex-col bg-background shadow-2xl transition-transform duration-500 ease-in-out sm:duration-700",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    sizes[size]
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
                    <div>
                        {title && (
                            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">{children}</div>
            </div>
        </div>
    );
}
