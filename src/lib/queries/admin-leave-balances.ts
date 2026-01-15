import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminLeaveBalances,
  getAdminBalanceSummary,
  getAdminBalanceAlerts,
  getAdminAdjustmentHistory,
  bulkInitializeBalances,
  bulkAdjustBalances,
  exportBalances,
  type AdminLeaveBalancesParams,
  type AdminAdjustmentHistoryParams,
  type BulkInitializePayload,
  type BulkAdjustPayload,
  type AdminBalanceExportParams,
} from "@/lib/api/leave";

/**
 * Query keys for admin leave balance endpoints
 * Used for cache invalidation and query management
 */
export const adminBalanceKeys = {
  all: ["admin", "leave-balances"] as const,
  list: (params?: AdminLeaveBalancesParams) =>
    [...adminBalanceKeys.all, "list", params] as const,
  summary: (year?: number) =>
    [...adminBalanceKeys.all, "summary", year] as const,
  alerts: (year?: number) => [...adminBalanceKeys.all, "alerts", year] as const,
  adjustments: (params?: AdminAdjustmentHistoryParams) =>
    [...adminBalanceKeys.all, "adjustments", params] as const,
};

/**
 * Hook to fetch paginated list of employee leave balances
 * @param params - Filter and pagination parameters
 * @returns Query result with balances data, pagination, and statistics
 */
export function useAdminLeaveBalances(params?: AdminLeaveBalancesParams) {
  return useQuery({
    queryKey: adminBalanceKeys.list(params),
    queryFn: () => getAdminLeaveBalances(params),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch summary statistics for leave balances
 * @param year - Optional year filter
 * @returns Query result with overview, department breakdown, and leave type breakdown
 */
export function useAdminBalanceSummary(year?: number) {
  return useQuery({
    queryKey: adminBalanceKeys.summary(year),
    queryFn: () => getAdminBalanceSummary(year),
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Hook to fetch alerts for problematic leave balances
 * @param year - Optional year filter
 * @returns Query result with categorized alerts
 */
export function useAdminBalanceAlerts(year?: number) {
  return useQuery({
    queryKey: adminBalanceKeys.alerts(year),
    queryFn: () => getAdminBalanceAlerts(year),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch adjustment history with audit trail
 * @param params - Filter parameters for adjustments
 * @returns Query result with paginated adjustment history
 */
export function useAdminAdjustmentHistory(
  params?: AdminAdjustmentHistoryParams
) {
  return useQuery({
    queryKey: adminBalanceKeys.adjustments(params),
    queryFn: () => getAdminAdjustmentHistory(params),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to bulk initialize leave balances
 * Automatically invalidates all admin balance queries on success
 * @returns Mutation result with mutate and mutateAsync functions
 */
export function useBulkInitializeBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkInitializePayload) =>
      bulkInitializeBalances(payload),
    onSuccess: () => {
      // Invalidate all admin balance queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: adminBalanceKeys.all });
    },
  });
}

/**
 * Hook to bulk adjust leave balances
 * Automatically invalidates all admin balance queries on success
 * @returns Mutation result with mutate and mutateAsync functions
 */
export function useBulkAdjustBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAdjustPayload) => bulkAdjustBalances(payload),
    onSuccess: () => {
      // Invalidate all admin balance queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: adminBalanceKeys.all });
    },
  });
}

/**
 * Hook to export leave balances to CSV
 * Does not invalidate queries as it's read-only
 * @returns Mutation result with mutate and mutateAsync functions
 */
export function useExportBalances() {
  return useMutation({
    mutationFn: (params?: AdminBalanceExportParams) => exportBalances(params),
  });
}

/**
 * Helper function to download CSV blob
 * @param blob - CSV blob from export API
 * @param filename - Optional filename (defaults to dated filename)
 */
export function downloadCSV(blob: Blob, filename?: string, timezone: string = "Asia/Dhaka") {
  // Use system timezone for consistent filename dates
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const defaultFilename = `leave_balances_${dateStr}.csv`;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
