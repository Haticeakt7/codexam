import { create } from "zustand";

export interface AntiCheatEvent {
  eventType: "TabSwitch" | "FullscreenExit" | "ClipboardAttempt" | "Keydown";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AnswerDraft {
  code?: string;
  language?: string;
  selectedChoices?: number[];
  textAnswer?: string;
}

interface ExamState {
  sessionToken: string | null;
  sessionId: string | null;
  quizId: string | null;
  endsAt: string | null;
  activeQuestionIndex: number;
  answers: Record<string, AnswerDraft>;
  antiCheatEvents: AntiCheatEvent[];
  isLocked: boolean;

  setSession: (data: {
    sessionToken: string;
    sessionId: string;
    quizId: string;
    endsAt: string;
  }) => void;
  setActiveQuestion: (index: number) => void;
  updateAnswer: (questionId: string, draft: AnswerDraft) => void;
  addAntiCheatEvent: (event: AntiCheatEvent) => void;
  lock: () => void;
  clear: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  sessionToken: null,
  sessionId: null,
  quizId: null,
  endsAt: null,
  activeQuestionIndex: 0,
  answers: {},
  antiCheatEvents: [],
  isLocked: false,

  setSession: (data) =>
    set({
      sessionToken: data.sessionToken,
      sessionId: data.sessionId,
      quizId: data.quizId,
      endsAt: data.endsAt,
    }),

  setActiveQuestion: (index) => set({ activeQuestionIndex: index }),

  updateAnswer: (questionId, draft) =>
    set((s) => ({
      answers: { ...s.answers, [questionId]: { ...s.answers[questionId], ...draft } },
    })),

  addAntiCheatEvent: (event) =>
    set((s) => ({ antiCheatEvents: [...s.antiCheatEvents, event] })),

  lock: () => set({ isLocked: true }),

  clear: () =>
    set({
      sessionToken: null,
      sessionId: null,
      quizId: null,
      endsAt: null,
      activeQuestionIndex: 0,
      answers: {},
      antiCheatEvents: [],
      isLocked: false,
    }),
}));
