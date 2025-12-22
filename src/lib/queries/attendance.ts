import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getTodayAttendance,
  signIn,
  signOut,
  exportAttendanceReport,
  type AttendanceListParams,
  getTodayAttendanceForAdmin,
  getAttendanceStats,
  getAttendanceRecords,
  getMyAttendanceRecords,
  createAttendanceRecord,
  updateAttendanceRecord,
  getAttendancePolicies,
  createAttendancePolicy,
  updateAttendancePolicy,
  getPolicyAssignments,
  createPolicyAssignment,
  updatePolicyAssignment,
  getLostHoursReport,
  getMyLostHoursReport,
  getWorkSchedules,
  updateWorkSchedule,
} from "@/lib/api/attendance";

export const attendanceKeys = {
  today: (userId: string | undefined) =>
    ["attendance", "today", userId] as const,
  history: (params?: AttendanceListParams) =>
    ["attendance", "history", params] as const,
  list: (params?: AttendanceListParams) =>
    ["attendance", "list", params] as const,
  employeeHistory: (userId: string | undefined) =>
    ["attendance", "employee", userId] as const,
};

// Employee hooks
export function useTodayAttendance(userId?: string) {
  return useQuery({
    queryKey: attendanceKeys.today(userId),
    queryFn: () => {
      if (!userId) throw new Error("Missing user id");
      return getTodayAttendance(userId);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useSignIn(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });
    },
  });
}

export function useSignOut(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });
    },
  });
}

// Admin hooks
// Admin hooks
// Legacy hooks removed/replaced

export function useExportAttendanceReport() {
  return useMutation({
    mutationFn: exportAttendanceReport,
  });
}

// get all employee today attendance record for admin
export function useTodayAttendanceForAdmin() {
  return useQuery({
    queryKey: ["attendance", "admin", "today"],
    queryFn: () => getTodayAttendanceForAdmin(),
  });
}

export function useAttendanceStats(date: string, departmentId?: string) {
  return useQuery({
    queryKey: ["attendance", "admin", "stats", date, departmentId],
    queryFn: () => getAttendanceStats(date, departmentId),
  });
}

export function useAttendanceRecords(params: AttendanceListParams) {
  return useQuery({
    queryKey: ["attendance", "admin", "records", params],
    queryFn: () => getAttendanceRecords(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
}
export function useMyAttendanceRecords(
  userId: string | undefined,
  params: Omit<AttendanceListParams, "userId">
) {
  return useQuery({
    queryKey: ["attendance", "my-records", userId, params],
    queryFn: () => {
      if (!userId) throw new Error("User ID required");
      return getMyAttendanceRecords(userId, params);
    },
    enabled: Boolean(userId),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "admin", "records"],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "admin", "stats"],
      });
    },
  });
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      id: string;
      payload: { signIn?: string; signOut?: string | null; isLate?: boolean };
    }) => updateAttendanceRecord(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
      toast.success("Attendance record updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update record"
      );
    },
  });
}

// Policies
export function useAttendancePolicies(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ["attendance", "policies", params],
    queryFn: () => getAttendancePolicies(params),
  });
}

export function useCreateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendancePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "policies"] });
    },
  });
}

export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; payload: any }) =>
      updateAttendancePolicy(v.id, v.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "policies"] });
    },
  });
}

// Assignments
export function usePolicyAssignments(params?: {
  userId?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ["attendance", "policy-assignments", params],
    queryFn: () => getPolicyAssignments(params),
  });
}

export function useCreatePolicyAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPolicyAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "policy-assignments"],
      });
    },
  });
}

export function useUpdatePolicyAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; payload: { effectiveTo?: string | null } }) =>
      updatePolicyAssignment(v.id, v.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "policy-assignments"],
      });
    },
  });
}

// Lost hours report (admin)
export function useLostHoursReport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ["attendance", "reports", "lost-hours", params],
    queryFn: () => getLostHoursReport(params),
    enabled: Boolean(params?.startDate && params?.endDate),
  });
}

// Lost hours report (employee - for their own data)
export function useMyLostHoursReport(
  userId: string | undefined,
  params: {
    startDate: string;
    endDate: string;
  }
) {
  return useQuery({
    queryKey: ["attendance", "my-lost-hours", userId, params],
    queryFn: () => {
      if (!userId) throw new Error("User ID required");
      return getMyLostHoursReport(userId, params);
    },
    enabled: Boolean(userId && params?.startDate && params?.endDate),
  });
}

// Work Schedules
export function useWorkSchedules() {
  return useQuery({
    queryKey: ["work-schedules"],
    queryFn: getWorkSchedules,
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; payload: any }) =>
      updateWorkSchedule(v.id, v.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
    },
  });
}
