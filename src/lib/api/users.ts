import { apiClient } from "@/lib/api/client";

export type RoleAssignment = {
  role: { code: string; name?: string };
  isPrimary?: boolean;
};

export type ApiUser = {
  id: string;
  email: string;
  name?: string;
  status?: string;
  roles?: string[];
  roleAssignments?: RoleAssignment[];
};

export async function listUsers() {
  const res = await apiClient.get<ApiUser[]>("/users");
  return res.data;
}

export async function getUser(id: string) {
  const res = await apiClient.get<ApiUser>(`/users/${id}`);
  return res.data;
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const res = await apiClient.patch(`/users/${userId}/password`, {
    newPassword,
  });
  return res.data;
}
