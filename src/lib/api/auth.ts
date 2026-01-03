import { apiClient } from "./client-with-refresh";

/**
 * Change password for the authenticated user
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  const res = await apiClient.post<ChangePasswordResponse>(
    "/auth/change-password",
    payload
  );
  return res.data;
}
