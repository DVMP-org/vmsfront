import { apiClient } from "@/lib/api-client";

export type CameraStatus =
  | "online"
  | "offline"
  | "setup_required"
  | "error"
  | string;

export interface CameraSettings {
  plugin_id?: string;
  record_on_scan: boolean;
  default_stream_fps: number;
  stream_quality: "low" | "medium" | "high" | "ultra";
  max_concurrent_streams: number;
  stream_timeout: number;
  auto_screenshot_enabled: boolean;
  screenshot_interval: number;
  screenshot_retention_days: number;
  screenshot_directory: string;
  auto_record_on_motion: boolean;
  auto_record_on_scan: boolean;
  recording_retention_days: number;
  allow_private_camera_networks: boolean;
  connection_test_timeout_seconds: number;
}

export interface Camera {
  id: string;
  name: string;
  description?: string | null;
  vendor: string;
  rtsp_url: string;
  location?: string | null;
  status: CameraStatus;
  snapshot_url?: string | null;
  stream_url?: string | null;
  has_credentials: boolean;
  capabilities?: Record<string, unknown> | null;
  last_connection_tested_at?: string | null;
  connection_error_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CameraListResponse {
  items: Camera[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CameraPayload {
  name: string;
  description?: string | null;
  vendor?: string | null;
  location?: string | null;
  rtsp_url: string;
  snapshot_url?: string | null;
  stream_url?: string | null;
  username_secret_ref?: string | null;
  password_secret_ref?: string | null;
}

export interface CameraConnectionTestResult {
  success: boolean;
  status: string;
  message: string;
  stream_type?: string | null;
  resolution?: string | null;
  fps?: number | null;
  authenticated: boolean;
  capabilities?: Record<string, unknown> | null;
  error_code?: string | null;
  tested_at: string;
}

const CAMERA_API = "/camera";

export const cameraService = {
  async listCameras(): Promise<CameraListResponse> {
    return apiClient.get<CameraListResponse>(`${CAMERA_API}/`, {
      params: {
        page: 1,
        page_size: 100,
      },
    });
  },

  async createCamera(payload: CameraPayload): Promise<Camera> {
    return apiClient.post<Camera>(`${CAMERA_API}/`, payload);
  },

  async updateCamera(
    cameraId: string,
    payload: Partial<CameraPayload>,
  ): Promise<Camera> {
    return apiClient.put<Camera>(`${CAMERA_API}/${cameraId}`, payload);
  },

  async deleteCamera(
    cameraId: string,
  ): Promise<{ message: string; id: string }> {
    return apiClient.delete<{ message: string; id: string }>(
      `${CAMERA_API}/${cameraId}`,
    );
  },

  async testConnection(cameraId: string): Promise<CameraConnectionTestResult> {
    return apiClient.post<CameraConnectionTestResult>(
      `${CAMERA_API}/${cameraId}/connection-test`,
    );
  },

  async getSettings(): Promise<CameraSettings> {
    return apiClient.get<CameraSettings>(`${CAMERA_API}/settings`);
  },

  async updateSettings(settings: CameraSettings): Promise<CameraSettings> {
    return apiClient.put<CameraSettings>(`${CAMERA_API}/settings`, settings);
  },
};
