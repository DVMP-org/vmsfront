/** Shared attachment shapes returned by the VMS Core file endpoints. */

export type AttachmentEntityType =
    | "organization"
    | "site"
    | "place"
    | "place_group"
    | "party"
    | "contractor"
    | "hospitality_room";

export type AttachmentCategory =
    | "image"
    | "document"
    | "avatar"
    | "logo"
    | "cover"
    | "gallery";

export interface Attachment {
    id: string;
    file_id: string;
    entity_type: AttachmentEntityType | string;
    entity_id: string;
    category: AttachmentCategory | string;
    sort_order: number;
    is_primary: boolean;
    caption: string | null;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    is_public: boolean;
    uploaded_at: string | null;
    uploaded_by_user_id: string | null;
    uploaded_by_name: string | null;
    /** Server-signed path (private) or stable public path. */
    url: string;
    thumbnail_url: string;
    width: number | null;
    height: number | null;
}

export interface AttachmentList {
    items: Attachment[];
}

export interface UploadAttachmentOptions {
    category?: AttachmentCategory;
    caption?: string | null;
    isPublic?: boolean;
    makePrimary?: boolean;
}
