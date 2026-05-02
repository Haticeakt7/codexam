import client from "./client";
import type { JoinQuizResponse, AdminSession } from "./types";

export interface JoinRequest {
  formData: Record<string, unknown>;
}

export interface SubmitRequest {
  questionId: string;
  language?: string;
  code?: string;
  selectedChoices?: number[];
  textAnswer?: string;
}

export interface ExamEventRequest {
  eventType: "TabSwitch" | "FullscreenExit" | "ClipboardAttempt" | "Keydown";
  metadata?: Record<string, unknown>;
}

export const sessionsApi = {
  join: (quizId: string, data: JoinRequest) =>
    client.post<JoinQuizResponse>(`/quizzes/${quizId}/join`, data).then((r) => r.data),

  submit: (quizId: string, data: SubmitRequest) =>
    client.post(`/quizzes/${quizId}/submit`, data),

  logEvent: (quizId: string, data: ExamEventRequest) =>
    client.post(`/quizzes/${quizId}/event`, data),

  getByQuiz: (quizId: string) =>
    client.get<AdminSession[]>(`/quizzes/${quizId}/sessions`).then((r) => r.data),
};
