// ==========================================================
// QuizLanding – Quiz Katılım Sayfası (by quiz ID)
// ROUTE: /q/:id  (public, auth gerekmez)
// ==========================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuizInfo } from "@/hooks/useQuizzes";
import { useJoinQuiz } from "@/hooks/useSessions";
import { useExamStore } from "@/stores/examStore";
import AppLayout from "@/components/layouts/AppLayout";
import type { QuizInfo } from "@/api/types";

// ── Helpers ──────────────────────────────────────────────

export function formatLocalDatetime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function useCountdown(targetIso?: string) {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!targetIso) { setMs(0); return; }
    const target = new Date(targetIso).getTime();
    const tick = () => setMs(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return ms;
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  Draft:     "quizLanding.draft",
  Published: "quizLanding.published",
  Active:    "quizLanding.active",
  Ended:     "quizLanding.ended",
  Archived:  "quizLanding.archived",
};

const STATUS_CLASSES: Record<string, string> = {
  Draft:     "bg-surface2 text-muted border-border",
  Published: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Active:    "bg-green-500/20 text-green-500 border-green-500/30",
  Ended:     "bg-red-500/20 text-red-400 border-red-500/30",
  Archived:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

// ── QuizLandingView (shared between ID and token routes) ──

interface QuizLandingViewProps {
  quiz: QuizInfo;
  quizId: string;
}

export function QuizLandingView({ quiz, quizId }: QuizLandingViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: joinQuiz, isPending } = useJoinQuiz(quizId);
  const { setSession } = useExamStore();

  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const alreadyCompleted = localStorage.getItem(`codexam_completed_${quizId}`) === "1";

  // Countdown for scheduled quizzes
  const countdownMs = useCountdown(
    quiz.status === "Published" && quiz.startsAt ? quiz.startsAt : undefined
  );
  const isCountdownDone = quiz.status === "Published" && countdownMs === 0;

  // canJoin: either the quiz is Active, or countdown just hit 0 (server may update any moment)
  const canJoin = quiz.status === "Active" || isCountdownDone;

  const validate = () => {
    const next: Record<string, string> = {};
    quiz.formSchema?.forEach((field) => {
      if (field.required && !formData[field.label]) {
        next[field.label] = t("common.required");
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    joinQuiz(
      { formData },
      {
        onSuccess: ({ sessionToken, sessionId, endsAt, questions }: any) => {
          const qs = questions ?? [];
          setSession({ sessionToken, sessionId, endsAt, quizId, questions: qs });
          localStorage.setItem(`codexam_session_${quizId}`, sessionToken);
          localStorage.setItem(`codexam_full_session_${quizId}`, JSON.stringify({ sessionToken, sessionId, quizId, endsAt, questions: qs }));
          navigate(`/q/${quizId}/take`);
        },
        onError: (err: any) => {
          const msg: string = err?.response?.data?.error ?? "";
          if (msg === "duplicate_identity") {
            const identityField = quiz.formSchema?.find((f) => f.isIdentity);
            if (identityField) {
              setErrors({ [identityField.label]: t("quizLanding.identityAlreadyUsed") });
            }
          }
        },
      }
    );
  };

  const handleFieldChange = (label: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
    if (errors[label]) {
      const next = { ...errors };
      delete next[label];
      setErrors(next);
    }
  };

  const statusLabel = t(STATUS_LABELS[quiz.status] ?? "quizLanding.ended", quiz.status);
  const statusClass = STATUS_CLASSES[quiz.status] ?? STATUS_CLASSES.Draft;

  // Decide whether to show the participant form
  const showForm = quiz.status === "Active" || (quiz.status === "Published" && !!quiz.formSchema?.length);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl p-4 py-8 md:py-12">

        {/* Quiz Info Card */}
        <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-text">{quiz.title}</h1>
              {quiz.description && <p className="mt-2 text-sm text-muted">{quiz.description}</p>}
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex-shrink-0 ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-text mb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">{t("quizLanding.duration")}</span>
              <span className="text-muted">{quiz.durationMinutes} {t("quizLanding.minutes")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t("quizLanding.questionsLabel")}</span>
              <span className="text-muted">{quiz.questionCount} {t("quizLanding.questionCount")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t("quiz.mode")}</span>
              <span className="text-muted">{t(`quiz.mode${quiz.mode}`)}</span>
            </div>
          </div>

          {/* Scheduling info */}
          {(quiz.startsAt || quiz.endsAt) && (
            <div className="flex flex-wrap gap-4 text-xs text-muted mt-2 border-t border-border pt-3">
              {quiz.startsAt && (
                <span>🕐 {t("quizLanding.startsAt")}: <strong>{formatLocalDatetime(quiz.startsAt)}</strong></span>
              )}
              {quiz.endsAt && (
                <span>🏁 {t("quizLanding.endsAt")}: <strong>{formatLocalDatetime(quiz.endsAt)}</strong></span>
              )}
            </div>
          )}

          {/* Anti-cheat warnings */}
          {quiz.antiCheatOptions && (
            quiz.antiCheatOptions.tabSwitch ||
            quiz.antiCheatOptions.fullscreen ||
            quiz.antiCheatOptions.clipboard
          ) && (
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-yellow-600 dark:text-yellow-500">
                {t("quizLanding.antiCheatTitle")}
              </h3>
              <ul className="list-inside list-disc text-sm text-yellow-600/80 dark:text-yellow-500/80 space-y-1">
                {quiz.antiCheatOptions.tabSwitch && <li>{t("quizLanding.tabSwitchWarning")}</li>}
                {quiz.antiCheatOptions.fullscreen && <li>{t("quizLanding.fullscreenWarning")}</li>}
                {quiz.antiCheatOptions.clipboard  && <li>{t("quizLanding.clipboardWarning")}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Countdown when quiz is scheduled */}
        {quiz.status === "Published" && quiz.startsAt && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-center shadow-sm">
            {countdownMs > 0 ? (
              <>
                <p className="mb-2 text-sm text-muted">{t("quizLanding.startsIn") || "Starts in"}</p>
                <p className="text-4xl font-bold tabular-nums text-blue-400">{formatCountdown(countdownMs)}</p>
                <p className="mt-2 text-xs text-muted">{formatLocalDatetime(quiz.startsAt)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-green-400">{t("quizLanding.startingSoon") || "Quiz is starting…"}</p>
                <div className="mt-2 h-4 w-4 mx-auto animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
              </>
            )}
          </div>
        )}

        {/* Already completed banner */}
        {alreadyCompleted && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center shadow-sm">
            <div className="text-3xl mb-2">✅</div>
            <h2 className="text-lg font-bold text-green-500 mb-1">{t("quizLanding.alreadyCompletedTitle")}</h2>
            <p className="text-sm text-muted">{t("quizLanding.alreadyCompletedMessage")}</p>
          </div>
        )}

        {/* Participant form / status messages — hidden when already completed */}
        {!alreadyCompleted && (
          showForm ? (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-text">{t("quizLanding.formTitle")}</h2>
              {quiz.status === "Published" && (
                <p className="mb-4 text-xs text-muted">
                  {t("quizLanding.formPreFillHint") || "Fill in your details now. You'll be able to join once the quiz starts."}
                </p>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                {quiz.formSchema?.map((field, index) => (
                  <div key={index}>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text">
                      <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                      {field.isIdentity && (
                        <span className="text-xs font-normal text-primary/70 border border-primary/30 rounded px-1 py-0.5 leading-none">
                          {t("quiz.identityFieldBadge")}
                        </span>
                      )}
                    </label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      required={field.required && canJoin}
                      value={formData[field.label] ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          field.label,
                          field.type === "number" ? Number(e.target.value) : e.target.value
                        )
                      }
                      className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:outline-none ${
                        errors[field.label]
                          ? "border-red-500 focus:border-red-500"
                          : "border-border focus:border-primary"
                      }`}
                      placeholder={`${field.label} ${t("quizLanding.fieldPlaceholder")}`}
                    />
                    {errors[field.label] && (
                      <span className="text-xs text-red-500 mt-1 block">{errors[field.label]}</span>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isPending || !canJoin}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    canJoin
                      ? "bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                      : "bg-surface2 text-muted cursor-not-allowed border border-border"
                  }`}
                >
                  {isPending
                    ? t("quizLanding.preparing")
                    : canJoin
                      ? t("quizLanding.enterExam")
                      : t("quizLanding.waitingForStart") || "Waiting for quiz to start…"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface2 p-6 text-center shadow-sm">
              <p className="text-muted">
                {quiz.status === "Draft" && t("quizLanding.draftMessage")}
                {quiz.status === "Published" && !quiz.startsAt && t("quizLanding.draftMessage")}
                {quiz.status === "Ended"    && t("quizLanding.endedMessage")}
                {quiz.status === "Archived" && t("quizLanding.archivedMessage")}
              </p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}

// ── Page component (by quiz ID) ───────────────────────────

export default function QuizLanding() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: quiz, isLoading, error } = useQuizInfo(id!);

  if (isLoading) return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (error || !quiz) return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <div className="text-center text-muted">{t("quizLanding.notFound")}</div>
      </div>
    </AppLayout>
  );

  return <QuizLandingView quiz={quiz} quizId={id!} />;
}
