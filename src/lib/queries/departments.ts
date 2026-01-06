import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
  type CreateDepartmentPayload,
  type Department,
  type UpdateDepartmentPayload,
} from "@/lib/api/departments";

export const departmentKeys = {
  all: ["departments"] as const,
  list: ["departments", "list"] as const,
  detail: (id: string) => ["departments", "detail", id] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list,
    queryFn: () => listDepartments(),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.list });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) =>
      updateDepartment(id, payload),
    onSuccess: (data: Department) => {
      qc.setQueryData(departmentKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: departmentKeys.list });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.list });
    },
  });
}
