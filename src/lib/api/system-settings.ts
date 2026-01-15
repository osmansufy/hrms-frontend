import { apiClient } from "@/lib/api/client";

export interface SystemSettings {
  id: string;
  leaveDeductionDay: number;
  allowMobileAttendance: boolean;
  captureEmployeeLocation: boolean;
  employeeIdPrefix: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdateSystemSettingsPayload {
  leaveDeductionDay?: number;
  allowMobileAttendance?: boolean;
  captureEmployeeLocation?: boolean;
  employeeIdPrefix?: string;
  timezone?: string;
}

export const systemSettingsApi = {
  // Public endpoint - accessible to all authenticated users (read-only)
  get: () => apiClient.get<SystemSettings>("/system-settings"),
  // Admin endpoint - only for admins (write access)
  update: (payload: UpdateSystemSettingsPayload) =>
    apiClient.patch<SystemSettings>("/admin/system-settings", payload),
  rebuildEmployeeCodes: () =>
    apiClient.post<{ updated: number }>(
      "/admin/system-settings/rebuild-employee-codes"
    ),
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

export async function rebuildEmployeeCodes(): Promise<{ updated: number }> {
  const res = await systemSettingsApi.rebuildEmployeeCodes();
  return res.data;
}
