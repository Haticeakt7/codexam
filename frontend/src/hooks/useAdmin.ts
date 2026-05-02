import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UpdateUserRequest } from "@/api/admin";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn:  adminApi.getStats,
    staleTime: 30_000,
  });
}

export function useAdminUsers(params?: { search?: string; role?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn:  () => adminApi.getUsers(params),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useAdminQuizzes() {
  return useQuery({
    queryKey: ["admin-quizzes"],
    queryFn:  adminApi.getQuizzes,
  });
}

export function useAdminSessions() {
  return useQuery({
    queryKey: ["admin-sessions"],
    queryFn:  adminApi.getSessions,
  });
}

export function useForceEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.forceEndSession(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-sessions"] }),
  });
}
