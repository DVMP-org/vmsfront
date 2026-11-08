"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera as CameraIcon,
  CameraOff,
  CheckCircle2,
  Clock3,
  KeyRound,
  MapPin,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
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
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PluginMetricStrip,
  PluginNotice,
} from "@/components/plugins/PluginUi";
import { parseApiError } from "@/lib/error-utils";
import {
  Camera,
  CameraConnectionTestResult,
  CameraPayload,
  cameraService,
} from "@/services/camera-service";

import {
  CameraFormErrors,
  CameraFormValues,
  cameraToForm,
  capabilitySummary,
  connectionErrorLabel,
  emptyCameraForm,
  statusPresentation,
  validateCameraForm,
} from "../../lib/camera-utils";

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildPayload(
  values: CameraFormValues,
  isEditing: boolean,
): Partial<CameraPayload> {
  const payload: Partial<CameraPayload> = {
    name: values.name.trim(),
    description: optionalValue(values.description) || null,
    vendor: optionalValue(values.vendor) || "generic",
    location: optionalValue(values.location) || null,
    rtsp_url: values.rtsp_url.trim(),
    snapshot_url: optionalValue(values.snapshot_url) || null,
  };

  if (!isEditing || values.stream_url.trim()) {
    payload.stream_url = optionalValue(values.stream_url) || null;
  }

  const usernameReference = values.username_secret_ref.trim();
  const passwordReference = values.password_secret_ref.trim();
  if (!isEditing || usernameReference) {
    payload.username_secret_ref = usernameReference || null;
  }
  if (!isEditing || passwordReference) {
    payload.password_secret_ref = passwordReference || null;
  }

  return payload;
}

function CameraSetupForm({
  camera,
  isSaving,
  onClose,
  onSave,
}: {
  camera: Camera | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: CameraFormValues) => void;
}) {
  const isEditing = Boolean(camera);
  const [values, setValues] = useState<CameraFormValues>(() =>
    camera ? cameraToForm(camera) : { ...emptyCameraForm },
  );
  const [errors, setErrors] = useState<CameraFormErrors>({});

  const updateField = (field: keyof CameraFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCameraForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(values);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="xl"
      title={isEditing ? `Edit ${camera?.name}` : "Register a camera"}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <PluginNotice
          tone="warning"
          title="Credentials stay outside the camera record"
        >
          Enter environment variable references such as{" "}
          <code className="rounded bg-[var(--vms-surface)] px-1.5 py-0.5 text-xs font-semibold">
            env://GATE_CAMERA_PASSWORD
          </code>
          . Raw passwords and credentials embedded in the URL are rejected.
        </PluginNotice>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Camera name"
            aria-label="Camera name"
            showAsterisk
            value={values.name}
            error={errors.name}
            placeholder="Main gate camera"
            onChange={(event) => updateField("name", event.target.value)}
          />
          <Input
            label="Vendor"
            aria-label="Vendor"
            value={values.vendor}
            placeholder="Hikvision, Dahua, Axis, or generic"
            onChange={(event) => updateField("vendor", event.target.value)}
          />
        </div>

        <Input
          label="Camera endpoint"
          aria-label="Camera endpoint"
          showAsterisk
          value={values.rtsp_url}
          error={errors.rtsp_url}
          placeholder="rtsp://192.168.1.40:554/stream"
          description="Allowed transports: RTSP, RTSPS, HTTP, and HTTPS."
          onChange={(event) => updateField("rtsp_url", event.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Snapshot URL"
            aria-label="Snapshot URL"
            value={values.snapshot_url}
            placeholder="https://camera.example.com/snapshot"
            onChange={(event) =>
              updateField("snapshot_url", event.target.value)
            }
          />
          <Input
            label="Stream URL"
            aria-label="Stream URL"
            value={values.stream_url}
            placeholder="Defaults to the camera endpoint"
            onChange={(event) => updateField("stream_url", event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Location"
            aria-label="Location"
            value={values.location}
            placeholder="North vehicle gate"
            leftNode={<MapPin className="h-4 w-4" />}
            onChange={(event) => updateField("location", event.target.value)}
          />
          <Input
            label="Description"
            aria-label="Description"
            value={values.description}
            placeholder="Optional camera notes"
            onChange={(event) => updateField("description", event.target.value)}
          />
        </div>

        <div className="space-y-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
          <div>
            <h3 className="font-semibold">Authentication references</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing && camera?.has_credentials
                ? "Credentials are configured. Leave both fields blank to keep the current references."
                : "Leave both fields blank only when the camera does not require authentication."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Username secret reference"
              aria-label="Username secret reference"
              value={values.username_secret_ref}
              error={errors.username_secret_ref}
              placeholder="env://GATE_CAMERA_USERNAME"
              leftNode={<KeyRound className="h-4 w-4" />}
              autoComplete="off"
              onChange={(event) =>
                updateField("username_secret_ref", event.target.value)
              }
            />
            <Input
              label="Password secret reference"
              aria-label="Password secret reference"
              value={values.password_secret_ref}
              error={errors.password_secret_ref}
              placeholder="env://GATE_CAMERA_PASSWORD"
              leftNode={<KeyRound className="h-4 w-4" />}
              autoComplete="off"
              onChange={(event) =>
                updateField("password_secret_ref", event.target.value)
              }
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEditing ? "Save camera" : "Register camera"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CameraCard({
  camera,
  testResult,
  isTesting,
  onEdit,
  onTest,
}: {
  camera: Camera;
  testResult?: CameraConnectionTestResult;
  isTesting: boolean;
  onEdit: () => void;
  onTest: () => void;
}) {
  const status = statusPresentation(camera.status);
  const capabilities = capabilitySummary(camera.capabilities);
  const resolution = camera.capabilities?.resolution;
  const streamType = camera.capabilities?.stream_type;
  const error = connectionErrorLabel(
    testResult?.error_code || camera.connection_error_code,
  );
  const testedAt = testResult?.tested_at || camera.last_connection_tested_at;

  return (
    <Card>
      <CardHeader className="border-b border-[var(--vms-line)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
              <CameraIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {camera.name}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span>{camera.vendor || "Generic"}</span>
                {camera.location && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span className="truncate">{camera.location}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.variant} className="flex-shrink-0">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            Endpoint
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[var(--vms-ink)]">
            {camera.rtsp_url}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={camera.has_credentials ? "success" : "secondary"}>
            {camera.has_credentials
              ? "Secret-backed auth"
              : "No authentication"}
          </Badge>
          {Boolean(resolution) && (
            <Badge variant="outline">{String(resolution)}</Badge>
          )}
          {Boolean(streamType) && (
            <Badge variant="outline">{String(streamType)}</Badge>
          )}
        </div>

        {capabilities.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {capabilities.map((capability) => (
              <span
                key={capability}
                className="truncate rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] px-2 py-1"
              >
                {capability}
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_32%,white)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]">
            <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{testResult?.message || error}</span>
          </div>
        )}

        {testResult?.success && (
          <div className="flex gap-2 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-success)_32%,white)] bg-[var(--vms-success-subtle)] p-3 text-sm text-[var(--vms-success)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              {testResult.message}
              {testResult.resolution ? ` · ${testResult.resolution}` : ""}
              {testResult.fps ? ` · ${testResult.fps} FPS` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
          <Clock3 className="h-3.5 w-3.5" />
          {testedAt
            ? `Last tested ${new Date(testedAt).toLocaleString()}`
            : status.description}
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            className="flex-1"
            size="sm"
            variant="outline"
            leftNode={<RefreshCw className="h-4 w-4" />}
            isLoading={isTesting}
            onClick={onTest}
          >
            Test connection
          </Button>
          <Button
            className="flex-1"
            size="sm"
            variant="ghost"
            leftNode={<Pencil className="h-4 w-4" />}
            onClick={onEdit}
          >
            Edit setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CameraHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, CameraConnectionTestResult>
  >({});
  const [testingCameraId, setTestingCameraId] = useState<string | null>(null);

  const camerasQuery = useQuery({
    queryKey: ["camera", "cameras"],
    queryFn: cameraService.listCameras,
  });
  const settingsQuery = useQuery({
    queryKey: ["camera", "settings"],
    queryFn: cameraService.getSettings,
  });

  const saveCameraMutation = useMutation({
    mutationFn: async ({
      camera,
      values,
    }: {
      camera: Camera | null;
      values: CameraFormValues;
    }) => {
      const payload = buildPayload(values, Boolean(camera));
      if (camera) {
        return cameraService.updateCamera(camera.id, payload);
      }
      return cameraService.createCamera(payload as CameraPayload);
    },
    onSuccess: (savedCamera, variables) => {
      queryClient.invalidateQueries({ queryKey: ["camera", "cameras"] });
      setShowForm(false);
      setEditingCamera(null);
      toast.success(
        variables.camera
          ? `${savedCamera.name} was updated.`
          : `${savedCamera.name} was registered. Run a connection test next.`,
      );
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });

  const testCameraMutation = useMutation({
    mutationFn: (cameraId: string) => cameraService.testConnection(cameraId),
    onMutate: (cameraId) => {
      setTestingCameraId(cameraId);
    },
    onSuccess: (result, cameraId) => {
      setTestResults((current) => ({ ...current, [cameraId]: result }));
      queryClient.invalidateQueries({ queryKey: ["camera", "cameras"] });
      if (result.success) {
        toast.success("Camera connection succeeded.");
      } else {
        toast.error(result.message || "Camera connection failed.");
      }
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
    onSettled: () => {
      setTestingCameraId(null);
    },
  });

  const cameras = camerasQuery.data?.items || [];
  const ready = cameras.filter((camera) => camera.status === "online").length;
  const needsSetup = cameras.filter(
    (camera) => camera.status === "setup_required",
  ).length;
  const untested = Math.max(cameras.length - ready - needsSetup, 0);

  const openCreateForm = () => {
    setEditingCamera(null);
    setShowForm(true);
  };

  const openEditForm = (camera: Camera) => {
    setEditingCamera(camera);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saveCameraMutation.isPending) return;
    setShowForm(false);
    setEditingCamera(null);
  };

  return (
    <div className="space-y-5 pb-8 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Extensions / Camera"
        title="Camera setup"
        description="Register camera endpoints, verify connectivity, and review the capabilities available to this organization."
        metadata={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Organization-scoped</Badge>
            <Badge variant="outline">Secret references only</Badge>
          </div>
        }
        secondaryActions={
          <Button
            variant="outline"
            leftNode={<Settings className="h-4 w-4" aria-hidden="true" />}
            onClick={() => router.push("/plugins/camera/admin/settings")}
          >
            Camera settings
          </Button>
        }
        primaryAction={
          <Button
            leftNode={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={openCreateForm}
          >
            Add camera
          </Button>
        }
      />

      {camerasQuery.isError && camerasQuery.data ? (
        <PluginNotice
          tone="warning"
          title="Showing the last successful camera snapshot"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => camerasQuery.refetch()}
            >
              Retry
            </Button>
          }
        >
          The latest camera refresh failed.
        </PluginNotice>
      ) : null}

      <PluginMetricStrip
        label="Camera status"
        metrics={[
          {
            label: "Cameras",
            value: cameras.length,
            detail: "Registered in this organization",
            icon: CameraIcon,
          },
          {
            label: "Ready",
            value: ready,
            detail: "Online and usable",
            icon: Wifi,
          },
          {
            label: "Needs setup",
            value: needsSetup,
            detail: "Action required",
            icon: WifiOff,
          },
          {
            label: "Not tested",
            value: untested,
            detail: "Connection unverified",
            icon: RefreshCw,
          },
        ]}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-2.5 text-[var(--vms-action)]">
              <Network className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Network policy</p>
              {settingsQuery.isLoading ? (
                <Skeleton className="mt-2 h-4 w-56" />
              ) : settingsQuery.isError ? (
                <p className="text-sm text-[var(--vms-ink-muted)]">
                  Settings are unavailable. Open camera settings to retry.
                </p>
              ) : (
                <p className="text-sm text-[var(--vms-ink-muted)]">
                  {settingsQuery.data?.allow_private_camera_networks
                    ? "Private LAN camera addresses are allowed. Loopback, link-local, multicast, and metadata destinations remain blocked."
                    : "Private LAN camera addresses are blocked. Use a public or routed camera endpoint."}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant={
              settingsQuery.data?.allow_private_camera_networks
                ? "success"
                : "warning"
            }
          >
            {settingsQuery.data?.allow_private_camera_networks
              ? "Private networks allowed"
              : "Public endpoints only"}
          </Badge>
        </CardContent>
      </Card>

      {camerasQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Card key={index}>
              <CardContent className="space-y-4 py-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : camerasQuery.isError ? (
        <Card>
          <EmptyState
            icon={CameraOff}
            title="Cameras could not be loaded"
            description={parseApiError(camerasQuery.error).message}
            action={{
              label: "Try again",
              onClick: () => camerasQuery.refetch(),
            }}
          />
        </Card>
      ) : cameras.length === 0 ? (
        <Card>
          <EmptyState
            icon={CameraOff}
            title="No cameras configured"
            description="Register the first camera for this organization. Credentials are referenced from server-side environment secrets."
            action={{ label: "Register camera", onClick: openCreateForm }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              testResult={testResults[camera.id]}
              isTesting={testingCameraId === camera.id}
              onEdit={() => openEditForm(camera)}
              onTest={() => testCameraMutation.mutate(camera.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CameraSetupForm
          camera={editingCamera}
          isSaving={saveCameraMutation.isPending}
          onClose={closeForm}
          onSave={(values) =>
            saveCameraMutation.mutate({ camera: editingCamera, values })
          }
        />
      )}
    </div>
  );
}
