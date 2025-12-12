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
