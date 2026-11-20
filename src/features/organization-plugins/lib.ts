import type { StatusTone } from "@/components/ui/StatusBadge";
import { titleCase } from "@/lib/strings";
import { capabilityLabel as sharedCapabilityLabel } from "@/types/integration";
import type {
  BackendPlugin,
  MarketplacePlugin,
  PluginConfig,
  PluginConfigOption,
  PluginContribution,
  PluginManifestData,
  PluginRequirement,
  PluginSiteState,
} from "@/types/plugin";

export type PluginRecord = BackendPlugin | MarketplacePlugin;
export type ConfigurationScope = "organization" | "site";
export type PluginView = "installed" | "catalog";

/** Mirrors `vmscore.domain.integration_capabilities`: a binding that authorizes
 * the parent capability also authorizes these operations on that connection. */
const CAPABILITY_IMPLICATIONS: Record<string, string[]> = {
  "utility.electricity.customer_verify": ["utility.electricity.vend"],
  "utility.electricity.transaction_status": ["utility.electricity.vend"],
};

export function manifestOf(plugin: PluginRecord): PluginManifestData {
  return plugin.manifest ?? {};
}

export function pluginRequirements(plugin: PluginRecord): PluginRequirement[] {
  return manifestOf(plugin).requires ?? [];
}

export function pluginDomains(plugin: PluginRecord): string[] {
  return manifestOf(plugin).supported_domains ?? [];
}

export function pluginContributions(plugin: PluginRecord): PluginContribution[] {
  const contributes = manifestOf(plugin).contributes;
  return [
    ...(contributes?.navigation ?? []),
    ...(contributes?.dashboard ?? []),
    ...(contributes?.actions ?? []),
  ];
}

export function configurationFields(
  plugin: PluginRecord,
  scope: ConfigurationScope,
): PluginConfigOption[] {
  const schema = (plugin as BackendPlugin).configuration_schema?.[scope];
  return schema ?? manifestOf(plugin).configuration?.[scope] ?? [];
}

export function pluginTitle(plugin: PluginRecord): string {
  return titleCase(plugin.name.replaceAll("_", " "));
}

export function domainLabel(domain: string): string {
  return titleCase(domain.replaceAll("_", " "));
}

export function requirementLabel(requirement: PluginRequirement): string {
  return titleCase(requirement.key.replaceAll("_", " "));
}

export function capabilityLabel(capability: string): string {
  return sharedCapabilityLabel(capability);
}

export function pluginStatus(plugin: PluginRecord): {
  label: string;
  tone: StatusTone;
} {
  if (!plugin.installed) return { label: "Not installed", tone: "neutral" };
  if (!plugin.enabled) return { label: "Disabled", tone: "neutral" };
  const declaresConfiguration =
    configurationFields(plugin, "organization").length > 0 ||
    configurationFields(plugin, "site").length > 0;
  if (declaresConfiguration && !plugin.configured) {
    return { label: "Setup required", tone: "warning" };
  }
  if (!plugin.access_ready) return { label: "Plan required", tone: "danger" };
  return { label: "Active", tone: "success" };
}

const DEPLOYMENT_LABELS: Record<PluginSiteState["state"], string> = {
  active: "Active",
  needs_configuration: "Needs configuration",
  suspended: "Suspended",
  inactive: "Inactive",
};

const DEPLOYMENT_TONES: Record<PluginSiteState["state"], StatusTone> = {
  active: "success",
  needs_configuration: "warning",
  suspended: "danger",
  inactive: "neutral",
};

export function deploymentLabel(state: PluginSiteState["state"]): string {
  return DEPLOYMENT_LABELS[state] ?? titleCase(state);
}

export function deploymentTone(state: PluginSiteState["state"]): StatusTone {
  return DEPLOYMENT_TONES[state] ?? "neutral";
}

export function configurationDraft(
  fields: PluginConfigOption[],
  stored: PluginConfig | null | undefined,
): PluginConfig {
  const draft: PluginConfig = {};
  for (const field of fields) {
    if (field.default !== undefined && field.default !== null) {
      draft[field.key] = field.default;
    }
  }
  return { ...draft, ...(stored ?? {}) };
}

export function integrationSupports(
  capabilities: readonly string[] | null | undefined,
  capability: string,
): boolean {
  const accepted = new Set([
    capability,
    ...(CAPABILITY_IMPLICATIONS[capability] ?? []),
  ]);
  return (capabilities ?? []).some((item) => accepted.has(item));
}

export function contributionSummary(plugin: PluginRecord): {
  navigation: number;
  dashboard: number;
  actions: number;
} {
  const contributes = manifestOf(plugin).contributes;
  return {
    navigation: contributes?.navigation?.length ?? 0,
    dashboard: contributes?.dashboard?.length ?? 0,
    actions: contributes?.actions?.length ?? 0,
  };
}
