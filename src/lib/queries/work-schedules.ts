import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  fetchWorkSchedules,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
} from "../api/work-schedules";

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

export function useWorkSchedules() {
  return useQuery({
    queryKey: ["work-schedules"],
    queryFn: fetchWorkSchedules,
  });
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
    },
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<WorkSchedule>;
    }) => updateWorkSchedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
    },
  });
}

export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
    },
  });
}
