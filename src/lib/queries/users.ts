import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getUser,
  listUsers,
  changeUserPassword,
  createUser,
  type ApiUser,
  type CreateUserPayload,
  type User,
  usersApi,
} from "@/lib/api/users";

export const userKeys = {
  list: ["users", "list"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers() {
  return useQuery<User[]>({
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

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user role"
      );
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? usersApi.deactivate(id) : usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
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
      toast.success("Password changed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });
}
