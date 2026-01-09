"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin-service";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { loadPlugins } from "@/lib/plugin_loader";
import { titleCase, keysToCamelCase, keysToSnakeCase, toCamelCase } from "@/lib/utils";
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
import {
  Puzzle,
  Search,
  Sparkles,
  X,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Save,
} from "lucide-react";
import { Plugin, PluginConfig, BackendPlugin } from "@/types/plugin";

export default function PluginsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [editedConfig, setEditedConfig] = useState<PluginConfig>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Fetch plugins from API
  const { data: backendPluginsResponse, isLoading: isLoadingPlugins } = useQuery({
    queryKey: ["admin", "plugins"],
    queryFn: async () => {
      const response = await adminService.getPlugins();
      console.log(response.data);
      return response.data as BackendPlugin[];
    },
  });

  // Load frontend plugins
  const [frontendPlugins, setFrontendPlugins] = useState<any[]>([]);
  useEffect(() => {
    loadPlugins().then(setFrontendPlugins).catch(console.error);
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
    mutationFn: async ({ configEndpoint, settings }: { configEndpoint: string; settings: any }) => {
      if (!configEndpoint) {
        throw new Error("No configuration endpoint available for this plugin");
      }
      if (selectedPlugin) {
        settings.plugin_id = selectedPlugin.id
        return apiClient.put(configEndpoint, settings);
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
      imageUrl: backendPlugin.image,
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
    };
  });

  const handleTogglePlugin = async (pluginId: string) => {
    togglePluginMutation.mutate(pluginId);
  };

  const handleOpenDetails = async (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setIsLoadingSettings(true);

    try {
      // Fetch current plugin settings from standard endpoint
      const response = await adminService.getPluginSettings(plugin.id);
      const pluginData = response.data;

      // Parse settings_json if it exists
      let currentSettings: PluginConfig = {};
      if (pluginData.settings_json) {
        try {
          const rawSettings = typeof pluginData.settings_json === 'string'
            ? JSON.parse(pluginData.settings_json)
            : pluginData.settings_json;

          // Convert from snake_case to camelCase for frontend use
          currentSettings = keysToCamelCase(rawSettings);
        } catch (e) {
          console.error("Failed to parse settings_json:", e);
        }
      }

      // Merge with default values from configOptions
      // Convert option.key to camelCase since we store settings in camelCase
      const defaultSettings: PluginConfig = {};
      plugin.details.configOptions.forEach((option) => {
        if (option.defaultValue !== undefined) {
          const camelKey = toCamelCase(option.key);
          defaultSettings[camelKey] = option.defaultValue;
        }
      });

      setEditedConfig({ ...defaultSettings, ...currentSettings });
    } catch (error: any) {
      console.error("Failed to fetch plugin settings:", error);
      toast.error("Failed to load plugin settings");
      // Fall back to default values
      // Convert option.key to camelCase since we store settings in camelCase
      const defaultSettings: PluginConfig = {};
      plugin.details.configOptions.forEach((option) => {
        if (option.defaultValue !== undefined) {
          const camelKey = toCamelCase(option.key);
          defaultSettings[camelKey] = option.defaultValue;
        }
      });
      setEditedConfig(defaultSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPlugin(null);
    setEditedConfig({});
  };

  const handleConfigChange = (key: string, value: any) => {
    // Convert key to camelCase for consistent storage
    const camelKey = toCamelCase(key);
    setEditedConfig((prev) => ({ ...prev, [camelKey]: value }));
  };

  // Helper to get camelCase key from option.key
  const getCamelKey = (key: string) => toCamelCase(key);

  const handleSaveConfig = () => {
    if (selectedPlugin) {
      // Convert from camelCase to snake_case for backend
      const snakeCaseSettings = keysToSnakeCase(editedConfig);

      // Save to the plugin's configEndpoint
      updateSettingsMutation.mutate({
        configEndpoint: selectedPlugin.details.configEndpoint || '',
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
        <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-[var(--brand-primary,#213928)]/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--brand-primary,#213928)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#213928)]">
                <Sparkles className="h-3.5 w-3.5" />
                Extend Functionality
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-foreground">
                Plugins
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enhance your VMS with powerful integrations and features
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {enabledCount}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Active
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {plugins.length}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
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
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Puzzle className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading plugins...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plugins Grid */}
        {!isLoadingPlugins && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlugins.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <Card
                  key={plugin.id}
                  className="group overflow-hidden border transition-all duration-300 hover:border-[var(--brand-primary,#213928)]/50 hover:shadow-lg"
                >
                  {/* Plugin Image/Icon Area */}
                  <div
                    className={`relative h-40 bg-gradient-to-br ${plugin.color} overflow-hidden`}
                  >
                    {plugin.imageUrl && (
                      <img src={plugin.imageUrl} alt={plugin.name} className="w-full h-full object-cover" />
                    )}
                    {!plugin.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-20 w-20 text-slate-600/30" />
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
                        {plugin.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="secondary"
                        className="bg-white/90 backdrop-blur-sm"
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
                        <span className="text-[13px] font-medium truncate text-muted-foreground">
                          {titleCase(plugin.name)}
                        </span>
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {plugin.description}
                        </CardDescription>
                        {/* Version Info */}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {plugin.backendVersion && (
                            <span>Backend: v{plugin.backendVersion}</span>
                          )}
                          {plugin.frontendVersion && (
                            <span>Frontend: v{plugin.frontendVersion}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-[var(--brand-primary,#213928)]/10 group-hover:text-[var(--brand-primary,#213928)]">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
                      <span className="text-sm font-medium">
                        {plugin.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <button
                        onClick={() => handleTogglePlugin(plugin.id)}
                        disabled={togglePluginMutation.isPending}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#213928)] focus:ring-offset-2 disabled:opacity-50 ${plugin.enabled
                          ? "bg-[var(--brand-primary,#213928)]"
                          : "bg-gray-200"
                          }`}
                        role="switch"
                        aria-checked={plugin.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${plugin.enabled ? "translate-x-6" : "translate-x-1"
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
                <Puzzle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No plugins found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plugin Details Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8 bg-white rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div
              className={`relative rounded-t-2xl bg-gradient-to-br ${selectedPlugin.color} p-6`}
            >
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 transition-colors hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                  <selectedPlugin.icon className="h-8 w-8 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedPlugin.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedPlugin.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {selectedPlugin.category}
                    </Badge>
                    <Badge
                      variant={selectedPlugin.enabled ? "default" : "secondary"}
                      className={
                        selectedPlugin.enabled
                          ? "bg-emerald-500 text-white"
                          : "bg-white/90"
                      }
                    >
                      {selectedPlugin.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Use Cases */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Use Cases
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.useCases?.map((useCase, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary,#213928)] flex-shrink-0" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  Setup Steps
                </h3>
                <ol className="space-y-3">
                  {selectedPlugin.details.setupSteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-slate-600"
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
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <Settings className="h-5 w-5 text-slate-600" />
                  Configuration
                </h3>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="h-8 w-8 mx-auto mb-2 border-4 border-[var(--brand-primary,#213928)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading settings...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlugin.details.configOptions.map((option) => {
                      const camelKey = getCamelKey(option.key);
                      return (
                        <div
                          key={option.key}
                          className="rounded-xl border bg-muted/30 p-4"
                        >
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            {option.label}
                          </label>
                          <p className="text-xs text-muted-foreground mb-3">
                            {option.description}
                          </p>

                          {option.type === "boolean" && (
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  option.key,
                                  !editedConfig[camelKey]
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editedConfig[camelKey]
                                ? "bg-[var(--brand-primary,#213928)]"
                                : "bg-gray-300"
                                }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editedConfig[camelKey]
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                  }`}
                              />
                            </button>
                          )}

                          {option.type === "text" && (
                            <Input
                              type="text"
                              value={editedConfig[camelKey] || ""}
                              onChange={(e) =>
                                handleConfigChange(option.key, e.target.value)
                              }
                              className="bg-white"
                            />
                          )}


                          {option.type === "number" && (
                            <Input
                              type="number"
                              value={editedConfig[camelKey] ?? ""}
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
                                  const currentValue = editedConfig[camelKey];
                                  if (currentValue === undefined || currentValue === null || isNaN(currentValue)) {
                                    handleConfigChange(option.key, option.defaultValue ?? 0);
                                  }
                                }
                              }}
                              className="bg-white"
                            />
                          )}

                          {option.type === "toggle" && (
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  option.key,
                                  !editedConfig[camelKey]
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editedConfig[camelKey]
                                ? "bg-[var(--brand-primary,#213928)]"
                                : "bg-gray-300"
                                }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editedConfig[camelKey]
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                  }`}
                              />
                            </button>
                          )}

                          {option.type === "select" && option.options && (
                            <select
                              value={
                                editedConfig[camelKey] || option.defaultValue
                              }
                              onChange={(e) =>
                                handleConfigChange(option.key, e.target.value)
                              }
                              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
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
            <div className="border-t bg-muted/30 px-6 py-4 rounded-b-2xl">
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
                    className="gap-2 bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.9)]0"
                    onClick={handleSaveConfig}
                    disabled={updateSettingsMutation.isPending || isLoadingSettings}
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ >
  );
}
