import { useQuery } from "@tanstack/react-query";

import { getUser, listUsers, type ApiUser } from "@/lib/api/users";

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

