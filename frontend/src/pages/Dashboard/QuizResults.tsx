// ==========================================================
// QuizResults – Sınav Sonuçları
// ROUTE: /dashboard/quiz/:id/results  (PrivateRoute: User + Admin)
// ==========================================================

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import { useQuizResults, useSessionSubmissions } from "@/hooks/useSessions";
import { usePreferencesStore } from "@/stores/preferencesStore";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import type { SessionSubmission, ViolationEntry } from "@/api/types";

// ---------- Participant Answers Modal ----------

interface ParticipantAnswersModalProps {
  sessionId: string;
  participantName: string;
  quizId: string;
  onClose: () => void;
}

function ParticipantAnswersModal({ sessionId, participantName, quizId, onClose }: ParticipantAnswersModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefs = usePreferencesStore();
  const { data, isLoading } = useSessionSubmissions(sessionId);

  const renderAnswer = (sub: SessionSubmission) => {
    const isCoding = sub.questionType === "Coding" || sub.questionType === "BugFix";
    const isMcq = sub.questionType === "MultipleChoice";

    if (!sub.code) {
      return <p className="text-sm text-muted italic">{t("results.noAnswer")}</p>;
    }

    if (isCoding) {
      return (
        <div className="rounded border border-border overflow-hidden">
          <Editor
            height="180px"
            value={sub.code}
            language={sub.language || "plaintext"}
            theme={prefs.editorTheme}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      );
    }

    if (isMcq) {
      let choices: string[] = [];
      try { choices = JSON.parse(sub.code); } catch { choices = [sub.code]; }
      return (
        <div className="flex flex-wrap gap-1">
          {choices.map((c, i) => (
            <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary border border-primary/30">
              {c}
            </span>
          ))}
        </div>
      );
    }

    return <p className="text-sm text-text font-mono bg-surface2 rounded px-3 py-2 border border-border">{sub.code}</p>;
  };

  const statusColor = (status: string) => {
    if (status === "Passed") return "text-green-500";
    if (status === "Failed") return "text-red-400";
    return "text-muted";
  };

  const formatTs = (ts: string, startedAt?: string): string => {
    if (!startedAt) return new Date(ts).toLocaleTimeString();
    const ms = new Date(ts).getTime() - new Date(startedAt).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `+${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderViolations = (violations: ViolationEntry[], startedAt?: string) => {
    const count = violations?.length ?? 0;
    const title = count === 0
      ? t("results.violationsNone")
      : t("results.violationsCount", { count });
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${count > 0 ? "text-red-500" : "text-muted"}`}>
          {title}
        </p>
        {count > 0 && (
          <ul className="flex flex-col gap-0.5">
            {violations.map((v, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted">
                <span className="font-mono tabular-nums w-14 flex-shrink-0">{formatTs(v.timestamp, startedAt)}</span>
                <span className={v.severity === "High" ? "text-red-500 font-medium" : "text-yellow-600 dark:text-yellow-400 font-medium"}>
                  {t(`monitor.eventType.${v.eventType}`, { defaultValue: v.eventType })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text">{t("results.participantAnswers")}</h2>
            <p className="text-sm text-muted mt-0.5">{participantName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
          >✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted text-sm">
              {t("results.loadingAnswers")}
            </div>
          ) : !data || data.submissions.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted text-sm">
              {t("results.noAnswer")}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {data.submissions.map((sub) => {
                const isCoding = sub.questionType === "Coding" || sub.questionType === "BugFix";
                return (
                  <div key={sub.submissionId} className="rounded-lg border border-border bg-bg p-4">
                    {/* Question header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{sub.questionTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted">{sub.questionType}</span>
                          {isCoding && sub.language && sub.language !== "unknown" && (
                            <span className="text-xs text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{sub.language}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold ${statusColor(sub.status)}`}>
                          {sub.score} / {sub.questionPoints} {t("results.points")}
                        </span>
                        {isCoding && sub.hasReplay && (
                          <button
                            onClick={() => navigate(`/dashboard/quiz/${quizId}/replay/${sessionId}`)}
                            className="text-xs bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                          >
                            {t("results.replayBtn")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Answer */}
                    <div>
                      <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">{t("results.answer")}</p>
                      {renderAnswer(sub)}
                    </div>

                    {/* Violations */}
                    {renderViolations(sub.violations ?? [], data?.startedAt)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex justify-end flex-shrink-0">
          <button
            onClick={() => navigate(`/dashboard/quiz/${quizId}/replay/${sessionId}`)}
            className="mr-3 text-sm text-primary hover:underline"
          >
            {t("results.replay")}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-surface2 border border-border px-4 py-1.5 text-sm text-text hover:bg-border transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function QuizResults() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuizResults(id!);
  const [selectedSession, setSelectedSession] = useState<{ sessionId: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  const sessions = data?.participants || [];
  const questionStats = data?.questionStats || [];

  const totalParticipants = sessions.length;
  const avgScore = totalParticipants > 0
    ? (sessions.reduce((acc: number, s: any) => acc + (s.totalScore || 0), 0) / totalParticipants).toFixed(1)
    : "0";
  const totalQuestions = questionStats.length;
  const completionRate = totalParticipants > 0 && totalQuestions > 0
    ? Math.round((sessions.filter((s: any) => (s.completedQuestions || 0) >= totalQuestions).length / totalParticipants) * 100)
    : 0;

  const getParticipantName = (p: any) => {
    if (p.formData && typeof p.formData === "object") {
      return p.formData["Ad Soyad"] || p.formData["Ad"] || p.formData["Name"] || p.formData["name"] || p.sessionId || t("common.anonymous");
    }
    return p.sessionId || t("common.anonymous");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-text">{t("results.title")}</h1>
          <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-muted hover:text-text transition-colors">
            {t("common.backToDashboard")}
          </button>
        </header>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="mb-2 text-4xl font-bold text-primary">{totalParticipants}</span>
            <span className="text-sm font-medium text-muted">{t("results.participantCount")}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="mb-2 text-4xl font-bold text-green-500">{avgScore}</span>
            <span className="text-sm font-medium text-muted">{t("results.avgScore")}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="mb-2 text-4xl font-bold text-blue-500">%{completionRate}</span>
            <span className="text-sm font-medium text-muted">{t("results.completionRate")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Participant Table */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="mb-4 text-lg font-bold text-text">{t("results.participantList")}</h2>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm text-text">
                <thead className="border-b border-border text-xs uppercase text-muted bg-surface2">
                  <tr>
                    <th className="px-4 py-3 font-bold rounded-tl-lg">{t("results.participant")}</th>
                    <th className="px-4 py-3 font-bold">{t("results.score")}</th>
                    <th className="px-4 py-3 font-bold">{t("results.completed")}</th>
                    <th className="px-4 py-3 font-bold">{t("results.violations")}</th>
                    <th className="px-4 py-3 font-bold text-right rounded-tr-lg">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted">{t("results.noResults")}</td>
                    </tr>
                  ) : (
                    sessions.map((session: any, index: number) => (
                      <tr key={index} className="border-b border-border hover:bg-surface2/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{getParticipantName(session)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500 whitespace-nowrap">
                            {session.totalScore || 0} / {session.maxScore || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {session.completedQuestions || 0}
                        </td>
                        <td className="px-4 py-3">
                          {(session.violationCount || 0) > 0 ? (
                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500 whitespace-nowrap">
                              🔴 {session.violationCount}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedSession({ sessionId: session.sessionId, name: getParticipantName(session) })}
                              className="inline-flex items-center gap-1 rounded bg-surface2 border border-border px-2 py-1 text-xs font-medium text-text hover:bg-border transition-colors"
                            >
                              {t("results.viewAnswers")}
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/quiz/${id}/replay/${session.sessionId}`)}
                              className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                            >
                              {t("results.replay")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Stats */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-text">{t("results.questionStats")}</h2>
            {questionStats.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">{t("results.noData")}</div>
            ) : (
              <div className="flex flex-col gap-4">
                {questionStats.map((stat: any, index: number) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-medium text-text">
                      <span className="truncate max-w-[150px]">{stat.title || `${t("exam.questionLabel")} ${index + 1}`}</span>
                      <span>%{Math.round(stat.successRate || 0)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${stat.successRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participant Answers Modal */}
      {selectedSession && (
        <ParticipantAnswersModal
          sessionId={selectedSession.sessionId}
          participantName={selectedSession.name}
          quizId={id!}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </DashboardLayout>
  );
}
