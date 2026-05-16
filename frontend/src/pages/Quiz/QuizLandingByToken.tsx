// ==========================================================
// QuizLandingByToken – Quiz Katılım Sayfası (by participation token)
// ROUTE: /q/join/:token  (public, auth gerekmez)
// ==========================================================

import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuizByToken } from "@/hooks/useQuizzes";
import { QuizLandingView } from "./QuizLanding";
import AppLayout from "@/components/layouts/AppLayout";
import type { QuizInfo } from "@/api/types";

export default function QuizLandingByToken() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data: quiz, isLoading, error } = useQuizByToken(token!);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (error || !quiz) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
          <div className="text-center text-muted">{t("quizLanding.notFound")}</div>
        </div>
      </AppLayout>
    );
  }

  // Quiz (full DTO) is compatible with QuizInfo — cast for shared component
  const quizInfo: QuizInfo = {
    id:               quiz.id,
    title:            quiz.title,
    description:      quiz.description,
    durationMinutes:  quiz.durationMinutes,
    questionCount:    quiz.questionCount,
    mode:             quiz.mode,
    formSchema:       quiz.formSchema,
    antiCheatOptions: quiz.antiCheatOptions,
    status:           quiz.status,
    startsAt:         quiz.startsAt,
    endsAt:           quiz.endsAt,
  };

  return <QuizLandingView quiz={quizInfo} quizId={quiz.id} />;
}
