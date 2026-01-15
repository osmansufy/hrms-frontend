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
  signInAddress?: string | null;
  signOutAddress?: string | null;
  signInLatitude?: number | null;
  signInLongitude?: number | null;
  signOutLatitude?: number | null;
  signOutLongitude?: number | null;
  timezone?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requiresLateConfirmation?: boolean;
  leaveDeducted?: boolean;
};

export type ExtendedAttendanceRecord = AttendanceRecord & {
  user: {
    id: string;
    name: string;
    email: string;
    employee?: {
      employeeId: string;
      employeeCode: string;
      department?: { id: string; name: string };
      designation?: { id: string; title: string };
      profilePicture?: string | null;
    };
  };
  workedMinutes?: number;
  lostMinutes?: number;
  overtimeMinutes?: number;
  policy: Policy | null;
  isOnLeave?: boolean;
  leave?: {
    id: string;
    leaveType: {
      id: string;
      name: string;
      code: string;
    };
    reason: string;
    startDate: string;
    endDate: string;
  } | null;
};
export type Policy = {
  id: string;
  name: string;
  targetMinutes: number;
  isActive: boolean;
  breakMinutes?: number | null;
  isDefault?: boolean;
  startTime?: string | null;
  endTime?: string | null;
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

export async function signIn(payload: {
  location?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  screenWidth?: number;
  screenHeight?: number;
  hasTouchScreen?: boolean;
}) {
  const response = await apiClient.post<AttendanceRecord>(
    "/attendance/sign-in",
    payload
  );
  return response.data;
}

export async function signOut(payload: {
  location?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  screenWidth?: number;
  screenHeight?: number;
  hasTouchScreen?: boolean;
}) {
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
    onLeave: number;
    totalActive: number;
    date: string;
  }>(`/attendance/admin/stats`, {
    params: { date, departmentId },
  });
  return response.data;
}

export interface MonthlyAttendanceSummary {
  year: number;
  month: number;
  totalWorkingDays: number;
  totalEmployees: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalOnLeave: number;
  totalHoursWorked: number;
  avgHoursPerDay: number;
  attendancePercentage: number;
  startDate: string;
  endDate: string;
}

export async function getMonthlyAttendanceSummary(params: {
  year: number;
  month: number;
  departmentId?: string;
  userId?: string;
}): Promise<MonthlyAttendanceSummary> {
  const response = await apiClient.get<MonthlyAttendanceSummary>(
    `/attendance/admin/monthly-summary`,
    { params }
  );
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
  try {
    const response = await apiClient.post<AttendanceRecord>(
      `/attendance/admin/records`,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
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

export async function deleteAttendanceRecord(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/attendance/admin/records/${id}`
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
  attendancePolicies?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  _count?: {
    employees: number;
    attendancePolicies: number;
  };
};

export async function getWorkSchedules() {
  const response = await apiClient.get<WorkSchedule[]>(`/work-schedules`);
  return response.data;
}

export async function getWorkSchedule(id: string) {
  const response = await apiClient.get<
    WorkSchedule & {
      days: WorkScheduleDay[];
      employees?: any[];
      attendancePolicies?: Array<{
        id: string;
        name: string;
        isActive: boolean;
      }>;
      _count?: { employees: number; attendancePolicies: number };
    }
  >(`/work-schedules/${id}`);
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

export async function createWorkSchedule(payload: {
  code: string;
  name: string;
  description?: string | null;
  isFlexible?: boolean;
  isActive?: boolean;
  days: WorkScheduleDayInput[];
}) {
  const response = await apiClient.post<WorkSchedule>(
    `/work-schedules`,
    payload
  );
  return response.data;
}

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

export async function deleteWorkSchedule(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/work-schedules/${id}`
  );
  return response.data;
}

export async function deleteAttendancePolicy(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/attendance/admin/policies/${id}`
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

export type MonthlyLateCount = {
  lateCount: number;
  month: number;
  year: number;
};

export async function getMonthlyLateCount(
  userId: string,
  year?: number,
  month?: number
) {
  const params: Record<string, string> = {};
  if (year !== undefined) {
    params.year = year.toString();
  }
  if (month !== undefined) {
    params.month = month.toString();
  }
  const response = await apiClient.get<MonthlyLateCount>(
    `/attendance/${userId}/monthly-late-count`,
    { params }
  );
  return response.data;
}

// get employee's monthly attendance summary
export async function getEmployeeMonthlySummary(
  userId: string,
  year: number,
  month: number
) {
  const response = await apiClient.get<{
    totalPresentDays: number;
    totalLateDays: number;
    totalAbsentDays: number;
    totalOnLeaveDays: number;
    totalWorkingDays: number;
    totalLostHours: number;
    totalOvertimeHours: number;
  }>(`/attendance/admin/employee/${userId}/monthly-summary`, {
    params: { year, month },
  });
  return response.data;
}

// Attendance History for line manager
export async function getManagerAttendanceRecords(
  userId: string,
  params: AttendanceListParams
) {
  const response = await apiClient.get<{
    data: ExtendedAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/attendance/manager/${userId}/records`, { params });
  return response.data;
}
