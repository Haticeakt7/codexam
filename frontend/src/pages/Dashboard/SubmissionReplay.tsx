// ==========================================================
// SubmissionReplay – Submission Replay Oynatıcı
// ROUTE: /dashboard/quiz/:id/replay/:sessionId  (PrivateRoute: User + Admin)
// ==========================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import { useReplay } from "@/hooks/useSessions";
import { useThemeStore } from "@/stores/themeStore";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import type { ReplayDiffEntry } from "@/api/types";

const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 25, 50, 100, 250];

export default function SubmissionReplay() {
  const { t } = useTranslation();
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const { uiTheme } = useThemeStore();
  const { data, isLoading } = useReplay(sessionId!);

  // Multi-question selector
  const questions = data?.questions ?? [];
  const hasMultipleQuestions = questions.length > 1;
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

  // Active diffs: prefer per-question entries if available, fall back to legacy top-level diffs
  const activeDiffs: ReplayDiffEntry[] =
    questions.length > 0
      ? (questions[selectedQuestionIdx]?.diffs ?? [])
      : (data?.diffs ?? []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [customSpeed, setCustomSpeed] = useState("1");
  const [currentCode, setCurrentCode] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const isPlayingRef = useRef(false);

  const diffsRef = useRef<ReplayDiffEntry[]>([]);
  diffsRef.current = activeDiffs;
  isPlayingRef.current = isPlaying;

  const applyDiff = useCallback((targetIndex: number) => {
    const d = diffsRef.current;
    if (d.length > 0 && targetIndex >= 0 && targetIndex < d.length) {
      setCurrentCode(d[targetIndex].diff || "");
    } else if (targetIndex < 0) {
      setCurrentCode("");
    }
  }, []);

  const handleSeek = useCallback((index: number) => {
    const d = diffsRef.current;
    if (d.length === 0) return;
    const clamped = Math.max(0, Math.min(d.length - 1, index));
    setCurrentIndex(clamped);
    applyDiff(clamped);
  }, [applyDiff]);

  const handleSeekRef = useRef(handleSeek);
  handleSeekRef.current = handleSeek;

  const getIndexFromClientX = useCallback((clientX: number) => {
    if (!progressBarRef.current || diffsRef.current.length === 0) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(percent * (diffsRef.current.length - 1));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleSeekRef.current(getIndexFromClientX(e.clientX));
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (wasPlayingRef.current) setIsPlaying(true);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [getIndexFromClientX]);

  const onProgressMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    wasPlayingRef.current = isPlayingRef.current;
    setIsPlaying(false);
    handleSeek(getIndexFromClientX(e.clientX));
  };

  // Reset playback when active diffs change (question switch or initial load)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (activeDiffs.length > 0) {
      setCurrentCode(activeDiffs[0].diff || "");
    } else {
      setCurrentCode("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionIdx, data]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= diffsRef.current.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        applyDiff(next);
        return next;
      });
    }, Math.max(4, 1000 / speed));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, applyDiff]);

  const handlePlayPause = () => {
    if (currentIndex >= activeDiffs.length - 1 && !isPlaying) {
      setCurrentIndex(0);
      applyDiff(0);
    }
    setIsPlaying((v) => !v);
  };

  const applyCustomSpeed = () => {
    const val = parseFloat(customSpeed);
    if (!isNaN(val) && val > 0) setSpeed(Math.min(500, Math.max(0.1, val)));
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentDiff = activeDiffs[currentIndex];
  const maxTime = activeDiffs.length > 0 ? activeDiffs[activeDiffs.length - 1].timeMs : 0;
  const currentTime = currentDiff ? currentDiff.timeMs : 0;
  const progress = activeDiffs.length > 1 ? (currentIndex / (activeDiffs.length - 1)) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const hasAnyDiffs = questions.length > 0 ? questions.some((q) => q.diffs.length > 0) : (data?.diffs?.length ?? 0) > 0;

  if (!data || !hasAnyDiffs) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl p-6 text-center">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text">{t("replay.notFound")}</h1>
            <button onClick={() => navigate(`/dashboard/quiz/${id}/results`)} className="text-sm font-medium text-muted hover:text-text transition-colors">
              {t("common.backToDashboard")}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-surface p-12 text-muted">
            {t("replay.notFoundDesc")}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">{t("replay.title")}</h1>
          <button onClick={() => navigate(`/dashboard/quiz/${id}/results`)} className="text-sm font-medium text-muted hover:text-text transition-colors">
            {t("common.backToDashboard")}
          </button>
        </div>

        {/* Question selector tabs — only shown when quiz has multiple coding/bugfix questions */}
        {hasMultipleQuestions && (
          <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1 flex-shrink-0">
            {questions.map((q, idx) => (
              <button
                key={q.questionId}
                onClick={() => setSelectedQuestionIdx(idx)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedQuestionIdx === idx
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text hover:bg-surface2"
                }`}
              >
                <span className="text-xs opacity-75">{q.orderNo}.</span>
                <span>{q.questionTitle}</span>
                <span className={`ml-0.5 text-xs rounded px-1 py-0.5 ${
                  selectedQuestionIdx === idx ? "bg-white/20" : "bg-border text-muted"
                }`}>
                  {q.questionType}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Empty state for selected question with no diffs */}
          {activeDiffs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              {t("replay.noReplayForQuestion")}
            </div>
          ) : (
            <>
              {/* Editor */}
              <div className="flex-1 relative min-h-0">
                <Editor
                  language="javascript"
                  value={currentCode}
                  theme={uiTheme === "dark" ? "vs-dark" : "vs"}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
                />
              </div>

              {/* Controls Panel */}
              <div className="border-t border-border bg-surface2 p-4 flex flex-col gap-3 flex-shrink-0">

                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  className="relative h-3 bg-border rounded-full cursor-pointer select-none group"
                  onMouseDown={onProgressMouseDown}
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-primary shadow group-hover:scale-110 transition-transform"
                    style={{ left: `${progress}%` }}
                  />
                </div>

                {/* Row 1: Transport controls + Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSeek(0)}
                      className="rounded p-2 text-muted hover:bg-surface hover:text-text transition-colors"
                      title={t("replay.toStart")}
                    >⏮</button>
                    <button
                      onClick={() => handleSeek(currentIndex - 1)}
                      className="rounded p-2 text-muted hover:bg-surface hover:text-text transition-colors"
                      title={t("replay.stepBack")}
                    >⏪</button>
                    <button
                      onClick={handlePlayPause}
                      className="rounded-lg bg-primary px-4 py-2 font-bold text-white hover:bg-primary-hover transition-colors shadow-sm text-base w-12 flex items-center justify-center"
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={() => handleSeek(currentIndex + 1)}
                      className="rounded p-2 text-muted hover:bg-surface hover:text-text transition-colors"
                      title={t("replay.stepForward")}
                    >⏩</button>
                    <button
                      onClick={() => handleSeek(activeDiffs.length - 1)}
                      className="rounded p-2 text-muted hover:bg-surface hover:text-text transition-colors"
                      title={t("replay.toEnd")}
                    >⏭</button>
                  </div>

                  <div className="text-sm font-mono text-muted tabular-nums text-right">
                    {formatTime(currentTime)} / {formatTime(maxTime)}
                    <span className="ml-2 text-xs text-muted/70 hidden sm:inline">
                      {currentIndex + 1} / {activeDiffs.length}
                    </span>
                  </div>
                </div>

                {/* Row 2: Speed presets (scrollable) + custom speed */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  <div className="flex items-center gap-1 rounded border border-border bg-surface p-1 flex-shrink-0">
                    {SPEED_PRESETS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSpeed(s); setCustomSpeed(String(s)); }}
                        className={`rounded px-2 py-1 text-xs font-bold transition-colors whitespace-nowrap ${speed === s ? "bg-primary/20 text-primary" : "text-muted hover:text-text"}`}
                      >
                        {s < 1 ? s : `${s}`}x
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="number"
                      min="0.1"
                      max="500"
                      step="0.1"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyCustomSpeed()}
                      className="w-16 rounded border border-border bg-bg px-2 py-1 text-xs text-center text-text focus:border-primary focus:outline-none"
                      title={t("replay.customSpeed")}
                    />
                    <button
                      onClick={applyCustomSpeed}
                      className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted hover:text-text transition-colors"
                    >x</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
