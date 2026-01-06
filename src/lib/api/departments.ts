import { apiClient } from "@/lib/api/client";

export type Department = {
  id: string;
  name: string;
  code?: string;
  headId?: string | null;
  parentId?: string | null;
  isActive?: boolean;
};

export type CreateDepartmentPayload = {
  name: string;
  code: string;
  headId?: string | null;
  parentId?: string | null;
};

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export async function listDepartments() {
  const res = await apiClient.get<Department[]>("/departments");
  return res.data;
}

export async function getDepartment(id: string) {
  const res = await apiClient.get<Department>(`/departments/${id}`);
  return res.data;
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  const res = await apiClient.post<Department>("/departments", payload);
  return res.data;
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload
) {
  const res = await apiClient.patch<Department>(`/departments/${id}`, payload);
  return res.data;
}

export async function deleteDepartment(id: string) {
  const res = await apiClient.delete(`/departments/${id}`);
  return res.data;
}
