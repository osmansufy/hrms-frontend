import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyLeave,
  listLeaveTypes,
  listLeavesByUser,
  getUserBalances,
  getBalanceDetails,
  getAllUsersBalances,
  adjustBalance,
  initializeBalance,
  type ApplyLeavePayload,
  type AdjustBalancePayload,
  type InitializeBalancePayload,
} from "@/lib/api/leave";

export const leaveKeys = {
  all: ["leave"] as const,
  types: ["leave", "types"] as const,
  mine: (userId: string | undefined) => ["leave", "mine", userId] as const,
  managerPending: ["leave", "manager", "pending"] as const,
  managerApproved: ["leave", "manager", "approved"] as const,
  subordinatesLeaves: ["leave", "subordinates"] as const,
};

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: () => listLeaveTypes(),
    staleTime: 5 * 60_000,
  });
}

export function useMyLeaves(userId?: string) {
  return useQuery({
    queryKey: leaveKeys.mine(userId),
    queryFn: () => {
      if (!userId) throw new Error("Missing user id");
      return listLeavesByUser(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useApplyLeave(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => applyLeave(payload),
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: leaveKeys.mine(userId) });
    },
  });
}

// Line Manager Hooks
import {
  getPendingLeavesForManager,
  getApprovedByManagerPendingHR,
  getSubordinatesLeaves,
} from "@/lib/api/leave";

// Line Manager - Get pending leaves from subordinates
export function useManagerPendingLeaves() {
  return useQuery({
    queryKey: leaveKeys.managerPending,
    queryFn: () => getPendingLeavesForManager(),
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
}

// Line Manager - Get leaves approved by me, waiting for HR
export function useManagerApprovedLeaves() {
  return useQuery({
    queryKey: leaveKeys.managerApproved,
    queryFn: () => getApprovedByManagerPendingHR(),
    refetchInterval: 30_000,
  });
}

// Line Manager - Get all subordinates' leaves
export function useSubordinatesLeaves() {
  return useQuery({
    queryKey: leaveKeys.subordinatesLeaves,
    queryFn: () => getSubordinatesLeaves(),
    staleTime: 2 * 60_000, // 2 minutes
  });
}

// Line Manager - Approve leave (Step 1)
export function useManagerApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerPending });
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerApproved });
      queryClient.invalidateQueries({ queryKey: leaveKeys.subordinatesLeaves });
    },
  });
}

// Line Manager - Reject leave (Step 1)
export function useManagerRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.managerPending });
      queryClient.invalidateQueries({ queryKey: leaveKeys.subordinatesLeaves });
    },
  });
}

// Admin/HR Hooks
import {
  approveAmendment,
  approveLeave,
  createAccrualRule,
  createLeavePolicy,
  getAccrualRule,
  getAmendment,
  getLeavePolicy,
  getPendingHRApprovals,
  listAccrualRules,
  listAmendments,
  rejectAmendment,
  rejectLeave,
  updateAccrualRule,
  updateLeavePolicy,
  type CreateAccrualRulePayload,
  type CreateLeavePolicyPayload,
} from "@/lib/api/leave";

export const adminLeaveKeys = {
  all: ["admin", "leave"] as const,
  policies: ["admin", "leave", "policies"] as const,
  policy: (leaveTypeId: string) =>
    ["admin", "leave", "policy", leaveTypeId] as const,
  accrualRules: ["admin", "leave", "accrual-rules"] as const,
  accrualRule: (id: string) => ["admin", "leave", "accrual-rule", id] as const,
  pendingApprovals: ["admin", "leave", "pending-approvals"] as const,
  amendments: ["admin", "leave", "amendments"] as const,
  amendment: (id: string) => ["admin", "leave", "amendment", id] as const,
};

// Leave Policy Hooks
export function useLeavePolicy(leaveTypeId: string) {
  return useQuery({
    queryKey: adminLeaveKeys.policy(leaveTypeId),
    queryFn: () => getLeavePolicy(leaveTypeId),
    enabled: Boolean(leaveTypeId),
  });
}

export function useCreateLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeavePolicyPayload) =>
      createLeavePolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLeaveKeys.policies });
      queryClient.invalidateQueries({ queryKey: leaveKeys.types });
    },
  });
}

export function useUpdateLeavePolicy(leaveTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateLeavePolicyPayload>) =>
      updateLeavePolicy(leaveTypeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminLeaveKeys.policy(leaveTypeId),
      });
      queryClient.invalidateQueries({ queryKey: leaveKeys.types });
    },
  });
}

// Accrual Rule Hooks
export function useAccrualRules() {
  return useQuery({
    queryKey: adminLeaveKeys.accrualRules,
    queryFn: () => listAccrualRules(),
    staleTime: 5 * 60_000,
  });
}

export function useAccrualRule(id: string) {
  return useQuery({
    queryKey: adminLeaveKeys.accrualRule(id),
    queryFn: () => getAccrualRule(id),
    enabled: Boolean(id),
  });
}

export function useCreateAccrualRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccrualRulePayload) =>
      createAccrualRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLeaveKeys.accrualRules });
    },
  });
}

export function useUpdateAccrualRule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateAccrualRulePayload>) =>
      updateAccrualRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminLeaveKeys.accrualRule(id),
      });
      queryClient.invalidateQueries({ queryKey: adminLeaveKeys.accrualRules });
    },
  });
}

// Leave Approval Hooks
export function usePendingHRApprovals() {
  return useQuery({
    queryKey: adminLeaveKeys.pendingApprovals,
    queryFn: () => getPendingHRApprovals(),
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminLeaveKeys.pendingApprovals,
      });
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminLeaveKeys.pendingApprovals,
      });
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

// Amendment Hooks
export function useAmendments() {
  return useQuery({
    queryKey: adminLeaveKeys.amendments,
    queryFn: () => listAmendments(),
    refetchInterval: 30_000,
  });
}

export function useAmendment(id: string) {
  return useQuery({
    queryKey: adminLeaveKeys.amendment(id),
    queryFn: () => getAmendment(id),
    enabled: Boolean(id),
  });
}

export function useApproveAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAmendment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLeaveKeys.amendments });
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useRejectAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectAmendment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLeaveKeys.amendments });
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

// Leave Balance Query Keys
export const balanceKeys = {
  all: ["leave-balance"] as const,
  userBalances: () => [...balanceKeys.all, "user"] as const,
  balanceDetails: (leaveTypeId: string) =>
    [...balanceKeys.all, "details", leaveTypeId] as const,
  allUsersBalances: () => [...balanceKeys.all, "all-users"] as const,
};

// Leave Balance Hooks
export function useUserBalances() {
  return useQuery({
    queryKey: balanceKeys.userBalances(),
    queryFn: () => getUserBalances(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBalanceDetails(leaveTypeId: string) {
  return useQuery({
    queryKey: balanceKeys.balanceDetails(leaveTypeId),
    queryFn: () => getBalanceDetails(leaveTypeId),
    enabled: !!leaveTypeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllUsersBalances() {
  return useQuery({
    queryKey: balanceKeys.allUsersBalances(),
    queryFn: () => getAllUsersBalances(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdjustBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustBalancePayload) => adjustBalance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useInitializeBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitializeBalancePayload) =>
      initializeBalance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balanceKeys.all });
    },
  });
}

// Admin Dashboard Hooks - Import from admin-leave-balances.ts
export {
  adminBalanceKeys,
  useAdminLeaveBalances,
  useAdminBalanceSummary,
  useAdminBalanceAlerts,
  useAdminAdjustmentHistory,
  useBulkInitializeBalances,
  useBulkAdjustBalances,
  useExportBalances,
  downloadCSV,
} from "./admin-leave-balances";
