import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook for copying text to clipboard with feedback state.
 * Supports multiple items on a single page by using unique keys.
 */
export function useCopyToClipboard(timeout: number = 2000) {
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const copyToClipboard = useCallback(
        async (text: string, key: string = "default", message: string = "Copied to clipboard") => {
            try {
                if (!navigator.clipboard) {
                    throw new Error("Clipboard API not available");
                }
                await navigator.clipboard.writeText(text);

                setCopiedStates((prev) => ({ ...prev, [key]: true }));
                toast.success(message);

                setTimeout(() => {
                    setCopiedStates((prev) => ({ ...prev, [key]: false }));
                }, timeout);
            } catch (err) {
                console.error("Failed to copy!", err);
                toast.error("Failed to copy to clipboard");
            }
        },
        [timeout]
    );

    const isCopied = useCallback((key: string = "default") => !!copiedStates[key], [copiedStates]);

    return { copyToClipboard, isCopied };
}
