// Integration Types

export type CredentialFieldType =
  | "string"
  | "password"
  | "number"
  | "boolean"
  | "select"
  | "text"
  | "url"
  | "email";

export interface CredentialField {
  type: CredentialFieldType;
  description: string;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select type
  value?: string | number | boolean;
}

export interface IntegrationCredentials {
  [key: string]: CredentialField;
}

export type IntegrationType =
  | "messaging"
  | "payment"
  | "access_control"
  | "analytics"
  | "notification"
  | "storage"
  | "identity"
  | "other";

export type IntegrationCapability =
  | "send_message"
  | "receive_message"
  | "send_media"
  | "receive_media"
  | "voice_call"
  | "video_call"
  | "process_payment"
  | "verify_identity"
  | "access_control"
  | "data_sync"
  | "webhook"
  | "realtime"
  | "batch_processing"
  | "notification"
  | "file_storage"
  | "utility.electricity.customer_verify"
  | "utility.electricity.vend"
  | "utility.electricity.transaction_status";

export interface IntegrationConfig {
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  docs_url: string | null;
  type: IntegrationType;
  tags?: string[] | null;
  capabilities: IntegrationCapability[];
  credentials: IntegrationCredentials;
}

export interface PaymentGatewaySelection {
  integration_id: string;
  name: string;
  provider: string;
  configured: boolean;
}

export interface Integration {
  id: string;
  name: string;
  config: IntegrationConfig;
  provider: IntegrationType;
  description?: string | null;
  logo_url?: string | null;
  capabilities: IntegrationCapability[];
  api_docs_url?: string | null;
  // Runtime state
  enabled: boolean;
  configured: boolean;
  /**
   * The organization's own connection row. `id` is the catalog entry used for
   * routing and credential writes; a plugin binding references this instead.
   */
  organization_integration_id?: string | null;
  /** Credential keys with a stored value. Secret values are never returned. */
  configured_credentials?: string[];
  /** Stored values for non-secret fields (url, string, email, number, boolean). */
  credential_values?: Record<string, string | number | boolean>;
  /** Whether the provider driver is registered and running in this process. */
  is_running?: boolean;
  last_synced_at?: string | null;
  version?: string;
  created_at?: string;
  updated_at?: string;
}

// API Request Types
export interface UpdateIntegrationRequest {
  credentials?: IntegrationCredentials;
}

// Helper type for credential form values
export type CredentialFormValues = Record<string, string | number | boolean>;

// Integration categories for filtering
export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  messaging: "Messaging",
  payment: "Payment",
  access_control: "Access Control",
  analytics: "Analytics",
  notification: "Notification",
  storage: "Storage",
  identity: "Identity",
  other: "Other",
};

export const INTEGRATION_CAPABILITY_LABELS: Record<
  IntegrationCapability,
  string
> = {
  send_message: "Send messages",
  receive_message: "Receive messages",
  send_media: "Send media",
  receive_media: "Receive media",
  voice_call: "Voice calls",
  video_call: "Video calls",
  process_payment: "Process payments",
  verify_identity: "Verify identity",
  access_control: "Access control",
  data_sync: "Data sync",
  webhook: "Webhooks",
  realtime: "Real-time updates",
  batch_processing: "Batch processing",
  notification: "Notifications",
  file_storage: "File storage",
  "utility.electricity.customer_verify": "Verify electricity customer",
  "utility.electricity.vend": "Sell electricity units",
  "utility.electricity.transaction_status": "Check transaction status",
};

/**
 * Operator-facing capability text. Mirrors
 * `vmscore.domain.integration_capabilities.CAPABILITY_LABELS`; an unknown
 * capability still reads as words instead of a dotted identifier.
 */
export function capabilityLabel(capability: string): string {
  const label =
    INTEGRATION_CAPABILITY_LABELS[capability as IntegrationCapability];
  if (label) return label;
  const words = capability.replaceAll(".", " ").replaceAll("_", " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : capability;
}
