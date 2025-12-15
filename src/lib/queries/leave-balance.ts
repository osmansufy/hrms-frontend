import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserBalances,
  getBalanceDetails,
  getUserLeaveBalance,
  adjustBalance,
  initializeBalance,
  getAllUsersBalances,
  type AdjustBalancePayload,
  type InitializeBalancePayload,
} from "@/lib/api/leave";
import { toast } from "sonner";

// Query Keys
export const leaveBalanceKeys = {
  all: ["leave-balances"] as const,
  lists: () => [...leaveBalanceKeys.all, "list"] as const,
  list: (filters: string) =>
    [...leaveBalanceKeys.lists(), { filters }] as const,
  details: () => [...leaveBalanceKeys.all, "detail"] as const,
  detail: (id: string) => [...leaveBalanceKeys.details(), id] as const,
  userBalances: (userId: string) =>
    [...leaveBalanceKeys.all, "user", userId] as const,
  userBalance: (userId: string, leaveTypeId: string, leaveYear?: string) =>
    [...leaveBalanceKeys.userBalances(userId), leaveTypeId, leaveYear] as const,
};

/**
 * Hook to fetch current user's leave balances
 */
export function useUserBalances() {
  return useQuery({
    queryKey: leaveBalanceKeys.lists(),
    queryFn: getUserBalances,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch detailed balance for a specific leave type
 */
export function useBalanceDetails(leaveTypeId: string, enabled = true) {
  return useQuery({
    queryKey: leaveBalanceKeys.detail(leaveTypeId),
    queryFn: () => getBalanceDetails(leaveTypeId),
    enabled: enabled && !!leaveTypeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific user's balance for a leave type
 */
export function useUserLeaveBalance(
  userId: string,
  leaveTypeId: string,
  leaveYear?: string,
  enabled = true
) {
  return useQuery({
    queryKey: leaveBalanceKeys.userBalance(userId, leaveTypeId, leaveYear),
    queryFn: () => getUserLeaveBalance(userId, leaveTypeId, leaveYear),
    enabled: enabled && !!userId && !!leaveTypeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all users' leave balances (admin only)
 */
export function useAllUsersBalances() {
  return useQuery({
    queryKey: [...leaveBalanceKeys.all, "all-users"],
    queryFn: getAllUsersBalances,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to adjust leave balance (admin/HR only)
 */
export function useAdjustBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdjustBalancePayload) => adjustBalance(payload),
    onSuccess: (data, variables) => {
      toast.success("Leave balance adjusted successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.userBalances(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.detail(variables.leaveTypeId),
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to adjust balance", {
        description: error.message || "Please try again later",
      });
    },
  });
}

/**
 * Hook to initialize leave balance (admin/HR only)
 */
export function useInitializeBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InitializeBalancePayload) =>
      initializeBalance(payload),
    onSuccess: (data, variables) => {
      toast.success("Leave balance initialized successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: leaveBalanceKeys.all });
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.userBalances(variables.userId),
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to initialize balance", {
        description: error.message || "Please try again later",
      });
    },
  });
}

/**
 * Helper function to check if balance is sufficient
 */
export function checkBalanceSufficiency(
  availableBalance: number,
  requestedDays: number
): {
  sufficient: boolean;
  message?: string;
} {
  if (availableBalance < requestedDays) {
    const deficit = requestedDays - availableBalance;
    return {
      sufficient: false,
      message: `Insufficient balance: You have ${availableBalance} days available, but requested ${requestedDays} days. Shortfall: ${deficit} days.`,
    };
  }

  if (availableBalance === requestedDays) {
    return {
      sufficient: true,
      message: "This request will use your entire available balance.",
    };
  }

  if (availableBalance - requestedDays < 2) {
    return {
      sufficient: true,
      message: `After this request, you will have only ${
        availableBalance - requestedDays
      } days remaining.`,
    };
  }

  return { sufficient: true };
}
