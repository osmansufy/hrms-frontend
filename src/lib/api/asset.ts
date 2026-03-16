import { apiClient } from "@/lib/api/client";

// --- Enums (match backend Prisma) ---
export const ASSET_STATUS = [
  "AVAILABLE",
  "ASSIGNED",
  "UNDER_MAINTENANCE",
  "RETIRED",
] as const;
export type AssetStatus = (typeof ASSET_STATUS)[number];

export const ASSET_CONDITION = [
  "NEW",
  "GOOD",
  "FAIR",
  "POOR",
  "DAMAGED",
] as const;
export type AssetCondition = (typeof ASSET_CONDITION)[number];

export const ASSET_REQUEST_STATUS = [
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "REJECTED",
  "FULFILLED",
] as const;
export type AssetRequestStatus = (typeof ASSET_REQUEST_STATUS)[number];

// --- Types ---
export type AssetType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Asset = {
  id: string;
  assetTag: string;
  assetTypeId?: string | null;
  serialNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  warrantyEnd?: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  location?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assetType?: { id: string; code: string; name: string } | null;
  assignments?: Array<{
    id: string;
    assignedAt: string;
    isActive: boolean;
    employee?: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
    };
  }>;
};

export type AssetAssignment = {
  id: string;
  assetId: string;
  employeeId: string;
  assignedById?: string | null;
  returnedById?: string | null;
  conditionAtAssignment?: AssetCondition | null;
  notes?: string | null;
  assignedAt: string;
  returnedAt?: string | null;
  isActive: boolean;
  asset?: {
    id: string;
    assetTag: string;
    status: AssetStatus;
    assetType?: { id: string; code: string; name: string } | null;
  };
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
};

export type AssetRequest = {
  id: string;
  employeeId: string;
  assetTypeId: string;
  reason?: string | null;
  status: AssetRequestStatus;
  requestedAt?: string;
  
  // Line Manager Approval (Step 1)
  lineManagerApprovedById?: string | null;
  lineManagerApprovedAt?: string | null;
  lineManagerRejectionReason?: string | null;
  
  // HR/Admin Approval (Step 2)
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  
  // Fulfillment
  fulfilledById?: string | null;
  fulfilledAt?: string | null;
  assignmentId?: string | null;
  
  assetType?: { id: string; code: string; name: string } | null;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  lineManagerApprovedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignment?: {
    id: string;
    asset?: { id: string; assetTag: string };
  } | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

// --- Payloads ---
export type CreateAssetPayload = {
  assetTag: string;
  assetTypeId?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyEnd?: string;
  condition: AssetCondition;
  location?: string;
  notes?: string;
};

export type UpdateAssetPayload = Partial<CreateAssetPayload> & {
  status?: AssetStatus;
};

export type AssignAssetPayload = {
  employeeId: string;
  conditionAtAssignment?: AssetCondition;
  notes?: string;
};

export type ReturnAssetPayload = {
  notes?: string;
};

export type CreateAssetTypePayload = {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateAssetTypePayload = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateAssetRequestPayload = {
  assetTypeId: string;
  reason?: string;
};

export type FulfillAssetRequestPayload = {
  assetId: string;
  notes?: string;
};

// --- Assets API ---
export async function listAssets(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetStatus;
  assetTypeId?: string;
  search?: string;
}) {
  const response = await apiClient.get<PaginatedResponse<Asset>>("/assets", {
    params,
  });
  return response.data;
}

export async function getAsset(id: string) {
  const response = await apiClient.get<Asset>(`/assets/${id}`);
  return response.data;
}

export async function createAsset(payload: CreateAssetPayload) {
  const response = await apiClient.post<Asset>("/assets", payload);
  return response.data;
}

export async function updateAsset(id: string, payload: UpdateAssetPayload) {
  const response = await apiClient.patch<Asset>(`/assets/${id}`, payload);
  return response.data;
}

export async function assignAsset(assetId: string, payload: AssignAssetPayload) {
  const response = await apiClient.post<Asset>(
    `/assets/${assetId}/assign`,
    payload
  );
  return response.data;
}

export async function returnAsset(assetId: string, payload?: ReturnAssetPayload) {
  const response = await apiClient.post<Asset>(
    `/assets/${assetId}/return`,
    payload ?? {}
  );
  return response.data;
}

export async function listAssignments(params?: {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  assetId?: string;
  isActive?: boolean;
}) {
  const response = await apiClient.get<PaginatedResponse<AssetAssignment>>(
    "/assets/assignments",
    { params }
  );
  return response.data;
}

export async function getMyAssets() {
  const response = await apiClient.get<PaginatedResponse<AssetAssignment>>(
    "/assets/my-assets"
  );
  return response.data;
}

export async function returnAllAssetsByEmployee(employeeId: string) {
  const response = await apiClient.post<{
    returnedCount: number;
    message: string;
    assignments: Array<{ assignmentId: string; assetId: string }>;
  }>("/assets/offboarding/return-all", { employeeId });
  return response.data;
}

// --- Asset Types API ---
export async function listAssetTypes(activeOnly?: boolean) {
  const response = await apiClient.get<AssetType[]>("/asset-types", {
    params: activeOnly != null ? { activeOnly } : undefined,
  });
  return response.data;
}

export async function getAssetType(id: string) {
  const response = await apiClient.get<AssetType>(`/asset-types/${id}`);
  return response.data;
}

export async function createAssetType(payload: CreateAssetTypePayload) {
  const response = await apiClient.post<AssetType>("/asset-types", payload);
  return response.data;
}

export async function updateAssetType(
  id: string,
  payload: UpdateAssetTypePayload
) {
  const response = await apiClient.patch<AssetType>(
    `/asset-types/${id}`,
    payload
  );
  return response.data;
}

// --- Asset Requests API ---
export async function createAssetRequest(payload: CreateAssetRequestPayload) {
  const response = await apiClient.post<AssetRequest>(
    "/asset-requests",
    payload
  );
  return response.data;
}

export async function getMyAssetRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
}) {
  const response = await apiClient.get<PaginatedResponse<AssetRequest>>(
    "/asset-requests/my-requests",
    { params }
  );
  return response.data;
}

export async function listAssetRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: AssetRequestStatus;
  employeeId?: string;
}) {
  const response = await apiClient.get<PaginatedResponse<AssetRequest>>(
    "/asset-requests",
    { params }
  );
  return response.data;
}

export async function getAssetRequest(id: string) {
  const response = await apiClient.get<AssetRequest>(`/asset-requests/${id}`);
  return response.data;
}

export async function approveAssetRequest(id: string) {
  const response = await apiClient.patch<AssetRequest>(
    `/asset-requests/${id}/approve`
  );
  return response.data;
}

export async function rejectAssetRequest(id: string, rejectionReason: string) {
  const response = await apiClient.patch<AssetRequest>(
    `/asset-requests/${id}/reject`,
    { rejectionReason }
  );
  return response.data;
}

export async function fulfillAssetRequest(
  id: string,
  payload: FulfillAssetRequestPayload
) {
  const response = await apiClient.post<AssetRequest>(
    `/asset-requests/${id}/fulfill`,
    payload
  );
  return response.data;
}

// --- Manager Asset Request Endpoints ---
export async function getManagerPendingAssetRequests() {
  const response = await apiClient.get<AssetRequest[]>(
    "/asset-requests/manager/pending"
  );
  return response.data;
}

// --- HR Asset Request Endpoints ---
export async function getHRProcessingAssetRequests() {
  const response = await apiClient.get<AssetRequest[]>(
    "/asset-requests/hr/processing"
  );
  return response.data;
}
