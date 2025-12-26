import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type WorkSchedule = {
  id: string;
  name: string;
  days: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
  }>;
};

export async function fetchWorkSchedules() {
  const { data } = await axios.get("/api/work-schedules");
  return data as WorkSchedule[];
}

export function useWorkSchedules() {
  return useQuery({
    queryKey: ["work-schedules"],
    queryFn: fetchWorkSchedules,
  });
}
