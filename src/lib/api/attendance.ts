import { apiClient } from "@/lib/api/client";

export type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  signIn: string;
  signOut: string | null;
  isLate: boolean;
  signInLocation?: string | null;
  signOutLocation?: string | null;
};

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
