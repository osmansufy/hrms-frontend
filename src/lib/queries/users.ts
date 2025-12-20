import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getUser,
  listUsers,
  changeUserPassword,
  type ApiUser,
} from "@/lib/api/users";

export const userKeys = {
  list: ["users", "list"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: () => listUsers(),
  });
}

export function useUser(id: string) {
  return useQuery<ApiUser>({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: Boolean(id),
  });
}

export function useChangeUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => changeUserPassword(userId, newPassword),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.list });
    },
  });
}
