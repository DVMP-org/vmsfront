// ── Notification Channel & Provider Types ──────────────────────────────

/**
 * Channels are constant frontend categories that represent the delivery medium.
 * Each channel has multiple providers (fetched from the backend) that can be
 * configured, enabled/disabled, and set as default.
 */

export type NotificationChannelType = "email" | "sms" | "whatsapp" | "push";

// ── Provider Credential Schema (from backend) ──────────────────────

/**
 * Each field in the credential_schema dict from the API.
 * Keys are field names like "account_sid", "access_token", etc.
 */
export interface ProviderCredentialSchemaField {
    type: string;
    description: string;
    required: boolean;
    placeholder?: string;
}

/**
 * Normalized version of a credential field for form rendering.
 * Created by converting the backend dict into an array.
 */
export interface ProviderCredentialField {
    key: string;
    label: string;
    type: "text" | "password" | "number" | "email" | "url" | "select" | "boolean";
    placeholder?: string;
    description?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
}

// ── Provider (backend entity) ───────────────────────────────────────

export interface NotificationProvider {
    id: string;
    /** Machine name: "smtp", "twilio", "meta_whatsapp" */
    name: string;
    /** Human-readable name: "SMTP Email", "Twilio SMS" */
    display_name: string;
    channel: NotificationChannelType;
    description: string | null;
    logo_url: string | null;
    /** Whether this is the default/built-in provider for its channel */
    is_default: boolean;
    /** Whether this provider is currently enabled for the org */
    enabled: boolean;
    /** Whether credentials have been configured */
    configured: boolean;
    /**
     * Schema dict — keys are credential field names, values describe each field.
     * Example: { "account_sid": { type: "string", description: "...", required: true } }
     */
    credential_schema: Record<string, ProviderCredentialSchemaField>;
    /** Org-specific config for this provider (contains stored credentials when configured) */
    config: {
        credentials: Record<string, string | number | null>;
    } | null;
}

// ── Channel Provider Summary (from GET /notification-providers/channels) ──

export interface ChannelProviderSummary {
    channel: NotificationChannelType;
    active_provider: {
        id: string;
        name: string;
        display_name: string;
    } | null;
}

// ── API Request Types ───────────────────────────────────────────────

/** Activate a provider for a channel (deactivates any existing one) */
export interface ActivateProviderRequest {
    provider_id: string;
    credentials: Record<string, string | number | boolean | null>;
}

/** Update credentials for an already-activated provider */
export interface UpdateProviderCredentialsRequest {
    credentials: Record<string, string | number | boolean | null>;
}

// ── Channel Definition (frontend constant) ──────────────────────────

export interface ChannelDefinition {
    type: NotificationChannelType;
    label: string;
    description: string;
}

/**
 * Constant channel definitions — these never change.
 * The providers within each channel are fetched dynamically from the backend.
 */
export const NOTIFICATION_CHANNELS: ChannelDefinition[] = [
    {
        type: "email",
        label: "Email",
        description: "Send email notifications via SMTP or email service providers",
    },
    {
        type: "sms",
        label: "SMS",
        description: "Send SMS text messages to users' phone numbers",
    },
    {
        type: "whatsapp",
        label: "WhatsApp",
        description: "Send messages through WhatsApp Business API",
    },
    {
        type: "push",
        label: "Push Notifications",
        description: "Send push notifications to mobile and web apps",
    },
];

// ── Helpers ─────────────────────────────────────────────────────────

export function getChannelDefinition(type: NotificationChannelType): ChannelDefinition | undefined {
    return NOTIFICATION_CHANNELS.find((c) => c.type === type);
}

export const CHANNEL_TYPE_LABELS: Record<NotificationChannelType, string> = {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
    push: "Push Notifications",
};

/**
 * Convert the backend credential_schema dict into an array of form fields.
 * Turns `{ account_sid: { type: "string", description: "Twilio Account SID", ... } }`
 * into `[{ key: "account_sid", label: "Twilio Account SID", type: "text", ... }]`
 */
export function parseCredentialSchema(
    schema: Record<string, ProviderCredentialSchemaField> | null | undefined
): ProviderCredentialField[] {
    if (!schema || typeof schema !== "object") return [];

    return Object.entries(schema).map(([key, field]) => {
        // Map backend type to form input types
        let inputType: ProviderCredentialField["type"] = "text";
        if (field.type === "boolean" || field.type === "bool") {
            inputType = "boolean";
        } else {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.includes("token") ||
                lowerKey.includes("secret") ||
                lowerKey.includes("password") ||
                lowerKey.includes("auth")
            ) {
                inputType = "password";
            }
        }

        // Use description as label, falling back to a humanized key
        const label = field.description || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return {
            key,
            label,
            type: inputType,
            placeholder: field.placeholder || "",
            description: undefined, // description is used as label already
            required: field.required,
        };
    });
}
