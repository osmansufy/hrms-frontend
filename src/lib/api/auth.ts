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

/**
 * Request password reset email (unauthenticated)
 */
export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // only in non-production
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const res = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    payload
  );
  return res.data;
}

/**
 * Reset password with token from email (unauthenticated)
 */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const res = await apiClient.post<ResetPasswordResponse>(
    "/auth/reset-password",
    payload
  );
  return res.data;
}
