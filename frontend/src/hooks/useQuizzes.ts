import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  quizzesApi,
  type CreateQuizRequest,
  type UpdateQuizRequest,
} from "@/api/quizzes";
import { questionsApi, type CreateQuestionRequest, type UpdateQuestionRequest, type CreateTestCaseRequest } from "@/api/questions";

export function useMyQuizzes() {
  return useQuery({
    queryKey: ["quizzes"],
    queryFn:  quizzesApi.getMyQuizzes,
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ["quiz", id],
    queryFn:  () => quizzesApi.getById(id),
    enabled:  !!id,
  });
}

export function useQuizInfo(id: string) {
  return useQuery({
    queryKey: ["quiz-info", id],
    queryFn:  () => quizzesApi.getInfo(id),
    enabled:  !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "Published" ? 15_000 : false,
  });
}

export function useQuizByToken(token: string) {
  return useQuery({
    queryKey: ["quiz-token", token],
    queryFn:  () => quizzesApi.getByToken(token),
    enabled:  !!token,
    retry:    1,
    refetchInterval: (query) =>
      query.state.data?.status === "Published" ? 15_000 : false,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuizRequest) => quizzesApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function useUpdateQuiz(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateQuizRequest) => quizzesApi.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["quiz", id] });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function usePublishQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesApi.publish(id),
    onSuccess:  (_, id) => {
      qc.invalidateQueries({ queryKey: ["quiz", id] });
      qc.invalidateQueries({ queryKey: ["quiz-info", id] });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

// ---------- Questions ----------

export function useQuestions(quizId: string) {
  return useQuery({
    queryKey: ["questions", quizId],
    queryFn:  () => questionsApi.getByQuiz(quizId),
    enabled:  !!quizId,
  });
}

export function useCreateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => questionsApi.createInQuiz(quizId, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["questions", quizId] });
      qc.invalidateQueries({ queryKey: ["quiz", quizId] });
    },
  });
}

export function useUpdateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionRequest }) =>
      questionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", quizId] }),
  });
}

export function useDeleteQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionsApi.remove(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["questions", quizId] });
      qc.invalidateQueries({ queryKey: ["quiz", quizId] });
    },
  });
}

export function useCreateTestCase(questionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestCaseRequest) => questionsApi.createTestCase(questionId, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["test-cases", questionId] }),
  });
}
