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

export interface CreateUserPayload {
  email: string;
  password: string;
  role: "ADMIN" | "HR_MANAGER" | "EMPLOYEE" | "SUPER_ADMIN";
  firstName: string;
  lastName: string;
  employeeCode?: string;
  departmentId?: string;
  designationId?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { id: string; name: string };
    designation?: { id: string; title: string };
  };
}

export const usersApi = {
  list: () => apiClient.get<User[]>("/users"),
  create: (payload: CreateUserPayload) =>
    apiClient.post<User>("/users", payload),
  updateRole: (id: string, role: string) =>
    apiClient.put(`/users/${id}/role`, { role }),
  activate: (id: string) => apiClient.put(`/users/${id}/activate`),
  deactivate: (id: string) => apiClient.put(`/users/${id}/deactivate`),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export async function listUsers() {
  const res = await usersApi.list();
  return res.data;
}

export async function createUser(payload: CreateUserPayload) {
  const res = await usersApi.create(payload);
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
