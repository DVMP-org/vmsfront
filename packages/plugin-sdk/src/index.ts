export type PluginSurface = "admin" | "workspace" | "access";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  surfaces: PluginSurface[];
  permissions: string[];
}

export interface PluginHostContext {
  organizationId: string;
  organizationSlug: string;
  userId: string;
  permissions: string[];
}
