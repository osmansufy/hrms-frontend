import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssetStatus,
  AssetRequestStatus,
  CreateAssetPayload,
  UpdateAssetPayload,
  AssignAssetPayload,
  CreateAssetTypePayload,
  UpdateAssetTypePayload,
  CreateAssetRequestPayload,
  FulfillAssetRequestPayload,
} from "@/lib/api/asset";
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  listAssignments,
  getMyAssets,
  returnAllAssetsByEmployee,
  listAssetTypes,
  getAssetType,
  createAssetType,
  updateAssetType,
  createAssetRequest,
  getMyAssetRequests,
  listAssetRequests,
  getAssetRequest,
  approveAssetRequest,
  rejectAssetRequest,
  fulfillAssetRequest,
} from "@/lib/api/asset";

// --- Query keys ---
export const assetKeys = {
  all: ["assets"] as const,
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: AssetStatus;
    assetTypeId?: string;
    search?: string;
  }) => ["assets", "list", params ?? {}] as const,
  detail: (id: string) => ["assets", id] as const,
  assignments: (params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    assetId?: string;
    isActive?: boolean;
  }) => ["assets", "assignments", params ?? {}] as const,
  myAssets: ["assets", "my-assets"] as const,
};

export const assetTypeKeys = {
  all: ["asset-types"] as const,
  list: (activeOnly?: boolean) =>
    ["asset-types", "list", activeOnly] as const,
  detail: (id: string) => ["asset-types", id] as const,
};

export const assetRequestKeys = {
  all: ["asset-requests"] as const,
  myRequests: (params?: {
    page?: number;
    pageSize?: number;
    status?: AssetRequestStatus;
  }) => ["asset-requests", "my", params ?? {}] as const,
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: AssetRequestStatus;
    employeeId?: string;
  }) => ["asset-requests", "list", params ?? {}] as const,
  detail: (id: string) => ["asset-requests", id] as const,
};

// --- Asset hooks ---
export function useAssets(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetStatus;
  assetTypeId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => listAssets(params),
    staleTime: 60_000,
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id ?? ""),
    queryFn: () => getAsset(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => createAsset(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useUpdateAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAssetPayload) => updateAsset(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.detail(id) });
    },
  });
}

export function useAssignAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignAssetPayload) => assignAsset(assetId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      qc.invalidateQueries({ queryKey: assetKeys.assignments() });
    },
  });
}

export function useReturnAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { notes?: string }) =>
      returnAsset(assetId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      qc.invalidateQueries({ queryKey: assetKeys.assignments() });
    },
  });
}

export function useAssignments(params?: {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  assetId?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: assetKeys.assignments(params),
    queryFn: () => listAssignments(params),
    staleTime: 60_000,
  });
}

export function useMyAssets() {
  return useQuery({
    queryKey: assetKeys.myAssets,
    queryFn: () => getMyAssets(),
    staleTime: 60_000,
  });
}

export function useReturnAllAssetsByEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      returnAllAssetsByEmployee(employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.assignments() });
    },
  });
}

// --- Asset type hooks ---
export function useAssetTypes(activeOnly?: boolean) {
  return useQuery({
    queryKey: assetTypeKeys.list(activeOnly),
    queryFn: () => listAssetTypes(activeOnly),
    staleTime: 5 * 60_000,
  });
}

export function useAssetType(id: string | undefined) {
  return useQuery({
    queryKey: assetTypeKeys.detail(id ?? ""),
    queryFn: () => getAssetType(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetTypePayload) =>
      createAssetType(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetTypeKeys.all });
    },
  });
}

export function useUpdateAssetType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAssetTypePayload) =>
      updateAssetType(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetTypeKeys.all });
      qc.invalidateQueries({ queryKey: assetTypeKeys.detail(id) });
    },
  });
}

// --- Asset request hooks ---
export function useCreateAssetRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetRequestPayload) =>
      createAssetRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.myAssets });
    },
  });
}

export function useMyAssetRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
}) {
  return useQuery({
    queryKey: assetRequestKeys.myRequests(params),
    queryFn: () => getMyAssetRequests(params),
    staleTime: 60_000,
  });
}

export function useAssetRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: assetRequestKeys.list(params),
    queryFn: () => listAssetRequests(params),
    staleTime: 60_000,
  });
}

export function useAssetRequest(id: string | undefined) {
  return useQuery({
    queryKey: assetRequestKeys.detail(id ?? ""),
    queryFn: () => getAssetRequest(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useApproveAssetRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAssetRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.all });
    },
  });
}

export function useRejectAssetRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      rejectAssetRequest(id, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.all });
    },
  });
}

export function useFulfillAssetRequest(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FulfillAssetRequestPayload) =>
      fulfillAssetRequest(requestId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.assignments() });
    },
  });
}
