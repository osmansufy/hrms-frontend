import { apiClient } from "@/lib/api/client";

export type LeaveType = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  leavePolicy?: {
    maxDays?: number | null;
    carryForwardCap?: number | null;
    allowAdvance?: boolean | null;
    encashmentFlag?: boolean | null;
    requireDocThresholdDays?: number | null;
  } | null;
};

export type LeaveRecord = {
  id: string;
  leaveTypeId: string;
  leaveType?: { id: string; name: string; code: string } | null;
  reason: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type LeaveApprovalStep = {
  id: string;
  leaveId: string;
  approverUserId: string;
  approverUser?: {
    id: string;
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
    } | null;
  };
  approvalLevel: number;
  action: string | null;
  comments: string | null;
  actionDate: string | null;
  createdAt: string;
};

export type LeaveDetails = {
  id: string;
  leaveTypeId: string;
  leaveType: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
  };
  userId: string;
  user: {
    id: string;
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
      employeeCode: string;
    } | null;
  };
  reason: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  supportingDocumentUrl?: string | null;
  approvalSteps: LeaveApprovalStep[];
  balanceImpact?: {
    balanceBefore: number;
    balanceAfter: number;
    deducted: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type ApplyLeavePayload = {
  leaveTypeId: string;
  reason: string;
  startDate: string;
  endDate: string;
};

export async function listLeaveTypes() {
  const response = await apiClient.get<LeaveType[]>("/leave/types");
  return response.data;
}

export async function applyLeave(payload: ApplyLeavePayload) {
  const response = await apiClient.post<LeaveRecord>("/leave/apply", payload);
  return response.data;
}

export async function listLeavesByUser(userId: string) {
  const response = await apiClient.get<LeaveRecord[]>(`/leave/user/${userId}`);
  return response.data;
}

export async function getLeaveDetails(leaveId: string) {
  const response = await apiClient.get<LeaveDetails>(`/leave/${leaveId}`);
  return response.data;
}

export async function getMyLeavePolicies(userId: string) {
  const response = await apiClient.get(`/leave/policies/user/${userId}`);
  return response.data;
}

// Admin/HR Manager Endpoints

export type LeavePolicy = {
  id: string;
  leaveTypeId: string;
  maxDays?: number | null;
  encashmentFlag: boolean;
  carryForwardCap?: number | null;
  allowAdvance: boolean;
  requireDocThresholdDays?: number | null;
  accrualRuleId?: string | null;
  noticeRules?: LeaveNoticeRule[];
  accrualRule?: LeaveAccrualRule | null;
  leaveType?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type LeaveNoticeRule = {
  id: string;
  leavePolicyId: string;
  minLength?: number | null;
  maxLength?: number | null;
  noticeDays: number;
  createdAt: string;
};

export type LeaveAccrualRule = {
  id: string;
  frequency: "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  ratePerPeriod: number;
  accrualStrategy: "FIXED" | "TENURE_BASED";
  prorateFlag: boolean;
  startAfterDays?: number | null;
  resetMonthDay?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveAmendment = {
  id: string;
  originalLeaveId: string;
  newStartDate?: string | null;
  newEndDate?: string | null;
  changeType: "AMEND" | "CANCEL";
  reason: string;
  status: string;
  payrollImpactFlag: boolean;
  createdById: string;
  supportingDocumentUrl?: string | null;
  noticeMet?: boolean | null;
  overrideReason?: string | null;
  createdAt: string;
  updatedAt: string;
  originalLeave?: LeaveRecord;
  createdBy?: {
    id: string;
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
    };
  };
};

export type LeaveApproval = {
  id: string;
  leaveId?: string | null;
  amendmentId?: string | null;
  step: number;
  approverId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment?: string | null;
  actedAt?: string | null;
  createdAt: string;
};

export type LeaveWithApprovals = LeaveRecord & {
  approvals?: LeaveApproval[];
  user?: {
    id: string;
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
    };
  };
};

export type CreateLeavePolicyPayload = {
  leaveTypeId: string;
  maxDays?: number;
  encashmentFlag?: boolean;
  carryForwardCap?: number;
  allowAdvance?: boolean;
  requireDocThresholdDays?: number;
  accrualRuleId?: string;
  noticeRules?: {
    minLength?: number;
    maxLength?: number;
    noticeDays: number;
  }[];
};

export type CreateAccrualRulePayload = {
  frequency: "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  ratePerPeriod: number;
  accrualStrategy?: "FIXED" | "TENURE_BASED";
  prorateFlag?: boolean;
  startAfterDays?: number;
  resetMonthDay?: number;
};

export type CreateAmendmentPayload = {
  originalLeaveId: string;
  newStartDate?: string;
  newEndDate?: string;
  changeType: "AMEND" | "CANCEL";
  reason: string;
  supportingDocumentUrl?: string;
  noticeMet?: boolean;
  overrideReason?: string;
};

// Leave Policy Management
export async function createLeavePolicy(payload: CreateLeavePolicyPayload) {
  const response = await apiClient.post<LeavePolicy>("/leave/policy", payload);
  return response.data;
}

export async function getLeavePolicy(leaveTypeId: string) {
  const response = await apiClient.get<LeavePolicy>(
    `/leave/policy/${leaveTypeId}`
  );
  return response.data;
}

export async function updateLeavePolicy(
  leaveTypeId: string,
  payload: Partial<CreateLeavePolicyPayload>
) {
  const response = await apiClient.put<LeavePolicy>(
    `/leave/policy/${leaveTypeId}`,
    payload
  );
  return response.data;
}

export async function addNoticeRule(
  leavePolicyId: string,
  payload: { minLength?: number; maxLength?: number; noticeDays: number }
) {
  const response = await apiClient.post<LeaveNoticeRule>(
    `/leave/policy/${leavePolicyId}/notice-rule`,
    payload
  );
  return response.data;
}

// Accrual Rule Management
export async function createAccrualRule(payload: CreateAccrualRulePayload) {
  const response = await apiClient.post<LeaveAccrualRule>(
    "/leave/accrual-rule",
    payload
  );
  return response.data;
}

export async function listAccrualRules() {
  const response = await apiClient.get<LeaveAccrualRule[]>(
    "/leave/accrual-rule"
  );
  return response.data;
}

export async function getAccrualRule(id: string) {
  const response = await apiClient.get<LeaveAccrualRule>(
    `/leave/accrual-rule/${id}`
  );
  return response.data;
}

export async function updateAccrualRule(
  id: string,
  payload: Partial<CreateAccrualRulePayload>
) {
  const response = await apiClient.put<LeaveAccrualRule>(
    `/leave/accrual-rule/${id}`,
    payload
  );
  return response.data;
}

// Leave Approval
export async function approveLeave(id: string) {
  const response = await apiClient.patch<LeaveRecord>(`/leave/${id}/approve`);
  return response.data;
}

export async function rejectLeave(id: string) {
  const response = await apiClient.patch<LeaveRecord>(`/leave/${id}/reject`);
  return response.data;
}

export async function bulkApproveLeaves(leaveIds: string[], comment?: string) {
  const response = await apiClient.post(`/leave/bulk/approve`, {
    leaveIds,
    comment,
  });
  return response.data;
}

export async function bulkRejectLeaves(leaveIds: string[], comment: string) {
  const response = await apiClient.post(`/leave/bulk/reject`, {
    leaveIds,
    comment,
  });
  return response.data;
}

// Line Manager Endpoints (for employees who are managers)

// Get pending leaves from subordinates (PENDING status, waiting for manager approval)
export async function getPendingLeavesForManager() {
  const response = await apiClient.get<LeaveWithApprovals[]>(
    "/leave/manager/pending"
  );
  return response.data;
}

// Get leaves approved by manager, waiting for HR (PROCESSING status)
export async function getApprovedByManagerPendingHR() {
  const response = await apiClient.get<LeaveWithApprovals[]>(
    "/leave/manager/approved-pending-hr"
  );
  return response.data;
}

// Get all leaves from subordinates (for viewing team leave calendar)
export async function getSubordinatesLeaves() {
  const response = await apiClient.get<LeaveWithApprovals[]>(
    "/leave/manager/subordinates"
  );
  return response.data;
}

// Admin endpoint - kept for backwards compatibility
export async function getPendingHRApprovals() {
  const response = await apiClient.get<LeaveWithApprovals[]>(
    "/leave/manager/approved-pending-hr"
  );
  return response.data;
}

// Amendment Management
export async function createAmendment(payload: CreateAmendmentPayload) {
  const response = await apiClient.post<LeaveAmendment>(
    "/leave/amendment",
    payload
  );
  return response.data;
}

export async function listAmendments() {
  const response = await apiClient.get<LeaveAmendment[]>("/leave/amendment");
  return response.data;
}

export async function getAmendment(id: string) {
  const response = await apiClient.get<LeaveAmendment>(
    `/leave/amendment/${id}`
  );
  return response.data;
}

export async function approveAmendment(id: string) {
  const response = await apiClient.patch<LeaveAmendment>(
    `/leave/amendment/${id}/approve`
  );
  return response.data;
}

export async function rejectAmendment(id: string) {
  const response = await apiClient.patch<LeaveAmendment>(
    `/leave/amendment/${id}/reject`
  );
  return response.data;
}

// Accrual Processing
export async function processAccruals(userId: string, leaveTypeId: string) {
  const response = await apiClient.post(
    `/leave/accrual/process/${userId}/${leaveTypeId}`
  );
  return response.data;
}
// Leave Balance Types
export type LeaveBalance = {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  leaveYear: string;
  available: number;
  carried: number;
  used: number;
  openingBalance: number;
  accrued: number;
  lapsed: number;
  adjusted: number;
  ledgerEntries: number;
  policy?: {
    maxDays?: number;
    carryForwardCap?: number;
    encashmentFlag?: boolean;
  };
  lastAccruedAt?: Date;
  id?: string;
  userId?: string;
  accrualRuleId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type LeaveBalanceDetails = LeaveBalance & {
  usedDays: number;
  availableDays: number;
  totalAllocated: number;
  leaveHistory: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    reason: string;
    createdAt: Date;
  }[];
};

export type UserBalanceWithEmployee = LeaveBalance & {
  user: {
    id: string;
    email: string;
    employee: {
      firstName: string;
      lastName: string;
      employeeCode: string;
    } | null;
  };
};

export type AdjustBalancePayload = {
  userId: string;
  leaveTypeId: string;
  adjustment: number;
  reason: string;
};

export type InitializeBalancePayload = {
  userId: string;
  leaveTypeId: string;
  initialBalance: number;
  accrualRuleId?: string;
};

// Leave Balance API Functions
export async function getUserBalances() {
  const response = await apiClient.get<LeaveBalance[]>("/leave/balance");
  return response.data;
}

export async function getBalanceDetails(leaveTypeId: string) {
  const response = await apiClient.get<LeaveBalanceDetails>(
    `/leave/balance/${leaveTypeId}`
  );
  return response.data;
}

export async function getUserLeaveBalance(
  userId: string,
  leaveTypeId: string,
  leaveYear?: string
) {
  const params = leaveYear ? { leaveYear } : {};
  const response = await apiClient.get<LeaveBalanceDetails>(
    `/leave/balance/user/${userId}/type/${leaveTypeId}`,
    { params }
  );
  return response.data;
}

export async function adjustBalance(payload: AdjustBalancePayload) {
  const response = await apiClient.post<LeaveBalance>(
    "/leave/balance/adjust",
    payload
  );
  return response.data;
}

export async function initializeBalance(payload: InitializeBalancePayload) {
  const response = await apiClient.post<LeaveBalance>(
    "/leave/balance/initialize",
    payload
  );
  return response.data;
}

export async function getAllUsersBalances() {
  const response = await apiClient.get<UserBalanceWithEmployee[]>(
    "/leave/balance/all/users"
  );
  return response.data;
}

// Admin Dashboard API Functions

export type AdminLeaveBalanceItem = {
  id: string;
  userId: string;
  employee: {
    name: string;
    email: string;
    employeeCode: string;
    department: {
      id: string;
      name: string;
    };
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
  leaveYear: number;
  balances: {
    openingBalance: number;
    accrued: number;
    carried: number;
    used: number;
    adjusted: number;
    encashed: number;
    available: number;
    pending: number;
    expired: number;
  };
  status: "NORMAL" | "LOW" | "NEGATIVE";
  lastUpdated: string;
};

export type AdminLeaveBalancesResponse = {
  data: AdminLeaveBalanceItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  statistics: {
    totalEmployees: number;
    totalBalances: number;
    negativeBalances: number;
    lowBalances: number;
  };
};

export type AdminLeaveBalancesParams = {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  leaveTypeId?: string;
  year?: number;
  status?: "low" | "normal" | "negative";
  search?: string;
};

export type AdminBalanceSummaryResponse = {
  year: number;
  overview: {
    totalEmployees: number;
    totalDaysAllocated: number;
    totalDaysUsed: number;
    totalDaysAvailable: number;
    totalDaysPending: number;
    overallUtilizationRate: number;
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    employeeCount: number;
    allocated: number;
    used: number;
    available: number;
    pending: number;
    utilizationRate: number;
  }>;
  byLeaveType: Array<{
    leaveTypeId: string;
    leaveTypeName: string;
    employeeCount: number;
    allocated: number;
    used: number;
    available: number;
    pending: number;
    utilizationRate: number;
  }>;
  generatedAt: string;
};

export type AdminAdjustmentHistoryItem = {
  id: string;
  employee: {
    userId: string;
    name: string;
    email: string;
    employeeCode: string;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
  adjustment: {
    amount: number;
    reason: string;
    effectiveDate: string;
  };
  balances: {
    before: number;
    after: number;
    change: number;
  };
  admin: {
    id: string;
    name: string;
    email: string;
  };
  metadata: {
    adjustedBy: string;
    adminEmail: string;
    previousBalance: number;
  };
  createdAt: string;
};

export type AdminAdjustmentHistoryResponse = {
  data: AdminAdjustmentHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type AdminAdjustmentHistoryParams = {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  adminId?: string;
  leaveTypeId?: string;
};

export type AdminBalanceAlert = {
  severity: "critical" | "warning" | "info";
  type:
    | "negative_balance"
    | "high_usage"
    | "unusual_adjustment"
    | "low_balance";
  employee: {
    userId: string;
    name: string;
    email: string;
    employeeCode: string;
    department: string;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
  balance?: number;
  usagePercent?: string;
  adjustment?: number;
  reason?: string;
  adjustedBy?: string;
  date?: string;
  message: string;
};

export type AdminBalanceAlertsResponse = {
  summary: {
    totalAlerts: number;
    critical: number;
    warnings: number;
    info: number;
  };
  alerts: {
    negativeBalances: AdminBalanceAlert[];
    highUsage: AdminBalanceAlert[];
    unusualAdjustments: AdminBalanceAlert[];
    approachingLimits: AdminBalanceAlert[];
  };
  generatedAt: string;
};

export type BulkInitializeItem = {
  userId: string;
  leaveTypeId: string;
  initialBalance: number;
  accrualRuleId?: string;
};

export type BulkInitializePayload = {
  items: BulkInitializeItem[];
  reason?: string;
};

export type BulkInitializeResponse = {
  successful: Array<{
    userId: string;
    userName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    initialBalance: number;
    balanceId: string;
  }>;
  failed: Array<{
    userId: string;
    leaveTypeId: string;
    error: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
};

export type BulkAdjustItem = {
  userId: string;
  leaveTypeId: string;
  adjustment: number;
  reason: string;
};

export type BulkAdjustPayload = {
  items: BulkAdjustItem[];
};

export type BulkAdjustResponse = {
  successful: Array<{
    userId: string;
    userName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    adjustment: number;
    balanceBefore: number;
    balanceAfter: number;
    reason: string;
  }>;
  failed: Array<{
    userId: string;
    leaveTypeId: string;
    adjustment: number;
    error: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
};

export type AdminBalanceExportParams = {
  departmentId?: string;
  leaveTypeId?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
};

/**
 * Get paginated list of all employee leave balances with advanced filtering
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated list of leave balances with statistics
 */
export async function getAdminLeaveBalances(params?: AdminLeaveBalancesParams) {
  const response = await apiClient.get<AdminLeaveBalancesResponse>(
    "/admin/leave-balances",
    { params }
  );
  return response.data;
}

/**
 * Get summary statistics for leave balances
 * @param year - Optional year filter
 * @returns Overview stats, department breakdown, and leave type breakdown
 */
export async function getAdminBalanceSummary(year?: number) {
  const response = await apiClient.get<AdminBalanceSummaryResponse>(
    "/admin/leave-balances/summary",
    { params: year ? { year } : undefined }
  );
  return response.data;
}

/**
 * Get alerts for problematic leave balances
 * @param year - Optional year filter
 * @returns Alerts for negative balances, high usage, and unusual adjustments
 */
export async function getAdminBalanceAlerts(year?: number) {
  const response = await apiClient.get<AdminBalanceAlertsResponse>(
    "/admin/leave-balances/alerts",
    { params: year ? { year } : undefined }
  );
  return response.data;
}

/**
 * Get audit trail of balance adjustments
 * @param params - Query parameters for filtering
 * @returns Paginated list of adjustment history with before/after values
 */
export async function getAdminAdjustmentHistory(
  params?: AdminAdjustmentHistoryParams
) {
  const response = await apiClient.get<AdminAdjustmentHistoryResponse>(
    "/admin/leave-balances/adjustments",
    { params }
  );
  return response.data;
}

/**
 * Bulk initialize leave balances for multiple employees
 * @param payload - Items to initialize with optional reason
 * @returns Results with successful and failed operations
 */
export async function bulkInitializeBalances(payload: BulkInitializePayload) {
  const response = await apiClient.post<BulkInitializeResponse>(
    "/admin/leave-balances/bulk-initialize",
    payload
  );
  return response.data;
}

/**
 * Bulk adjust leave balances for multiple employees
 * @param payload - Items to adjust
 * @returns Results with successful and failed operations
 */
export async function bulkAdjustBalances(payload: BulkAdjustPayload) {
  const response = await apiClient.post<BulkAdjustResponse>(
    "/admin/leave-balances/bulk-adjust",
    payload
  );
  return response.data;
}

/**
 * Export leave balances to CSV
 * @param params - Optional filters for export
 * @returns CSV blob for download
 */
export async function exportBalances(params?: AdminBalanceExportParams) {
  const response = await apiClient.get("/admin/leave-balances/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}
