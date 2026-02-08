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
      id: string;
      employeeCode: string;
      departmentId?: string;
      designationId?: string;
      profilePicture?: string | null;
    };
  };
  workedMinutes?: number;
  lostMinutes?: number;
  overtimeMinutes?: number;
  policy: Policy | null;
  isOnLeave?: boolean;
  isWeekend?: boolean;
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
  isOnBreak?: boolean;
  activeBreak?: {
    id: string;
    startTime: string;
    reason?: string | null;
    durationMinutes: number;
  } | null;
  totalBreakMinutes?: number;
  breakCount?: number;
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

// Break Tracking Types
export enum BreakType {
  LUNCH = "LUNCH",
  TEA = "TEA",
  PRAYER = "PRAYER",
  MEDICAL = "MEDICAL",
  PERSONAL = "PERSONAL",
  OTHER = "OTHER",
}

export type AttendanceBreak = {
  id: string;
  attendanceId: string;
  userId: string;
  breakType: BreakType;
  startTime: string; // ISO DateTime
  endTime: string | null; // ISO DateTime or null if still active
  durationMinutes: number | null; // Calculated on backend when endTime is set
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceBreakWithUser = AttendanceBreak & {
  user: {
    id: string;
    name: string;
    email: string;
    employee?: {
      id: string;
      employeeCode: string;
      department?: { id: string; name: string };
      profilePicture?: string | null;
    };
  };
};

export type AttendanceBreakListResponse = {
  success: boolean;
  breaks: AttendanceBreak[];
  total: number;
  data?: AttendanceBreak[]; // For compatibility with list responses
};

export type AttendanceBreakResponse = {
  success: boolean;
  activeBreak: AttendanceBreak;
};

export type BreakSummary = {
  totalBreaks: number;
  totalMinutes: number;
  activeBreak: AttendanceBreak | null;
  byType: Record<BreakType, { count: number; minutes: number }>;
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
    `/attendance/${userId}/today`,
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
    payload,
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
    payload,
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
    { params },
  );
  return response.data;
}

// Employee-specific monthly summary (for the logged-in user)
export interface EmployeeMonthlyAttendanceSummary {
  totalPresentDays: number;
  totalLateDays: number;
  totalAbsentDays: number;
  totalOnLeaveDays: number;
  totalWorkingDays: number;
  totalLostHours: number;
  totalOvertimeHours: number;
  totalHoursWorked: number;
  totalExpectedHours: number;
  totalUtilization: number;
}

export async function getMyMonthlyAttendanceSummary(params: {
  year: number;
  month: number;
}): Promise<EmployeeMonthlyAttendanceSummary> {
  const response = await apiClient.get<EmployeeMonthlyAttendanceSummary>(
    `/attendance/my/monthly-summary`,
    { params },
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
  params: Omit<AttendanceListParams, "userId">,
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
      payload,
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
  },
) {
  const response = await apiClient.put<AttendanceRecord>(
    `/attendance/admin/records/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteAttendanceRecord(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/attendance/admin/records/${id}`,
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
    `/attendance/admin/today`,
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
    { params },
  );
  return response.data;
}

export async function createAttendancePolicy(
  payload: Partial<AttendancePolicy> & {
    name: string;
    effectiveFrom: string;
    startTime: string;
    endTime: string;
  },
) {
  const response = await apiClient.post<AttendancePolicy>(
    `/attendance/admin/policies`,
    payload,
  );
  return response.data;
}

export async function updateAttendancePolicy(
  id: string,
  payload: Partial<AttendancePolicy>,
) {
  const response = await apiClient.put<AttendancePolicy>(
    `/attendance/admin/policies/${id}`,
    payload,
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
    payload,
  );
  return response.data;
}

export async function updateWorkSchedule(
  id: string,
  payload: UpdateWorkSchedulePayload,
) {
  const response = await apiClient.patch<WorkSchedule>(
    `/work-schedules/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteWorkSchedule(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/work-schedules/${id}`,
  );
  return response.data;
}

export async function deleteAttendancePolicy(id: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/attendance/admin/policies/${id}`,
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
    { params },
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
  },
) {
  const response = await apiClient.get<LostHoursRow[]>(
    `/attendance/${userId}/lost-hours`,
    { params },
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
  month?: number,
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
    { params },
  );
  return response.data;
}

// get employee's monthly attendance summary
export async function getEmployeeMonthlySummary(
  userId: string,
  year: number,
  month: number,
) {
  const response = await apiClient.get<{
    totalPresentDays: number;
    totalLateDays: number;
    totalAbsentDays: number;
    totalOnLeaveDays: number;
    totalWorkingDays: number;
    totalLostHours: number;
    totalOvertimeHours: number;
    totalHoursWorked: number;
    totalExpectedHours: number;
    totalUtilization: string;
  }>(`/attendance/admin/employee/${userId}/monthly-summary`, {
    params: { year, month },
  });
  return response.data;
}

// Attendance History for line manager (all subordinates)
export async function getManagerAttendanceRecords(
  userId: string,
  params: AttendanceListParams,
) {
  const response = await apiClient.get<{
    data: ExtendedAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/attendance/employee/${userId}/attendance-history`, { params });
  return response.data;
}

// Manager endpoint: Get subordinate attendance records
export async function getSubordinateAttendance(
  subordinateUserId: string,
  params: AttendanceListParams,
) {
  const response = await apiClient.get<{
    data: ExtendedAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/attendance/manager/subordinate/${subordinateUserId}`, { params });
  return response.data;
}

// Attendance Reconciliation
export type AttendanceReconciliationRequestResponse = {
  id: string;
  userId: string;
  attendanceId?: string | null;
  date: string;
  type: "SIGN_IN" | "SIGN_OUT" | "BOTH";
  originalSignIn?: string | null;
  originalSignOut?: string | null;
  requestedSignIn?: string | null;
  requestedSignOut?: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewerComment?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    employee?: {
      employeeCode?: string;
      firstName?: string;
      lastName?: string;
      department?: {
        name: string;
      };
    };
  };
};

// ============================================
// Break Tracking API Functions
// ============================================

/**
 * Start a new break for the current user
 * @param payload - Break start data
 */
export async function startBreak(payload: {
  breakType: BreakType;
  notes?: string;
}): Promise<AttendanceBreakResponse> {
  const response = await apiClient.post<AttendanceBreakResponse>(
    "/attendance/breaks/start",
    payload,
  );
  return response.data;
}

/**
 * End an active break
 * @param breakId - ID of the break to end
 */
export async function endBreak(
  breakId: string,
): Promise<AttendanceBreakResponse> {
  const response = await apiClient.patch<AttendanceBreakResponse>(
    `/attendance/breaks/${breakId}/end`,
  );
  return response.data;
}

/**
 * Get active break for current user
 */
export async function getActiveBreak(): Promise<AttendanceBreakResponse> {
  const response = await apiClient.get<AttendanceBreakResponse>(
    "/attendance/breaks/active",
  );
  return response.data;
}

/**
 * Get user's break history with optional date filtering
 */
export async function getMyBreaks(params?: {
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string YYYY-MM-DD
}): Promise<AttendanceBreakListResponse> {
  const response = await apiClient.get<AttendanceBreakListResponse>(
    "/attendance/breaks/my-breaks",
    { params },
  );
  return response.data;
}

/**
 * Get breaks for a specific attendance record (admin only)
 * @param attendanceId - Attendance record ID
 */
export async function getAttendanceBreaks(
  attendanceId: string,
): Promise<AttendanceBreakListResponse> {
  const response = await apiClient.get<AttendanceBreakListResponse>(
    `/attendance/breaks/admin/attendance/${attendanceId}`,
  );
  return response.data;
}

/**
 * Calculate break summary statistics
 * @param breaks - Array of breaks to summarize
 */
export function calculateBreakSummary(breaks: AttendanceBreak[]): BreakSummary {
  const activeBreak = breaks?.find((b) => b.endTime === null) || null;

  const summary: BreakSummary = {
    totalBreaks: breaks.length,
    totalMinutes: 0,
    activeBreak,
    byType: {
      [BreakType.LUNCH]: { count: 0, minutes: 0 },
      [BreakType.TEA]: { count: 0, minutes: 0 },
      [BreakType.PRAYER]: { count: 0, minutes: 0 },
      [BreakType.MEDICAL]: { count: 0, minutes: 0 },
      [BreakType.PERSONAL]: { count: 0, minutes: 0 },
      [BreakType.OTHER]: { count: 0, minutes: 0 },
    },
  };

  breaks.forEach((breakRecord) => {
    if (breakRecord.durationMinutes) {
      summary.totalMinutes += breakRecord.durationMinutes;
      summary.byType[breakRecord.breakType].count += 1;
      summary.byType[breakRecord.breakType].minutes +=
        breakRecord.durationMinutes;
    }
  });

  return summary;
}

/**
 * Format break duration for display
 * @param minutes - Duration in minutes
 */
export function formatBreakDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get break type display name
 */
export function getBreakTypeLabel(type: BreakType): string {
  const labels: Record<BreakType, string> = {
    [BreakType.LUNCH]: "Lunch Break",
    [BreakType.TEA]: "Tea Break",
    [BreakType.PRAYER]: "Prayer Break",
    [BreakType.MEDICAL]: "Medical Break",
    [BreakType.PERSONAL]: "Personal Break",
    [BreakType.OTHER]: "Other Break",
  };
  return labels[type];
}

/**
 * Get break type icon emoji
 */
export function getBreakTypeIcon(type: BreakType): string {
  const icons: Record<BreakType, string> = {
    [BreakType.LUNCH]: "🍽️",
    [BreakType.TEA]: "☕",
    [BreakType.PRAYER]: "🙏",
    [BreakType.MEDICAL]: "🏥",
    [BreakType.PERSONAL]: "👤",
    [BreakType.OTHER]: "⏸️",
  };
  return icons[type];
}

// ============================================
// Admin Break Management API Functions
// ============================================

export type AdminBreakListParams = {
  page?: number;
  limit?: number;
  userId?: string;
  attendanceId?: string;
  departmentId?: string;
  breakType?: BreakType;
  status?: "open" | "closed";
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string YYYY-MM-DD
  search?: string;
};

export type AdminBreakListResponse = {
  data: AttendanceBreakWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AdminEmployeeBreaksResponse = {
  breaks: AttendanceBreak[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statistics: {
    totalBreaks: number;
    totalDurationMinutes: number;
    averageDurationMinutes: number;
    breakTypeCounts: Record<BreakType, number>;
  };
};

/**
 * Get all breaks with admin filters and pagination
 */
export async function adminGetAllBreaks(
  params?: AdminBreakListParams,
): Promise<AdminBreakListResponse> {
  const response = await apiClient.get<AdminBreakListResponse>(
    "/attendance/breaks/admin/all",
    { params },
  );
  return response.data;
}

/**
 * Get a specific break by ID
 */
export async function adminGetBreakById(
  breakId: string,
): Promise<{ break: AttendanceBreakWithUser }> {
  const response = await apiClient.get<{ break: AttendanceBreakWithUser }>(
    `/attendance/breaks/admin/${breakId}`,
  );
  return response.data;
}

/**
 * Create a new break manually (admin only)
 */
export async function adminCreateBreak(payload: {
  userId: string;
  attendanceId: string;
  startTime: string; // ISO DateTime
  endTime?: string; // ISO DateTime
  breakType: BreakType;
  location?: string;
  reason?: string;
}): Promise<{ break: AttendanceBreak }> {
  const response = await apiClient.post<{ break: AttendanceBreak }>(
    "/attendance/breaks/admin/create",
    payload,
  );
  return response.data;
}

/**
 * Update an existing break
 */
export async function adminUpdateBreak(
  breakId: string,
  payload: {
    startTime?: string;
    endTime?: string;
    breakType?: BreakType;
    location?: string;
    reason?: string;
  },
): Promise<{ break: AttendanceBreak }> {
  const response = await apiClient.patch<{ break: AttendanceBreak }>(
    `/attendance/breaks/admin/${breakId}`,
    payload,
  );
  return response.data;
}

/**
 * Delete a break record
 */
export async function adminDeleteBreak(
  breakId: string,
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/attendance/breaks/admin/${breakId}`,
  );
  return response.data;
}

/**
 * Get breaks for a specific employee with statistics
 */
export async function adminGetEmployeeBreaks(params: {
  userId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  breakType?: BreakType;
}): Promise<AdminEmployeeBreaksResponse> {
  const response = await apiClient.get<AdminEmployeeBreaksResponse>(
    `/attendance/breaks/admin/employee/${params.userId}`,
    { params: { ...params, userId: undefined } },
  );
  return response.data;
}

/** GET /attendance/reconciliation response (backend uses pagination format) */
export type AttendanceReconciliationListResponse = {
  data: AttendanceReconciliationRequestResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type UpdateReconciliationStatusPayload = {
  status: "APPROVED" | "REJECTED";
  reviewerComment?: string;
  correctedSignIn?: string;
  correctedSignOut?: string;
};

export type GetReconciliationRequestsParams = {
  month?: number;
  year?: number;
  userId?: string;
  search?: string;
  departmentId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
};

export async function getAttendanceReconciliationRequests(
  params?: GetReconciliationRequestsParams,
) {
  const cleaned = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
      )
    : {};
  const response = await apiClient.get<AttendanceReconciliationListResponse>(
    "/attendance/reconciliation",
    { params: cleaned },
  );
  return response.data;
}

export async function updateReconciliationStatus(
  id: string,
  payload: UpdateReconciliationStatusPayload,
) {
  const response = await apiClient.put<AttendanceReconciliationRequestResponse>(
    `/attendance/reconciliation/${id}/status`,
    payload,
  );
  return response.data;
}
