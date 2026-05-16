import client from "./client";
import type { JoinQuizResponse, AdminSession, FinishResponse, SubmitResponse } from "./types";

export interface JoinRequest {
  formData: Record<string, unknown>;
}

export interface SubmitRequest {
  questionId: string;
  language?: string;
  code?: string;
  /** Stable choice IDs for MCQ (new schema) */
  selectedChoiceIds?: string[];
  textAnswer?: string;
}

export interface ExamEventRequest {
  eventType: "TabSwitch" | "FullscreenExit" | "ClipboardAttempt" | "Keydown" | "PageRefresh";
  metadata?: Record<string, unknown>;
}

export interface CodeSnapshotRequest {
  code: string;
  language: string;
  questionIndex: number;
}

export const sessionsApi = {
  join: (quizId: string, data: JoinRequest) =>
    client.post<JoinQuizResponse>(`/quizzes/${quizId}/join`, data).then((r) => r.data),

  submit: (quizId: string, data: SubmitRequest) =>
    client.post<SubmitResponse>(`/quizzes/${quizId}/submit`, data).then((r) => r.data),

  finish: (quizId: string) =>
    client.post<FinishResponse>(`/quizzes/${quizId}/finish`).then((r) => r.data),

  logEvent: (quizId: string, data: ExamEventRequest) =>
    client.post(`/quizzes/${quizId}/event`, data),

  codeSnapshot: (quizId: string, data: CodeSnapshotRequest) =>
    client.post(`/quizzes/${quizId}/code-snapshot`, data).catch(() => {}),

  selfLock: (quizId: string) =>
    client.post(`/quizzes/${quizId}/sessions/self-lock`).catch(() => {}),

  getByQuiz: (quizId: string) =>
    client.get<AdminSession[]>(`/quizzes/${quizId}/sessions`).then((r) => r.data),

};
