// Notification Channel Types

export type NotificationChannelType = "email" | "sms" | "whatsapp" | "push";

export type EmailProvider = "smtp" | "sendgrid" | "mailgun" | "ses";
export type SmsProvider = "termii" | "twilio" | "africastalking";
export type WhatsAppProvider = "twilio_whatsapp" | "whatsapp_business" | "termii_whatsapp";
export type PushProvider = "firebase" | "onesignal";

export type NotificationProvider =
  | EmailProvider
  | SmsProvider
  | WhatsAppProvider
  | PushProvider;

export interface ProviderCredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "email" | "url" | "select";
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface NotificationProviderConfig {
  id: NotificationProvider;
  name: string;
  description: string;
  logo?: string;
  docsUrl?: string;
  credentials: ProviderCredentialField[];
}

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  provider: NotificationProvider;
  name: string;
  enabled: boolean;
  configured: boolean;
  is_default: boolean;
  credentials: Record<string, string | number | null>;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationChannelRequest {
  type: NotificationChannelType;
  provider: NotificationProvider;
  credentials: Record<string, string | number | null>;
  enabled?: boolean;
  is_default?: boolean;
}

export interface UpdateNotificationChannelRequest {
  credentials?: Record<string, string | number | null>;
  enabled?: boolean;
  is_default?: boolean;
}

// ── Channel Definitions ────────────────────────────────────────────────

export interface ChannelDefinition {
  type: NotificationChannelType;
  label: string;
  description: string;
  icon: string; // lucide icon name reference
  providers: NotificationProviderConfig[];
}

// Provider credential configs
export const EMAIL_PROVIDERS: NotificationProviderConfig[] = [
  {
    id: "smtp",
    name: "SMTP",
    description: "Send emails using any SMTP server. Works with Gmail, Outlook, and custom mail servers.",
    docsUrl: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol",
    credentials: [
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.example.com", required: true, description: "The hostname of your SMTP server" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587", required: true, description: "Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)" },
      { key: "smtp_user", label: "Username", type: "text", placeholder: "your-username@example.com", required: true, description: "The username for SMTP authentication" },
      { key: "smtp_password", label: "Password", type: "password", placeholder: "••••••••", required: true, description: "The password or app-specific password" },
      { key: "from_email", label: "From Email", type: "email", placeholder: "noreply@example.com", required: true, description: "The sender email address" },
      { key: "from_name", label: "From Name", type: "text", placeholder: "My App", required: false, description: "The sender display name" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Reliable email delivery service by Twilio. Great for transactional and marketing emails.",
    docsUrl: "https://docs.sendgrid.com/",
    credentials: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "SG.xxxx", required: true, description: "Your SendGrid API key" },
      { key: "from_email", label: "From Email", type: "email", placeholder: "noreply@example.com", required: true, description: "Verified sender email address" },
      { key: "from_name", label: "From Name", type: "text", placeholder: "My App", required: false, description: "The sender display name" },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Powerful transactional email API service for developers.",
    docsUrl: "https://documentation.mailgun.com/",
    credentials: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "key-xxxx", required: true, description: "Your Mailgun API key" },
      { key: "domain", label: "Domain", type: "text", placeholder: "mg.example.com", required: true, description: "Your Mailgun sending domain" },
      { key: "from_email", label: "From Email", type: "email", placeholder: "noreply@example.com", required: true, description: "Sender email address" },
      { key: "from_name", label: "From Name", type: "text", placeholder: "My App", required: false, description: "The sender display name" },
      { key: "region", label: "Region", type: "select", required: true, description: "Mailgun API region", options: [{ label: "US", value: "us" }, { label: "EU", value: "eu" }] },
    ],
  },
  {
    id: "ses",
    name: "Amazon SES",
    description: "Cost-effective email service from AWS for sending transactional emails at scale.",
    docsUrl: "https://docs.aws.amazon.com/ses/",
    credentials: [
      { key: "access_key_id", label: "Access Key ID", type: "password", placeholder: "AKIAIOSFODNN7EXAMPLE", required: true, description: "Your AWS access key ID" },
      { key: "secret_access_key", label: "Secret Access Key", type: "password", placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", required: true, description: "Your AWS secret access key" },
      { key: "region", label: "AWS Region", type: "text", placeholder: "us-east-1", required: true, description: "The AWS region for SES" },
      { key: "from_email", label: "From Email", type: "email", placeholder: "noreply@example.com", required: true, description: "Verified sender email address" },
      { key: "from_name", label: "From Name", type: "text", placeholder: "My App", required: false, description: "The sender display name" },
    ],
  },
];

export const SMS_PROVIDERS: NotificationProviderConfig[] = [
  {
    id: "termii",
    name: "Termii",
    description: "Africa-focused messaging platform for SMS, voice, and token verification.",
    docsUrl: "https://developer.termii.com/",
    credentials: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Your Termii API key", required: true, description: "Your Termii API key from the dashboard" },
      { key: "sender_id", label: "Sender ID", type: "text", placeholder: "MySender", required: true, description: "The registered sender ID for your messages" },
      { key: "channel", label: "Channel", type: "select", required: true, description: "The SMS channel to use", options: [{ label: "Generic", value: "generic" }, { label: "DND", value: "dnd" }, { label: "WhatsApp", value: "whatsapp" }] },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Global cloud communications platform for SMS, voice, and messaging.",
    docsUrl: "https://www.twilio.com/docs/sms",
    credentials: [
      { key: "account_sid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", required: true, description: "Your Twilio Account SID" },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "Your Twilio auth token", required: true, description: "Your Twilio Auth Token" },
      { key: "from_number", label: "From Number", type: "text", placeholder: "+1234567890", required: true, description: "Your Twilio phone number (E.164 format)" },
    ],
  },
  {
    id: "africastalking",
    name: "Africa's Talking",
    description: "Pan-African communication APIs for SMS, voice, USSD, and payments.",
    docsUrl: "https://africastalking.com/docs",
    credentials: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Your Africa's Talking API key", required: true, description: "API key from your Africa's Talking dashboard" },
      { key: "username", label: "Username", type: "text", placeholder: "sandbox or your username", required: true, description: "Your Africa's Talking username" },
      { key: "sender_id", label: "Sender ID", type: "text", placeholder: "MySender", required: false, description: "Optional alphanumeric sender ID" },
    ],
  },
];

export const WHATSAPP_PROVIDERS: NotificationProviderConfig[] = [
  {
    id: "twilio_whatsapp",
    name: "Twilio WhatsApp",
    description: "Send WhatsApp messages through Twilio's WhatsApp Business API.",
    docsUrl: "https://www.twilio.com/docs/whatsapp",
    credentials: [
      { key: "account_sid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", required: true, description: "Your Twilio Account SID" },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "Your Twilio auth token", required: true, description: "Your Twilio Auth Token" },
      { key: "from_number", label: "WhatsApp Number", type: "text", placeholder: "whatsapp:+1234567890", required: true, description: "Your Twilio WhatsApp-enabled number" },
    ],
  },
  {
    id: "whatsapp_business",
    name: "WhatsApp Business API",
    description: "Direct integration with Meta's WhatsApp Business Platform.",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    credentials: [
      { key: "access_token", label: "Access Token", type: "password", placeholder: "Your WhatsApp Business API access token", required: true, description: "Permanent access token from Meta Developer Console" },
      { key: "phone_number_id", label: "Phone Number ID", type: "text", placeholder: "1234567890", required: true, description: "The Phone Number ID from WhatsApp Business" },
      { key: "business_account_id", label: "Business Account ID", type: "text", placeholder: "1234567890", required: true, description: "Your WhatsApp Business Account ID" },
    ],
  },
  {
    id: "termii_whatsapp",
    name: "Termii WhatsApp",
    description: "Send WhatsApp messages through Termii's messaging platform.",
    docsUrl: "https://developer.termii.com/",
    credentials: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Your Termii API key", required: true, description: "Your Termii API key from the dashboard" },
      { key: "sender_id", label: "Sender ID", type: "text", placeholder: "MySender", required: true, description: "The registered WhatsApp sender ID" },
    ],
  },
];

export const PUSH_PROVIDERS: NotificationProviderConfig[] = [
  {
    id: "firebase",
    name: "Firebase Cloud Messaging",
    description: "Google's cross-platform messaging solution for push notifications.",
    docsUrl: "https://firebase.google.com/docs/cloud-messaging",
    credentials: [
      { key: "project_id", label: "Project ID", type: "text", placeholder: "my-firebase-project", required: true, description: "Your Firebase project ID" },
      { key: "service_account_key", label: "Service Account Key (JSON)", type: "password", placeholder: "Paste your service account JSON key", required: true, description: "The full service account JSON key from Firebase Console" },
    ],
  },
  {
    id: "onesignal",
    name: "OneSignal",
    description: "Customer engagement platform for push notifications, email, SMS, and in-app messaging.",
    docsUrl: "https://documentation.onesignal.com/",
    credentials: [
      { key: "app_id", label: "App ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true, description: "Your OneSignal App ID" },
      { key: "rest_api_key", label: "REST API Key", type: "password", placeholder: "Your OneSignal REST API key", required: true, description: "REST API key from OneSignal dashboard" },
    ],
  },
];

// Channel definitions with their providers
export const NOTIFICATION_CHANNELS: ChannelDefinition[] = [
  {
    type: "email",
    label: "Email",
    description: "Send email notifications via SMTP or email service providers",
    icon: "mail",
    providers: EMAIL_PROVIDERS,
  },
  {
    type: "sms",
    label: "SMS",
    description: "Send SMS text messages to users' phone numbers",
    icon: "message-square",
    providers: SMS_PROVIDERS,
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    description: "Send messages through WhatsApp Business API",
    icon: "message-circle",
    providers: WHATSAPP_PROVIDERS,
  },
  {
    type: "push",
    label: "Push Notifications",
    description: "Send push notifications to mobile and web apps",
    icon: "bell-ring",
    providers: PUSH_PROVIDERS,
  },
];

// Helper to get channel definition by type
export function getChannelDefinition(type: NotificationChannelType): ChannelDefinition | undefined {
  return NOTIFICATION_CHANNELS.find((c) => c.type === type);
}

// Helper to get provider config
export function getProviderConfig(
  channelType: NotificationChannelType,
  providerId: NotificationProvider
): NotificationProviderConfig | undefined {
  const channel = getChannelDefinition(channelType);
  return channel?.providers.find((p) => p.id === providerId);
}

// Channel type labels
export const CHANNEL_TYPE_LABELS: Record<NotificationChannelType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  push: "Push Notifications",
};
