import type { PluginManifest } from "@vms/plugin-sdk";

export const cameraPluginManifest: PluginManifest = {
  id: "camera",
  name: "Camera",
  version: "0.0.0",
  surfaces: ["admin", "access"],
  permissions: ["cameras.list", "cameras.configure"],
};
