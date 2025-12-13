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
  id: string;
  userId: string;
  leaveTypeId: string;
  balance: number;
  carryForward: number;
  accrualRuleId: string | null;
  lastAccruedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  leaveType: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    leavePolicy?: {
      maxDays: number;
      carryForwardCap: number;
      encashmentFlag: boolean;
      allowAdvance: boolean;
    } | null;
  };
  accrualRule?: {
    id: string;
    frequency: string;
    ratePerPeriod: number;
    accrualStrategy: string;
    prorateFlag: boolean;
    startAfterDays: number;
    resetMonthDay: number | null;
  } | null;
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
