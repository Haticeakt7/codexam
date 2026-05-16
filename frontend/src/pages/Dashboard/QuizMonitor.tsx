// ==========================================================
// QuizMonitor – Canlı Sınav İzleme (SignalR entegrasyonu)
// ROUTE: /dashboard/quiz/:id/monitor  (PrivateRoute: User + Admin)
// ==========================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import * as signalR from "@microsoft/signalr";
import { useQuizSessions } from "@/hooks/useSessions";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import type { AdminSession, AdminSessionEvent } from "@/api/types";
import client from "@/api/client";
import { toast } from "@/stores/toastStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";
const HUB_URL = BASE_URL.replace(/\/api$/, "") + "/hubs/monitor";

type DetailTab = "violations" | "warnings";

function getParticipantName(p: AdminSession): string {
  if (p.formData && typeof p.formData === "object") {
    return (
      (p.formData["Ad Soyad"] as string) ||
      (p.formData["Ad"] as string) ||
      (p.formData["Name"] as string) ||
      (p.formData["İsim"] as string) ||
      "Anonim"
    );
  }
  return "Anonim";
}

function formatTimestamp(timestamp: string, startedAt: string): string {
  const elapsedMs = new Date(timestamp).getTime() - new Date(startedAt).getTime();
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  return `+${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function QuizMonitor() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uiTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { data: initialSessions, isLoading } = useQuizSessions(id!);

  const [participants, setParticipants] = useState<AdminSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [warnTarget, setWarnTarget] = useState<AdminSession | null>(null);
  const [warnMessage, setWarnMessage] = useState("");
  const [terminateTarget, setTerminateTarget] = useState<AdminSession | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [hubStatus, setHubStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [detailTab, setDetailTab] = useState<DetailTab>("violations");

  const hubRef = useRef<signalR.HubConnection | null>(null);

  // Reset detail tab when switching participants
  useEffect(() => { setDetailTab("violations"); }, [selectedId]);

  // Initial load — merge REST API data with any live SignalR state already in memory.
  // REST API is authoritative for isActive/isLocked/totalScore; live fields (code, events) come from SignalR.
  useEffect(() => {
    if (!initialSessions) return;
    setParticipants((prev) => {
      const merged = initialSessions.map((s) => {
        const live = prev.find((p) => p.id === s.id);
        if (live) {
          return {
            ...s,
            // Once SignalR marks a session finished, don't restore it to active on REST refetch
            isActive: live.isActive === false ? false : s.isActive,
            antiCheatEvents: live.antiCheatEvents.length > (s.antiCheatEvents?.length ?? 0) ? live.antiCheatEvents : (s.antiCheatEvents ?? []),
            warnings:        live.warnings.length > (s.warnings?.length ?? 0) ? live.warnings : (s.warnings ?? []),
            latestCode:          live.latestCode          ?? s.latestCode,
            latestLanguage:      live.latestLanguage      ?? s.latestLanguage,
            currentQuestionIndex: live.currentQuestionIndex ?? s.currentQuestionIndex,
          };
        }
        return { ...s, antiCheatEvents: s.antiCheatEvents ?? [], warnings: s.warnings ?? [] };
      });
      // Preserve live-only participants not yet in REST API response (joined very recently)
      const liveOnly = prev.filter((p) => !merged.find((m) => m.id === p.id));
      return [...merged, ...liveOnly];
    });
  }, [initialSessions]);

  // SignalR connection
  useEffect(() => {
    if (!id || !accessToken) return;

    const hub = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .build();

    hub.on("ParticipantJoined", (data: any) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === data.sessionId)) return prev;
        const newParticipant: AdminSession = {
          id: data.sessionId,
          quizId: id!,
          quizTitle: "",
          formData: data.formData ?? {},
          startedAt: data.startedAt,
          endsAt: data.endsAt,
          isActive: true,
          isLocked: false,
          totalScore: 0,
          antiCheatEventCount: 0,
          antiCheatEvents: [],
          warnings: [],
        };
        return [...prev, newParticipant];
      });
    });

    hub.on("AntiCheatEvent", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== data.sessionId) return p;
          const newEvent: AdminSessionEvent = {
            eventType: data.eventType,
            severity: data.severity ?? "Medium",
            timestamp: data.timestamp,
          };
          return {
            ...p,
            antiCheatEventCount: (p.antiCheatEventCount ?? 0) + 1,
            antiCheatEvents: [...(p.antiCheatEvents ?? []), newEvent],
          };
        })
      );
    });

    hub.on("SessionLocked", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.sessionId ? { ...p, isActive: false, isLocked: true } : p
        )
      );
    });

    hub.on("WarningSent", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== data.sessionId) return p;
          const newWarning: AdminSessionEvent = {
            eventType: "Warned",
            severity: "Low",
            timestamp: data.timestamp,
            message: data.message,
          };
          return { ...p, warnings: [...(p.warnings ?? []), newWarning] };
        })
      );
    });

    hub.on("CodeSnapshot", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.sessionId
            ? { ...p, latestCode: data.code, latestLanguage: data.language, currentQuestionIndex: data.questionIndex }
            : p
        )
      );
    });

    hub.on("SubmissionReceived", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.sessionId ? { ...p, totalScore: p.totalScore + (data.score ?? 0) } : p
        )
      );
    });

    hub.on("SessionFinished", (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.sessionId ? { ...p, isActive: false, totalScore: data.totalScore } : p
        )
      );
    });

    hub.start()
      .then(() => {
        setHubStatus("connected");
        return hub.invoke("JoinQuizMonitor", id);
      })
      .catch(() => setHubStatus("error"));

    hub.onreconnected(() => {
      setHubStatus("connected");
      hub.invoke("JoinQuizMonitor", id).catch(console.error);
    });

    hubRef.current = hub;

    return () => {
      hub.invoke("LeaveQuizMonitor", id).catch(() => {});
      hub.stop();
    };
  }, [id, accessToken]);

  const selectedParticipant = participants.find((p) => p.id === selectedId) ?? null;

  const handleWarn = useCallback(async () => {
    if (!warnTarget || !warnMessage.trim() || !hubRef.current) return;
    try {
      await hubRef.current.invoke("WarnParticipant", warnTarget.id, warnMessage.trim());
    } catch { /* ignore */ }
    setWarnTarget(null);
    setWarnMessage("");
  }, [warnTarget, warnMessage]);

  const handleTerminate = useCallback(async () => {
    if (!terminateTarget) return;
    setIsTerminating(true);
    try {
      await client.delete(`/quizzes/${id}/sessions/${terminateTarget.id}`);
      setParticipants((prev) =>
        prev.map((p) => p.id === terminateTarget.id ? { ...p, isActive: false, isLocked: true } : p)
      );
      if (selectedId === terminateTarget.id) setSelectedId(null);
      toast.success(t("monitor.terminateSuccess"));
    } catch {
      // global interceptor shows the error toast
    }
    setIsTerminating(false);
    setTerminateTarget(null);
  }, [terminateTarget, selectedId, t]);

  const getStatusLabel = (p: AdminSession) => {
    if (p.isActive) return { label: t("monitor.online"), cls: "text-green-500" };
    if (p.isLocked) return { label: t("monitor.terminated"), cls: "text-red-500" };
    return { label: t("monitor.finishedNormal"), cls: "text-muted" };
  };

  if (isLoading) {
    return (
      <DashboardLayout noPadding>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout noPadding>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-surface px-4 sm:px-6 py-3 min-h-[3.5rem] flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-xl font-bold text-text whitespace-nowrap">{t("monitor.title")}</h1>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${
              hubStatus === "connected"
                ? "bg-red-500/10 text-red-500"
                : hubStatus === "connecting"
                ? "bg-yellow-500/10 text-yellow-500"
                : "bg-surface2 text-muted"
            }`}>
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                hubStatus === "connected" ? "bg-red-500 animate-pulse"
                  : hubStatus === "connecting" ? "bg-yellow-500 animate-pulse"
                  : "bg-muted"
              }`} />
              {hubStatus === "connected" ? t("monitor.live") : hubStatus === "connecting" ? "Bağlanıyor..." : "Bağlanamadı"}
            </span>
            <span className="text-sm font-medium text-muted whitespace-nowrap">
              {participants.filter((p) => p.isActive).length} {t("quiz.participants")}
            </span>
          </div>
          <div className="flex gap-3 sm:gap-4 flex-shrink-0">
            <button onClick={() => navigate(`/dashboard/quiz/${id}/results`)} className="text-sm font-medium text-primary hover:text-primary-hover">
              {t("monitor.resultsLink")}
            </button>
            <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-muted hover:text-text">
              {t("common.backToDashboard")}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Participant Grid */}
          <div className="flex-1 overflow-y-auto bg-bg p-6">
            {participants.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted">
                <p className="text-lg mb-2">👥</p>
                <p>{t("monitor.noParticipants")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {participants.map((p) => {
                  const violationCount = p.antiCheatEvents?.length ?? 0;
                  const warningCount   = p.warnings?.length ?? 0;
                  const hasHighViolation = p.antiCheatEvents?.some((e) => e.severity === "High");
                  const status = getStatusLabel(p);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`flex cursor-pointer flex-col rounded-xl border bg-surface p-4 shadow-sm transition-all hover:shadow-md ${
                        selectedId === p.id ? "border-primary ring-1 ring-primary"
                          : hasHighViolation ? "border-red-500/50"
                          : p.isLocked ? "border-orange-500/40"
                          : "border-border"
                      } ${!p.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-bold text-text truncate">{getParticipantName(p)}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {p.isLocked && !p.isActive && (
                            <span className="rounded px-1.5 py-0.5 text-xs font-bold bg-red-500/15 text-red-500">
                              🔒
                            </span>
                          )}
                          {violationCount > 0 && (
                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                              hasHighViolation ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500"
                            }`}>
                              {hasHighViolation ? "🔴" : "⚠"} {violationCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3 text-xs text-muted space-y-1">
                        <div className="flex justify-between">
                          <span>{t("monitor.question")}: {(p.currentQuestionIndex ?? 0) + 1}</span>
                          <span className={status.cls}>{status.label}</span>
                        </div>
                        {warningCount > 0 && (
                          <div className="text-yellow-500 font-medium">⚠ {warningCount} {t("monitor.warningsTab")}</div>
                        )}
                        {p.totalScore > 0 && (
                          <div className="text-primary font-medium">{t("results.score")}: {p.totalScore}</div>
                        )}
                      </div>

                      {p.isActive && (
                        <div className="mt-auto flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setWarnTarget(p); }}
                            className="flex-1 rounded border border-border bg-surface2 py-1 text-xs font-medium text-text hover:bg-border transition-colors"
                          >
                            {t("monitor.warn")}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setTerminateTarget(p); }}
                            className="flex-1 rounded bg-red-500/10 py-1 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            {t("monitor.terminate")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side Panel – desktop inline, mobile fixed overlay */}
          {selectedParticipant && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => setSelectedId(null)}
              />
            <div className="fixed inset-y-0 right-0 z-40 flex w-full sm:w-96 flex-col border-l border-border bg-surface shadow-lg lg:relative lg:inset-auto lg:z-auto lg:w-96 lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-bold text-text truncate pr-4">{getParticipantName(selectedParticipant)}</h2>
                <button onClick={() => setSelectedId(null)} className="text-muted hover:text-text flex-shrink-0">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded border border-border bg-bg p-2 text-center">
                    <div className="text-xs text-muted">{t("monitor.activeQuestion")}</div>
                    <div className="font-bold text-text">{(selectedParticipant.currentQuestionIndex ?? 0) + 1}</div>
                  </div>
                  <div className="rounded border border-border bg-bg p-2 text-center">
                    <div className="text-xs text-muted">{t("common.status")}</div>
                    {(() => {
                      const s = getStatusLabel(selectedParticipant);
                      return <div className={`font-bold ${s.cls}`}>{s.label}</div>;
                    })()}
                  </div>
                  <div className="rounded border border-border bg-bg p-2 text-center col-span-2">
                    <div className="text-xs text-muted">{t("results.score")}</div>
                    <div className="font-bold text-primary">{selectedParticipant.totalScore}</div>
                  </div>
                </div>

                {/* Termination badge */}
                {!selectedParticipant.isActive && selectedParticipant.isLocked && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <span className="text-sm">🔒</span>
                    <div>
                      <p className="text-xs font-bold text-red-500">{t("monitor.terminated")}</p>
                      <p className="text-xs text-muted">
                        {selectedParticipant.antiCheatEvents?.some((e) => e.eventType === "PageRefresh")
                          ? t("monitor.terminatedSelf")
                          : t("monitor.terminatedAdmin")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Live Code */}
                <div>
                  <h3 className="mb-2 text-sm font-bold text-text flex items-center gap-2">
                    {t("monitor.lastCode")}
                    {selectedParticipant.latestLanguage && (
                      <span className="text-xs text-muted font-normal">({selectedParticipant.latestLanguage})</span>
                    )}
                  </h3>
                  <div className="h-56 rounded-lg border border-border overflow-hidden">
                    <Editor
                      language={selectedParticipant.latestLanguage ?? "javascript"}
                      value={selectedParticipant.latestCode || t("monitor.noCode")}
                      theme={uiTheme === "dark" ? "vs-dark" : "vs"}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11, automaticLayout: true }}
                    />
                  </div>
                </div>

                {/* Violations / Warnings tabs */}
                {((selectedParticipant.antiCheatEvents?.length ?? 0) > 0 ||
                  (selectedParticipant.warnings?.length ?? 0) > 0) && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-border">
                      <button
                        onClick={() => setDetailTab("violations")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                          detailTab === "violations"
                            ? "bg-red-500/10 text-red-500 border-b-2 border-red-500"
                            : "text-muted hover:bg-surface2"
                        }`}
                      >
                        {t("monitor.violationsTab")}
                        {(selectedParticipant.antiCheatEvents?.length ?? 0) > 0 && (
                          <span className="rounded-full bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                            {selectedParticipant.antiCheatEvents?.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setDetailTab("warnings")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                          detailTab === "warnings"
                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500"
                            : "text-muted hover:bg-surface2"
                        }`}
                      >
                        {t("monitor.warningsTab")}
                        {(selectedParticipant.warnings?.length ?? 0) > 0 && (
                          <span className="rounded-full bg-yellow-500 text-white px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                            {selectedParticipant.warnings?.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Violations list */}
                    {detailTab === "violations" && (
                      <ul className="flex flex-col divide-y divide-border max-h-52 overflow-y-auto">
                        {selectedParticipant.antiCheatEvents?.length === 0 ? (
                          <li className="px-3 py-4 text-xs text-muted text-center italic">{t("common.noData")}</li>
                        ) : (
                          [...(selectedParticipant.antiCheatEvents ?? [])]
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                            .map((e, i) => {
                              const isHigh = e.severity === "High";
                              return (
                                <li key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                                  <span className="font-mono text-muted w-14 flex-shrink-0 tabular-nums">
                                    {formatTimestamp(e.timestamp, selectedParticipant.startedAt)}
                                  </span>
                                  <span className={`flex-1 font-medium ${isHigh ? "text-red-500" : "text-yellow-500"}`}>
                                    {t(`monitor.eventType.${e.eventType}`, { defaultValue: e.eventType })}
                                  </span>
                                  {isHigh && (
                                    <span className="text-red-500 text-xs flex-shrink-0">{t("monitor.high")}</span>
                                  )}
                                </li>
                              );
                            })
                        )}
                      </ul>
                    )}

                    {/* Warnings list */}
                    {detailTab === "warnings" && (
                      <ul className="flex flex-col divide-y divide-border max-h-52 overflow-y-auto">
                        {(selectedParticipant.warnings?.length ?? 0) === 0 ? (
                          <li className="px-3 py-4 text-xs text-muted text-center italic">{t("monitor.noWarnings")}</li>
                        ) : (
                          [...(selectedParticipant.warnings ?? [])]
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                            .map((w, i) => (
                              <li key={i} className="flex items-start gap-3 px-3 py-2.5 text-xs">
                                <span className="font-mono text-muted w-14 flex-shrink-0 tabular-nums mt-0.5">
                                  {formatTimestamp(w.timestamp, selectedParticipant.startedAt)}
                                </span>
                                <span className="flex-1 text-text leading-relaxed">{w.message ?? "—"}</span>
                              </li>
                            ))
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border p-4 bg-surface2">
                {selectedParticipant.isActive && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWarnTarget(selectedParticipant)}
                      className="flex-1 rounded border border-border bg-surface py-2 text-sm font-medium text-text hover:bg-border transition-colors"
                    >
                      {t("monitor.warnTitle")}
                    </button>
                    <button
                      onClick={() => setTerminateTarget(selectedParticipant)}
                      className="flex-1 rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                    >
                      {t("monitor.terminateTitle")}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/dashboard/quiz/${id}/replay/${selectedParticipant.id}`)}
                  className="w-full rounded border border-primary/50 bg-primary/10 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {t("monitor.replayBtn")}
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Warn Modal */}
      {warnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-text">
              {t("monitor.warnTitle")}: {getParticipantName(warnTarget)}
            </h3>
            <textarea
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              placeholder={t("monitor.warnPlaceholder")}
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary focus:outline-none min-h-[100px] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setWarnTarget(null); setWarnMessage(""); }}
                className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium text-text hover:bg-border transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleWarn}
                disabled={!warnMessage.trim()}
                className="flex-1 rounded-lg bg-yellow-500 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                {t("monitor.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-red-500">{t("monitor.terminateTitle")}</h3>
            <p className="mb-6 text-sm text-muted">
              <strong>{getParticipantName(terminateTarget)}</strong> {t("monitor.terminateConfirmSuffix")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTerminateTarget(null)}
                className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium text-text hover:bg-border transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleTerminate}
                disabled={isTerminating}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isTerminating ? t("common.loading") : t("monitor.confirmTerminate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
