import client from "./client";
import type { Question, TestCase } from "./types";

export interface CreateQuestionRequest {
  type: string;
  title: string;
  body: string;
  points: number;
  orderNo: number;
  options: Record<string, unknown>;
}

export interface UpdateQuestionRequest {
  title?: string;
  body?: string;
  points?: number;
  orderNo?: number;
  options?: Record<string, unknown>;
}

export interface CreateTestCaseRequest {
  input: string;
  expectedOutput: string;
  isVisible: boolean;
}

export const questionsApi = {
  getByQuiz: (quizId: string) =>
    client.get<Question[]>(`/quizzes/${quizId}/questions`).then((r) => r.data),

  createInQuiz: (quizId: string, data: CreateQuestionRequest) =>
    client.post<Question>(`/quizzes/${quizId}/questions`, data).then((r) => r.data),

  update: (id: string, data: UpdateQuestionRequest) =>
    client.put<Question>(`/questions/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    client.delete(`/questions/${id}`),

  updateOrder: (id: string, newOrder: number) =>
    client.patch(`/questions/${id}/order`, newOrder),

  getTestCases: (questionId: string) =>
    client.get<TestCase[]>(`/questions/${questionId}/test-cases`).then((r) => r.data),

  createTestCase: (questionId: string, data: CreateTestCaseRequest) =>
    client.post<TestCase>(`/questions/${questionId}/test-cases`, data).then((r) => r.data),

  deleteTestCase: (questionId: string, caseId: string) =>
    client.delete(`/questions/${questionId}/test-cases/${caseId}`),
};
