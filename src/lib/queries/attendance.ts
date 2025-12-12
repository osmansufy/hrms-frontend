import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getTodayAttendance, signIn, signOut } from "@/lib/api/attendance";

export const attendanceKeys = {
  today: (userId: string | undefined) =>
    ["attendance", "today", userId] as const,
};

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
