import { apiClient } from "@/lib/api/client";

export type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  signIn: string | null;
  signOut: string | null;
  isLate: boolean;
  signInLocation?: string | null;
  signOutLocation?: string | null;
  timezone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ExtendedAttendanceRecord = AttendanceRecord & {
  user: {
    id: string;
    name: string;
    email: string;
    employee?: {
      employeeCode: string;
      department?: { id: string; name: string };
      designation?: { id: string; title: string };
      profilePicture?: string | null;
    };
  };
};

export type AttendanceListParams = {
  userId?: string;
  startDate?: string; // ISO DateTime string (use toStartOfDayISO from utils)
  endDate?: string; // ISO DateTime string (use toEndOfDayISO from utils)
  isLate?: boolean;
  departmentId?: string;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: "date" | "signIn" | "isLate";
  sortOrder?: "asc" | "desc";
};

// Employee endpoints
export async function getTodayAttendance(userId: string) {
  const response = await apiClient.get<AttendanceRecord>(
    `/attendance/${userId}/today`
  );
  return response.data;
}

export async function signIn(payload: { location?: string | null }) {
  const response = await apiClient.post<AttendanceRecord>(
    "/attendance/sign-in",
    payload
  );
  return response.data;
}

export async function signOut(payload: { location?: string | null }) {
  const response = await apiClient.post<AttendanceRecord>(
    "/attendance/sign-out",
    payload
  );
  return response.data;
}
// Admin endpoints
export async function getAttendanceStats(date: string, departmentId?: string) {
  const response = await apiClient.get<{
    present: number;
    late: number;
    absent: number;
    totalActive: number;
    date: string;
  }>(`/attendance/admin/stats`, {
    params: { date, departmentId },
  });
  return response.data;
}

export async function getAttendanceRecords(params: AttendanceListParams) {
  const response = await apiClient.get<{
    data: ExtendedAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/attendance/admin/records`, { params });
  return response.data;
}

export async function getMyAttendanceRecords(
  userId: string,
  params: Omit<AttendanceListParams, "userId">
) {
  const response = await apiClient.get<{
    data: ExtendedAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/attendance/employee/${userId}/records`, { params });
  return response.data;
}

export async function createAttendanceRecord(payload: {
  userId: string;
  date: string;
  signIn: string;
  signOut?: string | null;
  signInLocation?: string | null;
  signOutLocation?: string | null;
  isLate?: boolean;
}) {
  const response = await apiClient.post<AttendanceRecord>(
    `/attendance/admin/records`,
    payload
  );
  return response.data;
}

export async function updateAttendanceRecord(
  id: string,
  payload: {
    signIn?: string;
    signOut?: string | null;
    isLate?: boolean;
  }
) {
  const response = await apiClient.put<AttendanceRecord>(
    `/attendance/admin/records/${id}`,
    payload
  );
  return response.data;
}

// For now, replacing getAttendanceHistory/List with getAttendanceRecords

export async function exportAttendanceReport(params: {
  startDate: string;
  endDate: string;
  format?: "csv" | "xlsx";
  userId?: string;
}) {
  const response = await apiClient.get<Blob>(`/attendance/admin/export`, {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function getTodayAttendanceForAdmin() {
  const response = await apiClient.get<AttendanceRecord[]>(
    `/attendance/admin/today`
  );
  return response.data;
}

// Attendance Policies
export type WorkScheduleDay = {
  id: string;
  dayOfWeek: string;
  isWorking: boolean;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
  graceMinutes?: number | null;
};

export type WorkScheduleWithDays = {
  id: string;
  code: string;
  name: string;
  isFlexible: boolean;
  days: WorkScheduleDay[];
};

export type AttendancePolicy = {
  id: string;
  name: string;
  description?: string | null;
  effectiveFrom: string;
  startTime: string;
  endTime: string;
  targetMinutes: number;
  delayBufferMinutes: number;
  extraDelayBufferMinutes: number;
  breakMinutes: number;
  ignoreOtAndDeduction: boolean;
  excludeFromReports: boolean;
  discardOnWeekend: boolean;
  isDefault: boolean;
  isActive: boolean;
  workScheduleId?: string | null;
  workSchedule?: WorkScheduleWithDays | null;
  _count?: {
    assignments: number;
  };
};

export async function getAttendancePolicies(params?: { isActive?: boolean }) {
  const response = await apiClient.get<AttendancePolicy[]>(
    `/attendance/admin/policies`,
    { params }
  );
  return response.data;
}

export async function createAttendancePolicy(
  payload: Partial<AttendancePolicy> & {
    name: string;
    effectiveFrom: string;
    startTime: string;
    endTime: string;
  }
) {
  const response = await apiClient.post<AttendancePolicy>(
    `/attendance/admin/policies`,
    payload
  );
  return response.data;
}

export async function updateAttendancePolicy(
  id: string,
  payload: Partial<AttendancePolicy>
) {
  const response = await apiClient.put<AttendancePolicy>(
    `/attendance/admin/policies/${id}`,
    payload
  );
  return response.data;
}

// Work Schedules
export type WorkSchedule = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isFlexible: boolean;
  isActive: boolean;
  days?: WorkScheduleDay[];
};

export async function getWorkSchedules() {
  const response = await apiClient.get<WorkSchedule[]>(`/work-schedules`);
  return response.data;
}

export type WorkScheduleDayInput = {
  dayOfWeek: string;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
  graceMinutes?: number | null;
  isWorking?: boolean;
};

export type UpdateWorkSchedulePayload = {
  code?: string;
  name?: string;
  description?: string | null;
  isFlexible?: boolean;
  isActive?: boolean;
  days?: WorkScheduleDayInput[];
};

export async function updateWorkSchedule(
  id: string,
  payload: UpdateWorkSchedulePayload
) {
  const response = await apiClient.patch<WorkSchedule>(
    `/work-schedules/${id}`,
    payload
  );
  return response.data;
}

// Policy Assignments
export type AttendancePolicyAssignment = {
  id: string;
  policyId: string;
  userId?: string | null;
  departmentId?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  policy?: AttendancePolicy;
  user?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
};

export async function getPolicyAssignments(params?: {
  userId?: string;
  departmentId?: string;
}) {
  const response = await apiClient.get<AttendancePolicyAssignment[]>(
    `/attendance/admin/policy-assignments`,
    { params }
  );
  return response.data;
}

export async function createPolicyAssignment(payload: {
  policyId: string;
  userId?: string;
  departmentId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}) {
  const response = await apiClient.post<AttendancePolicyAssignment>(
    `/attendance/admin/policy-assignments`,
    payload
  );
  return response.data;
}

export async function updatePolicyAssignment(
  id: string,
  payload: { effectiveTo?: string | null }
) {
  const response = await apiClient.put<AttendancePolicyAssignment>(
    `/attendance/admin/policy-assignments/${id}`,
    payload
  );
  return response.data;
}

// Lost Hours Report
export type LostHoursRow = {
  userId: string;
  name: string;
  totalWorkedMinutes: number;
  totalLostMinutes: number;
  totalOvertimeMinutes: number;
  days: number;
};

/**
 * Fetches lost hours report for admin (all employees or by department)
 * @param params.startDate - ISO DateTime string at start of day (use toStartOfDayISO)
 * @param params.endDate - ISO DateTime string at end of day (use toEndOfDayISO)
 * @param params.departmentId - Optional department filter
 */
export async function getLostHoursReport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
}) {
  const response = await apiClient.get<LostHoursRow[]>(
    `/attendance/admin/reports/lost-hours`,
    { params }
  );
  return response.data;
}

/**
 * Fetches lost hours report for a specific employee
 * @param userId - The user ID
 * @param params.startDate - ISO DateTime string at start of day (use toStartOfDayISO)
 * @param params.endDate - ISO DateTime string at end of day (use toEndOfDayISO)
 */
export async function getMyLostHoursReport(
  userId: string,
  params: {
    startDate: string;
    endDate: string;
  }
) {
  const response = await apiClient.get<LostHoursRow[]>(
    `/attendance/${userId}/lost-hours`,
    { params }
  );
  return response.data;
}
