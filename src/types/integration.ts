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
  | "process_payment"
  | "verify_identity"
  | "access_control"
  | "data_sync"
  | "webhook"
  | "realtime"
  | "batch_processing"
  | "notification"
  | "file_storage";

export interface IntegrationConfig {
  name: string,
  description: string,
  logo_url: string | null,
  website_url: string | null,
  docs_url: string | null,
  type: IntegrationType,
  tags?: string[] | null,
  capabilities: IntegrationCapability[],
  credentials: IntegrationCredentials,
}

export interface Integration {
  id: string;
  name: string;
  config: IntegrationConfig;
  provider: IntegrationType;
  description?: string | null;
  logo_url?: string | null;
  // Runtime state
  enabled: boolean;
  configured: boolean;
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

export const INTEGRATION_CAPABILITY_LABELS: Record<IntegrationCapability, string> = {
  send_message: "Send Messages",
  receive_message: "Receive Messages",
  process_payment: "Process Payments",
  verify_identity: "Verify Identity",
  access_control: "Access Control",
  data_sync: "Data Sync",
  webhook: "Webhooks",
  realtime: "Real-time",
  batch_processing: "Batch Processing",
  notification: "Notifications",
  file_storage: "File Storage",
};
