import { apiClient } from "@/lib/api/client";

export type Designation = {
  id: string;
  title?: string;
  name?: string;
  code?: string;
};

export type CreateDesignationPayload = {
  title: string;
  code: string;
};

export type UpdateDesignationPayload = Partial<CreateDesignationPayload>;

export async function listDesignations() {
  const res = await apiClient.get<Designation[]>("/designations");
  return res.data;
}

export async function createDesignation(payload: CreateDesignationPayload) {
  const res = await apiClient.post<Designation>("/designations", payload);
  return res.data;
}

export async function updateDesignation(id: string, payload: UpdateDesignationPayload) {
  const res = await apiClient.patch<Designation>(`/designations/${id}`, payload);
  return res.data;
}

