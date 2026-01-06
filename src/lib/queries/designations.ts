import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDesignation,
  deleteDesignation,
  listDesignations,
  updateDesignation,
  type CreateDesignationPayload,
  type Designation,
  type UpdateDesignationPayload,
} from "@/lib/api/designations";

export const designationKeys = {
  list: ["designations", "list"] as const,
};

export function useDesignationsList() {
  return useQuery({
    queryKey: designationKeys.list,
    queryFn: () => listDesignations(),
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDesignationPayload) =>
      createDesignation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: designationKeys.list });
    },
  });
}

export function useUpdateDesignation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDesignationPayload) =>
      updateDesignation(id, payload),
    onSuccess: (data: Designation) => {
      qc.setQueryData(designationKeys.list, (prev: Designation[] | undefined) =>
        prev ? prev.map((d) => (d.id === data.id ? data : d)) : undefined
      );
      qc.invalidateQueries({ queryKey: designationKeys.list });
    },
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: designationKeys.list });
    },
  });
}
