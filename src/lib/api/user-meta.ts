import { apiClient } from "@/lib/api/client";

export interface UserMeta {
  id: string | null;
  userId: string;
  allowMobileSignIn: boolean;
  requireGeoFence: boolean;
  allowWebSignIn: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateUserMetaPayload {
  allowMobileSignIn?: boolean;
  requireGeoFence?: boolean;
  allowWebSignIn?: boolean;
}

export const userMetaApi = {
  getMyMeta: () => apiClient.get<UserMeta>("/users/me/meta"),
  updateMyMeta: (payload: UpdateUserMetaPayload) =>
    apiClient.patch<UserMeta>("/users/me/meta", payload),
  getUserMeta: (userId: string) =>
    apiClient.get<UserMeta>(`/users/${userId}/meta`),
  updateUserMeta: (userId: string, payload: UpdateUserMetaPayload) =>
    apiClient.patch<UserMeta>(`/users/${userId}/meta`, payload),
};

export async function getMyMeta(): Promise<UserMeta> {
  const res = await userMetaApi.getMyMeta();
  return res.data;
}

export async function updateMyMeta(
  payload: UpdateUserMetaPayload
): Promise<UserMeta> {
  const res = await userMetaApi.updateMyMeta(payload);
  return res.data;
}

export async function getUserMeta(userId: string): Promise<UserMeta> {
  const res = await userMetaApi.getUserMeta(userId);
  return res.data;
}

export async function updateUserMeta(
  userId: string,
  payload: UpdateUserMetaPayload
): Promise<UserMeta> {
  const res = await userMetaApi.updateUserMeta(userId, payload);
  return res.data;
}
