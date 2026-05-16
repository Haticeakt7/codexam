import client from "./client";
import type { Quiz, QuizInfo, AntiCheatOptions, FormField } from "./types";

export interface CreateQuizRequest {
  title: string;
  description?: string;
  durationMinutes: number;
  mode: "RealTime" | "FreeStyle";
  antiCheatOptions: AntiCheatOptions;
  formSchema: FormField[];
  accessCode?: string;
  startsAt?: string;    // ISO 8601 UTC
  endsAt?: string;      // ISO 8601 UTC
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  durationMinutes?: number;
  mode?: "RealTime" | "FreeStyle";
  antiCheatOptions?: AntiCheatOptions;
  formSchema?: FormField[];
  accessCode?: string;
  startsAt?: string;
  endsAt?: string;
  clearStartsAt?: boolean;
  clearEndsAt?: boolean;
}

export const quizzesApi = {
  getMyQuizzes: () =>
    client.get<Quiz[]>("/quizzes").then((r) => r.data),

  create: (data: CreateQuizRequest) =>
    client.post<Quiz>("/quizzes", data).then((r) => r.data),

  getById: (id: string) =>
    client.get<Quiz>(`/quizzes/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateQuizRequest) =>
    client.put<Quiz>(`/quizzes/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    client.delete(`/quizzes/${id}`),

  publish: (id: string) =>
    client.post<Quiz>(`/quizzes/${id}/publish`).then((r) => r.data),

  /** Public endpoint: get quiz info by quiz id (any status) */
  getInfo: (id: string) =>
    client.get<QuizInfo>(`/quizzes/${id}/info`).then((r) => r.data),

  /** Public endpoint: get quiz info by participation token */
  getByToken: (token: string) =>
    client.get<Quiz>(`/quizzes/join/${token}`).then((r) => r.data),
};
