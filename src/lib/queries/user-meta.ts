import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyMeta,
  getUserMeta,
  updateMyMeta,
  updateUserMeta,
  type UserMeta,
  type UpdateUserMetaPayload,
} from "@/lib/api/user-meta";
import { toast } from "sonner";

export const userMetaKeys = {
  all: ["user-meta"] as const,
  my: () => [...userMetaKeys.all, "my"] as const,
  user: (userId: string) => [...userMetaKeys.all, userId] as const,
};

export function useMyUserMeta() {
  return useQuery({
    queryKey: userMetaKeys.my(),
    queryFn: getMyMeta,
  });
}

export function useUserMeta(userId: string | undefined | null) {
  return useQuery({
    queryKey: userMetaKeys.user(userId ?? ""),
    queryFn: () => getUserMeta(userId!),
    enabled: !!userId,
  });
}

export function useUpdateMyUserMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserMetaPayload) => updateMyMeta(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMetaKeys.my() });
      toast.success("Preferences updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update preferences"
      );
    },
  });
}

export function useUpdateUserMeta(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserMetaPayload) =>
      updateUserMeta(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMetaKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: userMetaKeys.my() });
      toast.success("User access settings updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update user access settings"
      );
    },
  });
}
