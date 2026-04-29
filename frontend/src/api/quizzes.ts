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
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  durationMinutes?: number;
  mode?: "RealTime" | "FreeStyle";
  antiCheatOptions?: AntiCheatOptions;
  formSchema?: FormField[];
  accessCode?: string;
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

  getInfo: (id: string) =>
    client.get<QuizInfo>(`/quizzes/${id}/info`).then((r) => r.data),
};
