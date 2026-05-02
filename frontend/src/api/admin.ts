import client from "./client";
import type { AdminStats, AdminUser, AdminSession, Quiz } from "./types";

export interface UpdateUserRequest {
  role?: "Admin" | "User";
  status?: "active" | "inactive";
}

export const adminApi = {
  getStats: () =>
    client.get<AdminStats>("/admin/stats").then((r) => r.data),

  getUsers: (params?: { search?: string; role?: string; page?: number; pageSize?: number }) =>
    client.get<AdminUser[]>("/admin/users", { params }).then((r) => r.data),

  updateUser: (id: string, data: UpdateUserRequest) =>
    client.put<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) =>
    client.delete(`/admin/users/${id}`),

  getQuizzes: () =>
    client.get<Quiz[]>("/admin/quizzes").then((r) => r.data),

  deleteQuiz: (id: string) =>
    client.delete(`/admin/quizzes/${id}`),

  getSessions: () =>
    client.get<AdminSession[]>("/admin/sessions").then((r) => r.data),

  forceEndSession: (id: string) =>
    client.delete(`/admin/sessions/${id}`),
};
