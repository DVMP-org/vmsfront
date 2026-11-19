/** Small, dependency-free helpers for the shared upload widget. */

export const IMAGE_ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const DOCUMENT_ACCEPT = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
];

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        units.length - 1,
        Math.floor(Math.log(bytes) / Math.log(1024)),
    );
    const value = bytes / Math.pow(1024, index);
    return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export function fileExtension(name: string): string {
    const match = /\.([A-Za-z0-9]+)$/.exec(name);
    return match ? match[1].toUpperCase() : "FILE";
}

export interface FileValidationResult {
    valid: boolean;
    message?: string;
}

export function validateFile(
    file: File,
    kinds: "image" | "document" | "any",
): FileValidationResult {
    const isImage = file.type.startsWith("image/");
    const allowed = kinds === "image" ? IMAGE_ACCEPT : DOCUMENT_ACCEPT;
    if (kinds === "image" && !IMAGE_ACCEPT.includes(file.type)) {
        return { valid: false, message: "Choose a PNG, JPEG, WebP or GIF image." };
    }
    if (kinds === "document" && !allowed.includes(file.type)) {
        return {
            valid: false,
            message: "Choose a PDF, Word, Excel, PowerPoint, CSV or text file.",
        };
    }
    if (kinds === "any" && !isImage && !DOCUMENT_ACCEPT.includes(file.type)) {
        return {
            valid: false,
            message: "Choose an image or a common document format.",
        };
    }
    const limit =
        kinds === "document" ? DOCUMENT_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > limit) {
        return {
            valid: false,
            message: `Files must be ${formatFileSize(limit)} or smaller.`,
        };
    }
    return { valid: true };
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= items.length) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(Math.min(to, next.length), 0, moved);
    return next;
}

export function reorderIds(items: { id: string }[], from: number, to: number) {
    return moveItem(items, from, to).map((item) => item.id);
}
