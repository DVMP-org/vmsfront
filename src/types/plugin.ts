import { ComponentType } from "react";

export interface PluginRoute {
  path: string;
  component: ComponentType;
  title?: string; // Display title for sidebar navigation
  icon?: string; // Icon name (e.g., "zap", "credit-card")
  auth?: boolean;
}

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginConfigOption {
  key: string;
  label: string;
  type:
  | "text"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "toggle"
  | "select"
  | "url";
  required?: boolean;
  default?: any;
  choices?: string[] | null;
  min?: number | null;
  max?: number | null;
  description?: string | null;
}

export interface PluginConfigurationSchema {
  organization: PluginConfigOption[];
  site: PluginConfigOption[];
}

export interface PluginRequirement {
  key: string;
  capability: string;
  required?: boolean;
  cardinality?: "one" | "many";
}

export interface PluginContribution {
  key: string;
  workspace: "site" | "party";
  label?: string | null;
  route?: string | null;
  metric?: string | null;
  permission?: string;
  domains?: string[] | null;
}

export interface PluginManifestData {
  supported_domains?: string[];
  requires?: PluginRequirement[];
  contributes?: {
    navigation?: PluginContribution[];
    dashboard?: PluginContribution[];
    actions?: PluginContribution[];
  };
  configuration?: Partial<PluginConfigurationSchema>;
}

export interface PluginSiteRequirementStatus {
  key: string;
  capability: string;
  required: boolean;
  satisfied: boolean;
  organization_integration_id: string | null;
  provider: string | null;
}

export interface PluginSiteState {
  site_id: string;
  site_name: string | null;
  plugin_id: string;
  state: "active" | "needs_configuration" | "suspended" | "inactive";
  config_revision: number;
  configuration: PluginConfig | null;
  updated_at: string | null;
  requirements: PluginSiteRequirementStatus[];
  contributions: PluginContribution[];
}

export interface PluginSiteHealth {
  site_id: string;
  site_name: string | null;
  state: PluginSiteState["state"];
  healthy: boolean;
  unmet_requirements: string[];
}

export interface PluginConnectionHealth {
  id: string;
  name: string;
  provider: string;
  ok: boolean;
  detail: string;
}

export interface PluginHealth {
  plugin_id: string;
  name: string;
  slug: string;
  installed: boolean;
  enabled: boolean;
  configured: boolean;
  licensed: boolean;
  healthy: boolean;
  detail: string;
  sites: PluginSiteHealth[];
  connections: PluginConnectionHealth[];
}

export interface SitePluginConnection {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  enabled: boolean;
  configured: boolean;
}

export interface SitePluginSummary {
  plugin_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  state: PluginSiteState["state"];
  config_revision: number;
  requirements: PluginSiteRequirementStatus[];
}

export interface SitePluginList {
  site_id: string;
  plugins: SitePluginSummary[];
  connections: SitePluginConnection[];
}

export interface PluginSiteActivationResult {
  site_id: string;
  site_name: string | null;
  state: PluginSiteState["state"] | null;
  error: string | null;
}

export interface PluginDetails {
  configEndpoint: string | null;
  documentationUrl: string | null;
  useCases: string[];
  setupSteps: string[];
  requirements: string[];
}

export interface BackendPlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  category?: string;
  image?: string;
  details?: PluginDetails;
  [key: string]: any;
  manifest?: PluginManifestData;
  configuration?: PluginConfig; // Current configuration from backend
  configuration_schema?: PluginConfigurationSchema;
  config_revision?: number;
  configured?: boolean; // Whether the plugin has been configured at least once
  installed?: boolean;
  licensed?: boolean;
  access_ready?: boolean;
  entitlement_status?: string;
  entitlement_source?: string | null;
  entitlement_reason?: string | null;
  plan_id?: string | null;
  plan_name?: string | null;
  grace_ends_at?: string | null;
  can_enable?: boolean;
  can_configure?: boolean;
}

// Frontend plugin host (src/plugins/<name>, loaded into the app shell)
export interface PluginManifest {
  name: string;
  title: string;
  version?: string;
  backendVersion?: string; // Version from backend API
  icon?: string;
  frontend: {
    basePath: string;
    menu?: {
      label: string;
      icon?: string;
    };
  };
}

export interface FrontendPlugin {
  manifest: PluginManifest;
  adminRoutes?: PluginRoute[];
  residentRoutes?: PluginRoute[];
}

export interface LoadedPlugin {
  name: string;
  basePath: string;
  manifest: PluginManifest;
  adminRoutes?: PluginRoute[];
  residentRoutes?: PluginRoute[];
  backendId?: string;
}

// Marketplace Plugin Types
export interface MarketplacePlugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  author: string;
  image?: string;
  screenshots?: string[];
  details?: PluginDetails;
  manifest?: PluginManifestData;
  price: number; // 0 for free
  currency?: string;
  rating: number; // 0-5
  review_count: number;
  installed_count: number;
  installed: boolean;
  enabled?: boolean;
  configured?: boolean;
  licensed?: boolean;
  access_ready?: boolean;
  entitlement_status?: string;
  entitlement_source?: string | null;
  entitlement_reason?: string | null;
  plan_id?: string | null;
  plan_name?: string | null;
  grace_ends_at?: string | null;
  can_install?: boolean;
  can_enable?: boolean;
  can_configure?: boolean;
  tags?: string[];
  requirements?: string[];
  features?: string[];
  documentationUrl?: string;
  supportUrl?: string;
  lastUpdated?: string;
  createdAt?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  pluginCount: number;
  icon?: string;
}

export interface InstallPluginResponse {
  success: boolean;
  message: string;
  plugin?: BackendPlugin;
}
