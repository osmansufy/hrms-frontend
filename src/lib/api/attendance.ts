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
  startDate?: string; // ISO date
  endDate?: string; // ISO date
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
