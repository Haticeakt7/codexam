import client from "./client";
import type { ReplayData, QuizResults, ReplayDiffEntry } from "./types";

export type { ReplayDiffEntry };

export const submissionsApi = {
  appendReplayDiff: (submissionId: string, diffs: ReplayDiffEntry[]) =>
    client.patch(`/submissions/${submissionId}/replay`, { diffs }),

  getReplay: (sessionId: string) =>
    client.get<ReplayData>(`/sessions/${sessionId}/replay`).then((r) => r.data),

  getResults: (quizId: string) =>
    client.get<QuizResults>(`/quizzes/${quizId}/results`).then((r) => r.data),
};
