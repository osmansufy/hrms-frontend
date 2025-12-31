import { apiClient } from "@/lib/api/client";

export type WorkSchedule = {
  id: string;
  name: string;
  days: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
    graceMinutes?: number;
  }>;
};

export async function fetchWorkSchedules() {
  const { data } = await apiClient.get<WorkSchedule[]>("/work-schedules");
  return data;
}

export async function createWorkSchedule(payload: Partial<WorkSchedule>) {
  const { data } = await apiClient.post<WorkSchedule>(
    "/work-schedules",
    payload
  );
  return data;
}

export async function updateWorkSchedule(
  id: string,
  payload: Partial<WorkSchedule>
) {
  const { data } = await apiClient.patch<WorkSchedule>(
    `/work-schedules/${id}`,
    payload
  );
  return data;
}

export async function deleteWorkSchedule(id: string) {
  const { data } = await apiClient.delete(`/work-schedules/${id}`);
  return data;
}
