import { useMutation, useQuery } from "@tanstack/react-query";
import { sessionsApi, type JoinRequest, type SubmitRequest, type ExamEventRequest } from "@/api/sessions";
import { submissionsApi, type ReplayDiffEntry } from "@/api/submissions";
import { useExamStore } from "@/stores/examStore";

export function useQuizSessions(quizId: string) {
  return useQuery({
    queryKey: ["quiz-sessions", quizId],
    queryFn:  () => sessionsApi.getByQuiz(quizId),
    enabled:  !!quizId,
    refetchInterval: 5000,
  });
}

export function useJoinQuiz(quizId: string) {
  const setSession = useExamStore((s) => s.setSession);

  return useMutation({
    mutationFn: (data: JoinRequest) => sessionsApi.join(quizId, data),
    onSuccess: (data) => {
      setSession({
        sessionToken: data.sessionToken,
        sessionId:    data.sessionId,
        quizId:       data.quizId,
        endsAt:       data.endsAt,
      });
      localStorage.setItem("codexam_session", data.sessionToken); // page-reload recovery; one active session at a time
    },
  });
}

export function useSubmit(quizId: string) {
  return useMutation({
    mutationFn: (data: SubmitRequest) => sessionsApi.submit(quizId, data),
  });
}

export function useLogEvent(quizId: string) {
  return useMutation({
    mutationFn: (data: ExamEventRequest) => sessionsApi.logEvent(quizId, data),
  });
}

export function useQuizResults(quizId: string) {
  return useQuery({
    queryKey: ["results", quizId],
    queryFn:  () => submissionsApi.getResults(quizId),
    enabled:  !!quizId,
  });
}

export function useReplay(sessionId: string) {
  return useQuery({
    queryKey: ["replay", sessionId],
    queryFn:  () => submissionsApi.getReplay(sessionId),
    enabled:  !!sessionId,
  });
}

export function useAppendReplayDiff(submissionId: string) {
  return useMutation({
    mutationFn: (diffs: ReplayDiffEntry[]) =>
      submissionsApi.appendReplayDiff(submissionId, diffs),
  });
}
