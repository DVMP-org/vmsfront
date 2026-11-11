"use client";

import { Button } from "@/components/ui/Button";

/**
 * Sticky footer that only appears when the form has unsaved changes, so the
 * page never shows a save button that would do nothing.
 */
export function SettingsSaveBar({
    isSaving,
    onDiscard,
    onSave,
}: {
    isSaving: boolean;
    onDiscard: () => void;
    onSave: () => void;
}) {
    return (
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1.5 pl-3 shadow-[var(--vms-shadow-overlay)]">
                <span className="text-xs text-[var(--vms-ink-muted)]">
                    Unsaved changes
                </span>
                <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
                    Discard
                </Button>
                <Button size="sm" isLoading={isSaving} onClick={onSave}>
                    Save changes
                </Button>
            </div>
        </div>
    );
}
