import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyLeave,
  listLeaveTypes,
  listLeavesByUser,
  type ApplyLeavePayload,
} from "@/lib/api/leave";

export const leaveKeys = {
  all: ["leave"] as const,
  types: ["leave", "types"] as const,
  mine: (userId: string | undefined) => ["leave", "mine", userId] as const,
};

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: () => listLeaveTypes(),
    staleTime: 5 * 60_000,
  });
}

export function useMyLeaves(userId?: string) {
  return useQuery({
    queryKey: leaveKeys.mine(userId),
    queryFn: () => {
      if (!userId) throw new Error("Missing user id");
      return listLeavesByUser(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useApplyLeave(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => applyLeave(payload),
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: leaveKeys.mine(userId) });
    },
  });
}
