import type { PluginManifest } from "@vms/plugin-sdk";

export const electricityPluginManifest: PluginManifest = {
  id: "electricity",
  name: "Electricity",
  version: "0.0.0",
  surfaces: ["workspace"],
  permissions: ["electricity.purchase"],
};
