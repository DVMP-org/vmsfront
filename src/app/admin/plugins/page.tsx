"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { loadPlugins } from "@/lib/plugin_loader";
import { titleCase, keysToCamelCase, keysToSnakeCase, toCamelCase } from "@/lib/utils";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Puzzle,
  Search,
  Sparkles,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Save,
  Store,
  Lock,
} from "lucide-react";
import { Plugin, PluginConfig, BackendPlugin } from "@/types/plugin";
import { Skeleton } from "@/components/ui/Skeleton";
import { pluginEntitlementLabel } from "@/lib/plugin-utils";

export default function PluginsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const config = useMemo(() => ({
    pluginId: { defaultValue: undefined },
  }), []);

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPluginId, setSelectedPluginId] = useState<string | undefined>(() => initializeFromUrl("pluginId"));
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [editedConfig, setEditedConfig] = useState<PluginConfig>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Sync pluginId to URL
  useEffect(() => {
    syncToUrl({ pluginId: selectedPluginId });
  }, [selectedPluginId, syncToUrl]);

  // Fetch plugins from API
  const { data: backendPluginsResponse, isLoading: isLoadingPlugins } = useQuery({
    queryKey: ["admin", "plugins"],
    queryFn: async () => {
      const response = await adminService.getPlugins();
      return response.data as BackendPlugin[];
    },
  });

  // Load frontend plugins
  const [frontendPlugins, setFrontendPlugins] = useState<any[]>([]);
  useEffect(() => {
    loadPlugins().then(setFrontendPlugins).catch(() => setFrontendPlugins([]));
  }, []);

  // Toggle plugin enable/disable mutation
  const togglePluginMutation = useMutation({
    mutationFn: async (pluginId: string) => {
      return adminService.togglePlugin(pluginId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plugins"] });
      toast.success("Plugin status updated");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update plugin status");
    },
  });

  // Update plugin settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ settings }: { settings: any }) => {
      if (selectedPlugin) {
        settings.plugin_id = selectedPlugin.id
        return adminService.updatePluginSettings(selectedPlugin.id, settings);
      } else {
        throw new Error("No plugin selected");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plugins"] });
      toast.success("Configuration saved successfully");
      handleCloseDetails();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save configuration");
    },
  });

  // Match backend plugins with frontend plugins and mock data
  const plugins: Plugin[] = (backendPluginsResponse || []).map((backendPlugin) => {
    // Find matching frontend plugin
    const frontendPlugin = frontendPlugins.find(
      (fp) => fp.manifest.name === backendPlugin.name
    );

    // Find matching mock plugin for UI details


    return {
      id: backendPlugin.id,
      name: backendPlugin.name,
      title: frontendPlugin?.manifest.title || "No title available",
      description: backendPlugin.description || "No description available",
      icon: Puzzle,
      enabled: backendPlugin.enabled,
      category: backendPlugin.category || "Other",
      image: backendPlugin.image,
      color: "from-gray-500/20 to-gray-600/20",
      details: backendPlugin.details || {
        documentationUrl: null,
        configEndpoint: null,
        useCases: [],
        setupSteps: [],
        requirements: [],
        configOptions: []
      },
      config: {},
      backendVersion: backendPlugin.version,
      frontendVersion: frontendPlugin?.manifest.version,
      hasFrontend: !!frontendPlugin,
      installed: backendPlugin.installed ?? true,
      configured: backendPlugin.configured ?? false,
      licensed: backendPlugin.licensed ?? false,
      access_ready: backendPlugin.access_ready ?? false,
      entitlementStatus: backendPlugin.entitlement_status,
      entitlementSource: backendPlugin.entitlement_source,
      entitlementReason: backendPlugin.entitlement_reason,
      planId: backendPlugin.plan_id,
      planName: backendPlugin.plan_name,
      graceEndsAt: backendPlugin.grace_ends_at,
      canEnable: backendPlugin.can_enable ?? false,
      canConfigure: backendPlugin.can_configure ?? false,
    };
  });

  // Open modal when pluginId is in URL
  useEffect(() => {
    if (selectedPluginId && plugins.length > 0 && !selectedPlugin) {
      const plugin = plugins.find(p => p.id === selectedPluginId);
      if (plugin) {
        handleOpenDetails(plugin);
      }
    }
  }, [selectedPluginId, plugins, selectedPlugin]);

  const handleTogglePlugin = async (pluginId: string) => {
    togglePluginMutation.mutate(pluginId);
  };

  const handleOpenDetails = async (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setSelectedPluginId(plugin.id);
    setIsLoadingSettings(true);

    try {
      // Fetch current plugin settings from standard endpoint
      const response = await adminService.getPluginSettings(plugin.id);
      const pluginData = response.data;

      // Parse settings_json if it exists
      let currentSettings: PluginConfig = {};
      if (pluginData.configuration) {
        try {
          const rawSettings = typeof pluginData.configuration === 'string'
            ? JSON.parse(pluginData.configuration)
            : pluginData.configuration;

          // Convert from snake_case to camelCase, then normalize to lowercase for consistent matching
          const camelCaseSettings = keysToCamelCase(rawSettings);
          // Normalize all keys to lowercase to handle acronym case differences (e.g., FPS vs fps)
          for (const key in camelCaseSettings) {
            currentSettings[key.toLowerCase()] = camelCaseSettings[key];
          }
        } catch {
          currentSettings = {};
        }
      }

      // Merge with default values from configOptions
      // Normalize keys to lowercase for consistent matching
      const defaultSettings: PluginConfig = {};

      plugin.details.configOptions.forEach((option) => {
        if (option.defaultValue !== undefined) {
          const normalizedKey = toCamelCase(option.key).toLowerCase();
          defaultSettings[normalizedKey] = option.defaultValue;
        }
      });

      setEditedConfig({ ...defaultSettings, ...currentSettings });
    } catch (error: any) {
      toast.error("Failed to load plugin settings");
      // Fall back to default values
      // Normalize keys to lowercase for consistent matching
      const defaultSettings: PluginConfig = {};
      plugin.details.configOptions.forEach((option) => {
        if (option.defaultValue !== undefined) {
          const normalizedKey = toCamelCase(option.key).toLowerCase();
          defaultSettings[normalizedKey] = option.defaultValue;
        }
      });
      setEditedConfig(defaultSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPlugin(null);
    setSelectedPluginId(undefined);
    setEditedConfig({});
  };

  const handleConfigChange = (key: string, value: any) => {
    // Normalize key to lowercase for consistent storage (handles acronym case differences)
    const normalizedKey = toCamelCase(key).toLowerCase();
    setEditedConfig((prev) => ({ ...prev, [normalizedKey]: value }));
  };

  // Helper to get normalized key from option.key (lowercase for case-insensitive matching)
  const getNormalizedKey = (key: string) => toCamelCase(key).toLowerCase();

  // Helper to get value from editedConfig using normalized key
  const getConfigValue = (key: string) => {
    const normalizedKey = getNormalizedKey(key);
    return editedConfig[normalizedKey];
  };

  const handleSaveConfig = () => {
    if (selectedPlugin) {
      // Convert from camelCase to snake_case for backend
      const snakeCaseSettings = keysToSnakeCase(editedConfig);

      // Save to the plugin's configEndpoint
      updateSettingsMutation.mutate({
        settings: snakeCaseSettings,
      });
    }
  };

  // Filter plugins based on search query
  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = plugins.filter((p) => p.enabled).length;
  const categories = Array.from(new Set(plugins.map((p) => p.category)));

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed  border-[var(--vms-line-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink)]">
                <Sparkles className="h-3.5 w-3.5" />
                Extend Functionality
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[var(--vms-ink)]">
                Plugins
              </h1>
              <p className="text-sm sm:text-base text-[var(--vms-ink-muted)]">
                Enhance your VMS with powerful integrations and features
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--vms-ink)]">
                    {enabledCount}
                  </div>
                  <div className="text-xs text-[var(--vms-ink-muted)] uppercase tracking-wide">
                    Active
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--vms-ink)]">
                    {plugins.length}
                  </div>
                  <div className="text-xs text-[var(--vms-ink-muted)] uppercase tracking-wide">
                    Total
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/plugins/marketplace")}
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                Browse Marketplace
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]" />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10  bg-[var(--vms-surface)]"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count = plugins.filter(
                (p) => p.category === category
              ).length;
              return (
                <Badge key={category} variant="secondary" className="px-3 py-1">
                  {category} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingPlugins && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Plugins Grid */}
        {!isLoadingPlugins && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlugins.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <Card
                  key={plugin.id}
                  className="group overflow-hidden border transition-all duration-300 hover:border-[var(--vms-line-strong)] "
                >
                  {/* Plugin Image/Icon Area */}
                  <div
                    className={`relative h-40 bg-[var(--vms-surface-subtle)] overflow-hidden`}
                  >
                    {plugin.image && (
                      <img src={plugin.image} alt={plugin.name} className="w-full h-full object-cover" />
                    )}
                    {!plugin.image && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-20 w-20 text-[var(--vms-ink-muted)]/30" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={plugin.enabled ? "default" : "secondary"}
                        className={
                          plugin.enabled
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {plugin.enabled
                          ? "Enabled"
                          : plugin.licensed
                            ? "Inactive"
                            : pluginEntitlementLabel(plugin.entitlementStatus)}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="secondary"
                        className=" bg-[var(--vms-surface)]/90 "
                      >
                        {plugin.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg truncate">
                            {titleCase(plugin.title)}
                          </CardTitle>
                          {!plugin.hasFrontend && (
                            <Badge variant="warning" className="text-xs">
                              No Frontend
                            </Badge>
                          )}

                          {plugin.hasFrontend && plugin.backendVersion && plugin.frontendVersion &&
                            plugin.backendVersion !== plugin.frontendVersion && (
                              <Badge variant="warning" className="text-xs">
                                Version Mismatch
                              </Badge>
                            )}
                        </div>
                        <span className="text-[13px] font-medium truncate text-[var(--vms-ink-muted)]">
                          {titleCase(plugin.name)}
                        </span>
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {plugin.description}
                        </CardDescription>
                        {/* Version Info */}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--vms-ink-muted)]">
                          {plugin.backendVersion && (
                            <span>Backend: v{plugin.backendVersion}</span>
                          )}
                          {plugin.frontendVersion && (
                            <span>Frontend: v{plugin.frontendVersion}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)] transition-colors group-hover:text-[var(--vms-ink)]">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">
                          {plugin.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <p className="text-xs text-[var(--vms-ink-muted)]">
                          {plugin.licensed
                            ? "Included in the current plan"
                            : plugin.planName
                              ? `Not licensed under ${plugin.planName}`
                              : pluginEntitlementLabel(plugin.entitlementStatus)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTogglePlugin(plugin.id)}
                        disabled={
                          togglePluginMutation.isPending ||
                          (!plugin.enabled && !plugin.canEnable)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus-visible:ring-[var(--vms-focus)] focus:ring-offset-2 disabled:opacity-50 ${plugin.enabled
                          ? "bg-[var(--vms-action)]"
                          : "bg-gray-200"
                          }`}
                        role="switch"
                        aria-checked={plugin.enabled}
                        aria-label={`${plugin.enabled ? "Disable" : "Enable"} ${plugin.name}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full  bg-[var(--vms-surface)] transition-transform ${plugin.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>

                    {/* Configure Button */}
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleOpenDetails(plugin)}
                    >
                      <Settings className="h-4 w-4" />
                      Configure & Learn More
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPlugins && filteredPlugins.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Puzzle className="h-10 w-10 text-[var(--vms-ink-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No plugins found</h3>
              <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plugin Details Modal */}
      <Modal
        isOpen={!!selectedPlugin}
        onClose={handleCloseDetails}
        title={
          selectedPlugin ? titleCase(selectedPlugin.name) : "Plugin details"
        }
        size="xl"
        className="max-w-4xl"
      >
        {selectedPlugin && (
          <div>
            {/* Modal Header */}
            <div
              className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface)]">
                  <selectedPlugin.icon className="h-8 w-8 text-[var(--vms-ink-muted)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--vms-ink)]">
                    {titleCase(selectedPlugin.name)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                    {selectedPlugin.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedPlugin.category}
                    </Badge>
                    <Badge
                      variant={selectedPlugin.enabled ? "default" : "secondary"}
                      className={
                        selectedPlugin.enabled
                          ? ""
                          : ""
                      }
                    >
                      {selectedPlugin.enabled
                        ? "Enabled"
                        : selectedPlugin.licensed
                          ? "Inactive"
                          : pluginEntitlementLabel(selectedPlugin.entitlementStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              <div className="rounded-[var(--vms-radius-surface)] border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[var(--vms-ink-muted)]">
                      Entitlement and activation
                    </h3>
                    <p className="text-xs text-[var(--vms-ink-muted)]">
                      {selectedPlugin.planName
                        ? `Current plan: ${selectedPlugin.planName}`
                        : "No eligible commercial plan is currently attached."}
                    </p>
                  </div>
                  <Badge variant={selectedPlugin.licensed ? "default" : "secondary"}>
                    {selectedPlugin.licensed && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {!selectedPlugin.licensed && <Lock className="mr-1 h-3 w-3" />}
                    {pluginEntitlementLabel(selectedPlugin.entitlementStatus)}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ["Installed", selectedPlugin.installed],
                    ["Enabled", selectedPlugin.enabled],
                    ["Configured", selectedPlugin.configured],
                    ["Licensed", selectedPlugin.licensed],
                  ].map(([label, active]) => (
                    <div
                      key={String(label)}
                      className="flex items-center gap-2 rounded-lg border bg-background/70 px-3 py-2 text-sm"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${active ? "text-emerald-500" : "text-[var(--vms-ink-muted)]"}`}
                      />
                      {label}
                    </div>
                  ))}
                </div>
                {selectedPlugin.entitlementStatus === "grace" && (
                  <p className="mt-3 text-xs font-medium text-amber-600">
                    Access is temporarily available during the billing grace period.
                  </p>
                )}
                {!selectedPlugin.licensed && (
                  <p className="mt-3 text-xs font-medium text-amber-600">
                    Installation is preserved, but enable and configure actions are locked until the plan is upgraded.
                  </p>
                )}
              </div>

              {/* Use Cases */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--vms-ink-muted)] mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Use Cases
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.useCases?.map((useCase, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-[var(--vms-ink-muted)]"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--vms-action)]" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--vms-ink-muted)] mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-[var(--vms-ink-muted)]"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--vms-ink-muted)] mb-3">
                  <Info className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                  Setup Steps
                </h3>
                <ol className="space-y-3">
                  {selectedPlugin.details.setupSteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-[var(--vms-ink-muted)]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 flex-shrink-0">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Configuration Options */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--vms-ink-muted)] mb-3">
                  <Settings className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                  Configuration
                </h3>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="h-8 w-8 mx-auto mb-2 border-4 border-[var(--vms-action)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[var(--vms-ink-muted)]">Loading settings...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlugin.details.configOptions.map((option) => {
                      const normalizedKey = getNormalizedKey(option.key);
                      return (
                        <div
                          key={option.key}
                          className="rounded-xl border bg-muted/30 p-4"
                        >
                          <label className="block text-sm font-medium text-[var(--vms-ink-muted)] mb-1">
                            {option.label}
                          </label>
                          <p className="text-xs text-[var(--vms-ink-muted)] mb-3">
                            {option.description}
                          </p>

                          {option.type === "boolean" && (
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  option.key,
                                  !editedConfig[normalizedKey]
                                )
                              }
                              disabled={!selectedPlugin.canConfigure}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editedConfig[normalizedKey]
                                ? "bg-[var(--vms-action)]"
                                : "bg-gray-300"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full  bg-[var(--vms-surface)] transition-transform ${editedConfig[normalizedKey]
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                  }`}
                              />
                            </button>
                          )}

                          {option.type === "text" && (
                            <Input
                              type="text"
                              value={editedConfig[normalizedKey] || ""}
                              onChange={(e) =>
                                handleConfigChange(option.key, e.target.value)
                              }
                              disabled={!selectedPlugin.canConfigure}
                              className=" bg-[var(--vms-surface)]"
                            />
                          )}


                          {option.type === "number" && (
                            <Input
                              type="number"
                              value={editedConfig[normalizedKey] ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                // Only update if we have a valid number
                                if (value === "") {
                                  // Allow clearing the field - set to undefined/null
                                  handleConfigChange(option.key, undefined);
                                } else {
                                  const numValue = Number(value);
                                  // Only update if it's a valid number (not NaN)
                                  if (!isNaN(numValue) && isFinite(numValue)) {
                                    handleConfigChange(option.key, numValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure the value is valid on blur
                                const value = e.target.value.trim();
                                if (value === "" || isNaN(Number(value))) {
                                  // Restore previous value or default if invalid
                                  const currentValue = editedConfig[normalizedKey];
                                  if (currentValue === undefined || currentValue === null || isNaN(currentValue)) {
                                    handleConfigChange(option.key, option.defaultValue ?? 0);
                                  }
                                }
                              }}
                              disabled={!selectedPlugin.canConfigure}
                              className=" bg-[var(--vms-surface)]"
                            />
                          )}

                          {option.type === "toggle" && (
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  option.key,
                                  !editedConfig[normalizedKey]
                                )
                              }
                              disabled={!selectedPlugin.canConfigure}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editedConfig[normalizedKey]
                                ? "bg-[var(--vms-action)]"
                                : "bg-gray-300"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full  bg-[var(--vms-surface)] transition-transform ${editedConfig[normalizedKey]
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                  }`}
                              />
                            </button>
                          )}

                          {option.type === "select" && option.options && (
                            <select
                              value={
                                editedConfig[normalizedKey] || option.defaultValue
                              }
                              onChange={(e) =>
                                handleConfigChange(option.key, e.target.value)
                              }
                              disabled={!selectedPlugin.canConfigure}
                              className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                            >
                              {option.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <Button variant="outline" onClick={handleCloseDetails}>
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(selectedPlugin.details.documentationUrl ?? "", "_blank")}
                    disabled={!selectedPlugin.details.documentationUrl}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Documentation
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={handleSaveConfig}
                    disabled={
                      updateSettingsMutation.isPending ||
                      isLoadingSettings ||
                      !selectedPlugin.canConfigure
                    }
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </ >
  );
}
