import type { Camera, CameraStatus } from "@/services/camera-service";

export const SECRET_REFERENCE_PATTERN = /^env:\/\/[A-Z][A-Z0-9_]*$/;

export interface CameraFormValues {
  name: string;
  description: string;
  vendor: string;
  location: string;
  rtsp_url: string;
  snapshot_url: string;
  stream_url: string;
  username_secret_ref: string;
  password_secret_ref: string;
}

export type CameraFormErrors = Partial<Record<keyof CameraFormValues, string>>;

export const emptyCameraForm: CameraFormValues = {
  name: "",
  description: "",
  vendor: "generic",
  location: "",
  rtsp_url: "",
  snapshot_url: "",
  stream_url: "",
  username_secret_ref: "",
  password_secret_ref: "",
};

export function cameraToForm(camera: Camera): CameraFormValues {
  return {
    name: camera.name,
    description: camera.description || "",
    vendor: camera.vendor || "generic",
    location: camera.location || "",
    rtsp_url: camera.rtsp_url,
    snapshot_url: camera.snapshot_url || "",
    stream_url: camera.stream_url || "",
    username_secret_ref: "",
    password_secret_ref: "",
  };
}

export function validateSecretReference(value: string): string | null {
  if (!value) return null;
  if (!SECRET_REFERENCE_PATTERN.test(value)) {
    return "Use env:// followed by an uppercase variable name, for example env://GATE_CAMERA_PASSWORD.";
  }
  return null;
}

export function validateCameraForm(values: CameraFormValues): CameraFormErrors {
  const errors: CameraFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Camera name is required.";
  }
  if (!values.rtsp_url.trim()) {
    errors.rtsp_url = "A camera endpoint is required.";
  } else if (!/^(rtsps?|https?):\/\//i.test(values.rtsp_url.trim())) {
    errors.rtsp_url = "Use an RTSP, RTSPS, HTTP, or HTTPS camera endpoint.";
  } else if (/^[a-z][a-z0-9+.-]*:\/\/[^/@\s]+@/i.test(values.rtsp_url.trim())) {
    errors.rtsp_url =
      "Credentials embedded in the endpoint URL are not allowed. Use secret references instead.";
  }

  const usernameError = validateSecretReference(
    values.username_secret_ref.trim(),
  );
  const passwordError = validateSecretReference(
    values.password_secret_ref.trim(),
  );
  if (usernameError) errors.username_secret_ref = usernameError;
  if (passwordError) errors.password_secret_ref = passwordError;

  return errors;
}

export function statusPresentation(status: CameraStatus): {
  label: string;
  variant: "success" | "warning" | "danger" | "secondary";
  description: string;
} {
  switch (status) {
    case "online":
      return {
        label: "Ready",
        variant: "success",
        description: "The last connection test succeeded.",
      };
    case "setup_required":
      return {
        label: "Needs setup",
        variant: "warning",
        description: "Complete the camera connection setup.",
      };
    case "error":
      return {
        label: "Connection issue",
        variant: "danger",
        description: "The camera needs attention.",
      };
    case "offline":
      return {
        label: "Not tested",
        variant: "secondary",
        description: "Run a connection test to verify this camera.",
      };
    default:
      return {
        label: status || "Unknown",
        variant: "secondary",
        description: "Camera state is not recognized.",
      };
  }
}

export function connectionErrorLabel(code?: string | null): string | null {
  if (!code) return null;
  const labels: Record<string, string> = {
    connection_timeout: "The camera did not respond before the timeout.",
    connection_failed: "The camera endpoint could not be reached.",
    authentication_failed: "The camera rejected the configured credentials.",
    credentials_unavailable:
      "A referenced secret is not available to the server.",
    invalid_endpoint: "The saved camera endpoint is invalid.",
    unsafe_endpoint: "The saved camera endpoint violates network policy.",
  };
  return labels[code] || `Connection error: ${code.replaceAll("_", " ")}.`;
}

export function capabilitySummary(
  capabilities?: Record<string, unknown> | null,
): string[] {
  if (!capabilities) return [];

  return Object.entries(capabilities)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
    .slice(0, 4)
    .map(([key, value]) => {
      const label = key
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      return `${label}: ${String(value)}`;
    });
}
