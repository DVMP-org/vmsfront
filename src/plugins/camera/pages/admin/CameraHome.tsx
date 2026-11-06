"use client";

import { FormEvent, useMemo, useState } from "react";
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
  Video,
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
import { Skeleton } from "@/components/ui/Skeleton";
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                Credentials stay outside the camera record
              </p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                Enter environment variable references such as{" "}
                <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs dark:bg-black/20">
                  env://GATE_CAMERA_PASSWORD
                </code>
                . Raw passwords and credentials embedded in the URL are
                rejected.
              </p>
            </div>
          </div>
        </div>

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

        <div className="space-y-4 rounded-xl border p-4">
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <CameraIcon className="h-5 w-5" />
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
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Endpoint
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
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
                className="truncate rounded bg-muted/40 px-2 py-1"
              >
                {capability}
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{testResult?.message || error}</span>
          </div>
        )}

        {testResult?.success && (
          <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              {testResult.message}
              {testResult.resolution ? ` · ${testResult.resolution}` : ""}
              {testResult.fps ? ` · ${testResult.fps} FPS` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
  const dashboard = useMemo(() => {
    const ready = cameras.filter((camera) => camera.status === "online").length;
    const needsSetup = cameras.filter(
      (camera) => camera.status === "setup_required",
    ).length;
    const untested = Math.max(cameras.length - ready - needsSetup, 0);
    return { ready, needsSetup, untested };
  }, [cameras]);

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
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-6 text-white shadow-sm sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">
                Organization-scoped
              </Badge>
              <Badge className="border-white/15 bg-white/10 text-white">
                Secret references only
              </Badge>
            </div>
            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <Video className="h-7 w-7 text-indigo-300" />
              Camera setup
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              Register camera endpoints, verify connectivity, and review the
              capabilities available to this organization.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="light-outlined"
              leftNode={<Settings className="h-4 w-4" />}
              onClick={() => router.push("/plugins/camera/admin/settings")}
            >
              Camera settings
            </Button>
            <Button
              variant="light"
              leftNode={<Plus className="h-4 w-4" />}
              onClick={openCreateForm}
            >
              Add camera
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Cameras",
            value: cameras.length,
            icon: CameraIcon,
            color:
              "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200",
          },
          {
            label: "Ready",
            value: dashboard.ready,
            icon: Wifi,
            color:
              "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            label: "Needs setup",
            value: dashboard.needsSetup,
            icon: WifiOff,
            color:
              "text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            label: "Not tested",
            value: dashboard.untested,
            icon: RefreshCw,
            color:
              "text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300",
          },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <StatIcon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Network policy</p>
              {settingsQuery.isLoading ? (
                <Skeleton className="mt-2 h-4 w-56" />
              ) : settingsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Settings are unavailable. Open camera settings to retry.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
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
