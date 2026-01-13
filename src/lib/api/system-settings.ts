import { apiClient } from "@/lib/api/client";

export interface SystemSettings {
  id: string;
  leaveDeductionDay: number;
  allowMobileAttendance: boolean;
  captureEmployeeLocation: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdateSystemSettingsPayload {
  leaveDeductionDay?: number;
  allowMobileAttendance?: boolean;
  captureEmployeeLocation?: boolean;
}

export const systemSettingsApi = {
  // Public endpoint - accessible to all authenticated users (read-only)
  get: () => apiClient.get<SystemSettings>("/system-settings"),
  // Admin endpoint - only for admins (write access)
  update: (payload: UpdateSystemSettingsPayload) =>
    apiClient.patch<SystemSettings>("/admin/system-settings", payload),
};

export async function getSystemSettings(): Promise<SystemSettings> {
  const res = await systemSettingsApi.get();
  return res.data;
}

export async function updateSystemSettings(
  payload: UpdateSystemSettingsPayload
): Promise<SystemSettings> {
  const res = await systemSettingsApi.update(payload);
  return res.data;
}
