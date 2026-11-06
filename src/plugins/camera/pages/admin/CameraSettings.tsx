"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock3,
  HardDrive,
  Network,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { parseApiError } from "@/lib/error-utils";
import { CameraSettings, cameraService } from "@/services/camera-service";

const defaultSettings: CameraSettings = {
  record_on_scan: false,
  default_stream_fps: 25,
  stream_quality: "high",
  max_concurrent_streams: 10,
  stream_timeout: 5000,
  auto_screenshot_enabled: true,
  screenshot_interval: 30,
  screenshot_retention_days: 90,
  screenshot_directory: "storage/camera_screenshots",
  auto_record_on_motion: false,
  auto_record_on_scan: false,
  recording_retention_days: 30,
  allow_private_camera_networks: true,
  connection_test_timeout_seconds: 10,
};

function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

function updateNumber(
  settings: CameraSettings,
  key: keyof CameraSettings,
  value: string,
): CameraSettings {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return settings;
  return { ...settings, [key]: parsed };
}

export default function CameraSettingsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CameraSettings | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["camera", "settings"],
    queryFn: cameraService.getSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft({ ...defaultSettings, ...settingsQuery.data });
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: cameraService.updateSettings,
    onSuccess: (settings) => {
      setDraft(settings);
      queryClient.setQueryData(["camera", "settings"], settings);
      toast.success("Camera settings saved for this organization.");
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });

  if (settingsQuery.isLoading || (!draft && !settingsQuery.isError)) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (settingsQuery.isError || !draft) {
    return (
      <Card>
        <EmptyState
          icon={SlidersHorizontal}
          title="Camera settings could not be loaded"
          description={parseApiError(settingsQuery.error).message}
          action={{
            label: "Try again",
            onClick: () => settingsQuery.refetch(),
          }}
        />
      </Card>
    );
  }

  const setValue = <K extends keyof CameraSettings>(
    key: K,
    value: CameraSettings[K],
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate(draft);
      }}
    >
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 px-5 py-6 text-white shadow-sm sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="border-white/15 bg-white/10 text-white">
              Organization-scoped
            </Badge>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <SlidersHorizontal className="h-7 w-7 text-indigo-300" />
              Camera settings
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Configure secure connectivity, stream limits, screenshots, and
              retention for cameras in this organization only.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="light-outlined"
              leftNode={<RefreshCw className="h-4 w-4" />}
              onClick={() => settingsQuery.refetch()}
              disabled={saveMutation.isPending}
            >
              Reload
            </Button>
            <Button
              type="submit"
              variant="light"
              leftNode={<Save className="h-4 w-4" />}
              isLoading={saveMutation.isPending}
            >
              Save settings
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Network className="h-5 w-5 text-indigo-600" />
              Connectivity and security
            </CardTitle>
            <CardDescription>
              The backend enforces these limits before it connects to a camera.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              checked={draft.allow_private_camera_networks}
              label="Allow private camera networks"
              description="Allows RFC1918 LAN addresses. Loopback, link-local, multicast, metadata, and unspecified destinations stay blocked."
              onChange={(checked) =>
                setValue("allow_private_camera_networks", checked)
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Connection test timeout (seconds)"
                aria-label="Connection test timeout (seconds)"
                type="number"
                min={1}
                max={30}
                value={draft.connection_test_timeout_seconds}
                onChange={(event) =>
                  setDraft(
                    updateNumber(
                      draft,
                      "connection_test_timeout_seconds",
                      event.target.value,
                    ),
                  )
                }
              />
              <Input
                label="Stream timeout (milliseconds)"
                aria-label="Stream timeout (milliseconds)"
                type="number"
                min={1000}
                max={30000}
                value={draft.stream_timeout}
                onChange={(event) =>
                  setDraft(
                    updateNumber(draft, "stream_timeout", event.target.value),
                  )
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Maximum concurrent streams"
                aria-label="Maximum concurrent streams"
                type="number"
                min={1}
                max={50}
                value={draft.max_concurrent_streams}
                onChange={(event) =>
                  setDraft(
                    updateNumber(
                      draft,
                      "max_concurrent_streams",
                      event.target.value,
                    ),
                  )
                }
              />
              <Input
                label="Default stream FPS"
                aria-label="Default stream FPS"
                type="number"
                min={1}
                max={60}
                value={draft.default_stream_fps}
                onChange={(event) =>
                  setDraft(
                    updateNumber(
                      draft,
                      "default_stream_fps",
                      event.target.value,
                    ),
                  )
                }
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="stream-quality"
              >
                Default stream quality
              </label>
              <select
                id="stream-quality"
                value={draft.stream_quality}
                onChange={(event) =>
                  setValue(
                    "stream_quality",
                    event.target.value as CameraSettings["stream_quality"],
                  )
                }
                className="h-10 w-full rounded border bg-background px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-indigo-600" />
              Recording behavior
            </CardTitle>
            <CardDescription>
              Keep automatic capture predictable and within this tenant&apos;s
              storage policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              checked={draft.record_on_scan}
              label="Record when a gate pass is scanned"
              description="Start recording when an access-control scan is accepted or rejected."
              onChange={(checked) => setValue("record_on_scan", checked)}
            />
            <SettingToggle
              checked={draft.auto_record_on_motion}
              label="Record on motion events"
              description="Start recording when a supported camera reports motion."
              onChange={(checked) => setValue("auto_record_on_motion", checked)}
            />
            <SettingToggle
              checked={draft.auto_record_on_scan}
              label="Record scans automatically"
              description="Use gate scan events as a secondary trigger for recording."
              onChange={(checked) => setValue("auto_record_on_scan", checked)}
            />
            <Input
              label="Recording retention (days)"
              aria-label="Recording retention (days)"
              type="number"
              min={1}
              max={3650}
              value={draft.recording_retention_days}
              leftNode={<Clock3 className="h-4 w-4" />}
              onChange={(event) =>
                setDraft(
                  updateNumber(
                    draft,
                    "recording_retention_days",
                    event.target.value,
                  ),
                )
              }
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5 text-indigo-600" />
              Screenshots and storage
            </CardTitle>
            <CardDescription>
              Screenshot storage is scoped by the plugin&apos;s runtime. Use a
              relative path that cannot escape the configured storage root.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              checked={draft.auto_screenshot_enabled}
              label="Automatic screenshots"
              description="Capture a still frame periodically while a stream is active."
              onChange={(checked) =>
                setValue("auto_screenshot_enabled", checked)
              }
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Screenshot interval (seconds)"
                aria-label="Screenshot interval (seconds)"
                type="number"
                min={5}
                max={3600}
                value={draft.screenshot_interval}
                disabled={!draft.auto_screenshot_enabled}
                onChange={(event) =>
                  setDraft(
                    updateNumber(
                      draft,
                      "screenshot_interval",
                      event.target.value,
                    ),
                  )
                }
              />
              <Input
                label="Screenshot retention (days)"
                aria-label="Screenshot retention (days)"
                type="number"
                min={1}
                max={3650}
                value={draft.screenshot_retention_days}
                disabled={!draft.auto_screenshot_enabled}
                onChange={(event) =>
                  setDraft(
                    updateNumber(
                      draft,
                      "screenshot_retention_days",
                      event.target.value,
                    ),
                  )
                }
              />
              <Input
                label="Screenshot directory"
                aria-label="Screenshot directory"
                value={draft.screenshot_directory}
                disabled={!draft.auto_screenshot_enabled}
                placeholder="storage/camera_screenshots"
                onChange={(event) =>
                  setValue("screenshot_directory", event.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex gap-3 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">Tenant boundary preserved</p>
            <p className="mt-1 text-sm text-muted-foreground">
              These settings are stored on this organization&apos;s camera
              plugin installation. Another tenant cannot read or reuse them.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          leftNode={<Save className="h-4 w-4" />}
          isLoading={saveMutation.isPending}
        >
          Save camera settings
        </Button>
      </div>
    </form>
  );
}
