// ==========================================================
// QuizTake – Sınav Alma Ekranı
// ROUTE: /q/:id/take  (public, sessionToken ile erişilir)
// ==========================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import * as signalR from "@microsoft/signalr";
import { useExamStore } from "@/stores/examStore";
import { useEditorStore } from "@/stores/editorStore";
import { usePreferencesStore, EDITOR_THEMES } from "@/stores/preferencesStore";
import { useThemeStore } from "@/stores/themeStore";
import { useI18nStore } from "@/stores/i18nStore";
import { useQuizInfo } from "@/hooks/useQuizzes";
import { useSubmit, useLogEvent, useFinishExam, useCodeSnapshot } from "@/hooks/useSessions";
import { useRunCode, useLanguages } from "@/hooks/useExecute";
import { submissionsApi } from "@/api/submissions";
import { sessionsApi, type SubmitRequest } from "@/api/sessions";
import { toast } from "@/stores/toastStore";
import TestCaseRunner from "@/components/exam/TestCaseRunner";
import type { ReplayDiffEntry, McqChoice } from "@/api/types";

const SESSION_HUB_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/api$/, "") + "/hubs/session";

// ---------- Draft answer saved when switching questions without submitting ----------

interface DraftAnswer {
  code?: string;
  language?: string;
  selectedChoiceIds?: string[];
  textAnswer?: string;
}

// ---------- Resizable Panel Hooks ----------

function useVerticalResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialPct: number,
  onEnd: (pct: number) => void,
  minPct = 20,
  maxPct = 80
) {
  const [pct, setPct] = useState(initialPct);
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startPct = useRef(initialPct);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current  = true;
      startX.current    = e.clientX;
      startPct.current  = pct;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const w     = containerRef.current.getBoundingClientRect().width;
        const delta = ((ev.clientX - startX.current) / w) * 100;
        const next  = Math.max(minPct, Math.min(maxPct, startPct.current + delta));
        setPct(next);
      };

      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setPct((cur) => { onEnd(cur); return cur; });
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [pct, containerRef, onEnd, minPct, maxPct]
  );

  return { pct, setPct, onMouseDown };
}

function useHorizontalResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialPct: number,
  onEnd: (pct: number) => void
) {
  const [pct, setPct] = useState(initialPct);
  const dragging  = useRef(false);
  const startY    = useRef(0);
  const startPct  = useRef(initialPct);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current   = e.clientY;
      startPct.current = pct;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const h     = containerRef.current.getBoundingClientRect().height;
        const delta = ((ev.clientY - startY.current) / h) * 100;
        const next  = Math.max(15, Math.min(85, startPct.current + delta));
        setPct(next);
      };

      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setPct((cur) => { onEnd(cur); return cur; });
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [pct, containerRef, onEnd]
  );

  return { pct, setPct, onMouseDown };
}

// ---------- Component ----------

export default function QuizTake() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { sessionToken, endsAt, isLocked, activeQuestionIndex, questions,
          setSession, setActiveQuestion, lock } = useExamStore();
  const { language, setLanguage, code, setCode, stdin, setStdin, output, isRunning } = useEditorStore();
  const prefs = usePreferencesStore();
  const { uiTheme, toggleTheme } = useThemeStore();
  const { locale, setLocale } = useI18nStore();

  const { data: quiz, isLoading } = useQuizInfo(id!);
  const { mutate: submit, isPending: isSubmitting } = useSubmit(id!);
  const { mutate: logEvent } = useLogEvent(id!);
  const { run } = useRunCode();
  const { data: languages = [] } = useLanguages();

  // Derived from current question — must be declared BEFORE any useEffect that
  // references availableLanguages, because the minifier assigns these a short name
  // (e.g. `$`) and early-return paths would leave that binding in TDZ otherwise.
  const question           = questions[activeQuestionIndex];
  const isCodingQuestion   = question?.type === "Coding" || question?.type === "BugFix";
  // BugFix questions are locked to the language the quiz author wrote the buggy code in
  const allowedLangIds     = question?.type === "Coding"
    ? (question.options?.allowedLanguages as string[] | undefined)
    : question?.type === "BugFix" && question.options?.codeLanguage
      ? [question.options.codeLanguage as string]
      : undefined;
  const availableLanguages = allowedLangIds && allowedLangIds.length > 0
    ? languages.filter((l) => allowedLangIds.includes(l.id))
    : languages;
  const isLastQuestion     = activeQuestionIndex === questions.length - 1;
  const hasTestCases       = isCodingQuestion && (question?.testCases?.length ?? 0) > 0;

  // Shuffle MCQ choices once per question. Choices may be McqChoice[] (new) or string[] (legacy).
  // Using useMemo with question.id ensures a stable shuffle per question within a session.
  const shuffledMcqChoices = useMemo<McqChoice[]>(() => {
    if (!question || question.type !== "MultipleChoice") return [];
    const raw = question.options?.choices;
    const choices: McqChoice[] = Array.isArray(raw)
      ? raw.map((c, i) =>
          typeof c === "string" ? { id: String(i), text: c } : (c as McqChoice)
        )
      : [];
    // Fisher-Yates shuffle (new array, not in place)
    const arr = [...choices];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const [timeLeft, setTimeLeft]         = useState<string>("");
  const [showEditorPrefs, setShowEditorPrefs] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer]               = useState("");
  const [finishResult, setFinishResult] = useState<null | { totalScore: number; maxScore: number; submittedQuestions: number }>(null);
  const [warnMessage, setWarnMessage]       = useState<string | null>(null);
  const [wasRefreshed, setWasRefreshed]     = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  // Draft answers: saved on every question switch, submitted all on exam finish
  const [draftAnswers, setDraftAnswers] = useState<Record<string, DraftAnswer>>({});
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<Set<string>>(new Set());

  const { mutate: finishExam, isPending: isFinishing } = useFinishExam(id!);
  const { mutate: sendSnapshot } = useCodeSnapshot(id!);
  const hubRef           = useRef<signalR.HubConnection | null>(null);
  const examFinishedRef  = useRef(false);
  // Replay buffer: captures code snapshots for replay diff persistence
  const replayBufferRef = useRef<ReplayDiffEntry[]>([]);
  const replayStartRef  = useRef<number>(Date.now());

  const stdinOnLeft = prefs.layout.stdinSlot !== "right";

  // Refs for resizable panels
  const questionWrapRef = useRef<HTMLDivElement>(null); // wrapper: [desc | handle | content]
  const containerRef    = useRef<HTMLDivElement>(null); // wrapper for editor left/right split
  const leftPanelRef    = useRef<HTMLDivElement>(null);
  const rightPanelRef   = useRef<HTMLDivElement>(null);
  const rightTopRef     = useRef<HTMLDivElement>(null); // output + TC container (when TC present)

  const horizPanelRef = stdinOnLeft ? leftPanelRef : rightPanelRef;

  // Description panel resize (min 12%, max 55%)
  const { pct: descWidth, onMouseDown: onDescDrag } = useVerticalResize(
    questionWrapRef,
    28,
    () => {}, // not persisted globally
    12,
    55
  );

  const { pct: leftWidth, setPct: setLeftWidth, onMouseDown: onVertDrag } = useVerticalResize(
    containerRef,
    prefs.layout.leftWidth,
    (w) => prefs.setLayout({ leftWidth: w })
  );

  const { pct: splitPct, setPct: setSplitPct, onMouseDown: onHorizDrag } = useHorizontalResize(
    horizPanelRef,
    prefs.layout.rightTopHeight,
    (h) => prefs.setLayout({ rightTopHeight: h })
  );

  const { pct: outputPct, setPct: setOutputPct, onMouseDown: onOutputTcDrag } = useHorizontalResize(
    rightTopRef,
    prefs.layout.outputTopHeight,
    (h) => prefs.setLayout({ outputTopHeight: h })
  );

  // Sync panel sizes when preferences rehydrate from localStorage
  useEffect(() => { setLeftWidth(prefs.layout.leftWidth); }, [prefs.layout.leftWidth, setLeftWidth]);
  useEffect(() => { setSplitPct(prefs.layout.rightTopHeight); }, [prefs.layout.rightTopHeight, setSplitPct]);
  useEffect(() => { setOutputPct(prefs.layout.outputTopHeight); }, [prefs.layout.outputTopHeight, setOutputPct]);

  // Restore session from localStorage if store is empty after page refresh
  useEffect(() => {
    if (sessionToken) return;
    const token = localStorage.getItem(`codexam_session_${id}`);
    if (!token) { navigate(`/q/${id}`); return; }

    const raw = localStorage.getItem(`codexam_full_session_${id}`);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setSession({
          sessionToken: saved.sessionToken,
          sessionId:    saved.sessionId,
          quizId:       saved.quizId,
          endsAt:       saved.endsAt,
          questions:    saved.questions ?? [],
        });
        return;
      } catch { /* fall through — redirect */ }
    }
    navigate(`/q/${id}`);
  }, [id, sessionToken, setSession, navigate]);

  // Detect page refresh via sessionStorage flag (set by beforeunload below)
  useEffect(() => {
    if (!id) return;
    const flag = sessionStorage.getItem(`codexam_refresh_${id}`);
    if (flag) {
      sessionStorage.removeItem(`codexam_refresh_${id}`);
      setWasRefreshed(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock exam if refresh was detected once session is restored; also lock server-side
  useEffect(() => {
    if (!wasRefreshed || !sessionToken || !id) return;
    sessionsApi.selfLock(id).finally(() => lock());
  }, [wasRefreshed, sessionToken, id, lock]);

  // beforeunload: warn user and set refresh flag so we can detect it on reload
  useEffect(() => {
    if (!sessionToken) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examFinishedRef.current) return;
      e.preventDefault();
      sessionStorage.setItem(`codexam_refresh_${id}`, "1");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sessionToken, id]);

  // Participant hub — receive warnings and termination from monitor
  useEffect(() => {
    if (!sessionToken) return;
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(SESSION_HUB_URL)
      .withAutomaticReconnect()
      .build();
    hubRef.current = hub;
    hub.on("Warning", (data: { message: string }) => {
      setWarnMessage(data.message);
    });
    hub.on("Terminated", () => {
      lock();
    });
    hub.start()
      .then(() => hub.invoke("JoinSession", sessionToken))
      .catch(() => {});
    return () => { hub.stop(); };
  }, [sessionToken, lock]);

  // Auto-dismiss warning after 8s
  useEffect(() => {
    if (!warnMessage) return;
    const t = setTimeout(() => setWarnMessage(null), 8000);
    return () => clearTimeout(t);
  }, [warnMessage]);

  // Anti-cheat monitoring
  useEffect(() => {
    if (!quiz) return;
    const ac = quiz.antiCheatOptions;

    if (ac?.fullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }

    // Deduplicate TabSwitch: blur + visibilitychange can both fire for the same event
    let lastTabSwitchMs = 0;
    const fireTabSwitch = () => {
      if (!ac?.tabSwitch) return;
      const now = Date.now();
      if (now - lastTabSwitchMs > 500) {
        lastTabSwitchMs = now;
        logEvent({ eventType: "TabSwitch" });
      }
    };

    // visibilitychange catches Ctrl+Tab (browser tab switch, minimize)
    const onVisibility = () => { if (document.hidden) fireTabSwitch(); };
    // window blur catches Alt+Tab (app switch, including from fullscreen exit)
    const onBlur       = () => fireTabSwitch();
    const onFullscreen = () => { if (!document.fullscreenElement && ac?.fullscreen) logEvent({ eventType: "FullscreenExit" }); };
    const onCopy  = () => { if (ac?.clipboard) logEvent({ eventType: "ClipboardAttempt", metadata: { action: "copy" } }); };
    const onCut   = () => { if (ac?.clipboard) logEvent({ eventType: "ClipboardAttempt", metadata: { action: "cut" } }); };
    const onPaste = () => { if (ac?.clipboard) logEvent({ eventType: "ClipboardAttempt", metadata: { action: "paste" } }); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy",  onCopy);
    document.addEventListener("cut",   onCut);
    document.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy",  onCopy);
      document.removeEventListener("cut",   onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [quiz, logEvent]);

  // Countdown timer
  useEffect(() => {
    if (!endsAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(endsAt).getTime() - Date.now();
      if (remaining <= 0) {
        lock();
        setTimeLeft("00:00");
        clearInterval(interval);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, lock]);

  // When available languages change (e.g. switching to a question with restrictions),
  // auto-select the first allowed language if the current one isn't in the list
  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.find((l) => l.id === language)) {
      const first = availableLanguages[0];
      setLanguage(first.id, first.defaultCode);
    }
  }, [activeQuestionIndex, languages, language, setLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss submit feedback
  useEffect(() => {
    if (!submitStatus) return;
    const t = setTimeout(() => setSubmitStatus(null), 3000);
    return () => clearTimeout(t);
  }, [submitStatus]);

  // Exit fullscreen automatically when exam ends (finish or lock)
  useEffect(() => {
    if ((isLocked || finishResult) && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [isLocked, finishResult]);

  // On question change: reset status + replay buffer, then restore draft or reset state
  useEffect(() => {
    setSubmitStatus(null);
    replayBufferRef.current = [];
    replayStartRef.current  = Date.now();

    if (!question) return;

    // Check for a saved draft (answer typed but not submitted)
    const draft = draftAnswers[question.id];
    if (draft) {
      if (draft.selectedChoiceIds !== undefined) setSelectedChoiceIds(draft.selectedChoiceIds);
      if (draft.textAnswer !== undefined) setTextAnswer(draft.textAnswer);
      if (draft.code !== undefined) setCode(draft.code);
      if (draft.language !== undefined) {
        const lang = languages.find((l) => l.id === draft.language);
        setLanguage(draft.language, lang?.defaultCode);
      }
    } else {
      // Fresh question — reset answer state
      setSelectedChoiceIds([]);
      setTextAnswer("");
      // BugFix: pre-fill code editor with the buggy code the quiz author provided
      if (question.type === "BugFix") {
        const buggyCode = question.options?.buggyCode as string | undefined;
        const bugLang   = question.options?.codeLanguage as string | undefined;
        if (buggyCode) setCode(buggyCode);
        if (bugLang) {
          const lang = languages.find((l) => l.id === bugLang);
          setLanguage(bugLang, lang?.defaultCode);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionIndex]);

  // Toast on execution complete
  const prevOutputRef = useRef<typeof output>(undefined as any);
  useEffect(() => {
    if (prevOutputRef.current === undefined) { prevOutputRef.current = output; return; }
    prevOutputRef.current = output;
    if (!output?.status || output.status === "Running" || output.status === "Pending") return;
    const label = t(`exec.status.${output.status}`, output.status);
    if (output.status === "Passed") toast.success(label);
    else toast.error(label);
  }, [output]); // eslint-disable-line react-hooks/exhaustive-deps

  // Replay diff capture — record code every 15s into buffer (persisted on submit)
  useEffect(() => {
    const q = questions[activeQuestionIndex];
    const isCoding = q?.type === "Coding" || q?.type === "BugFix";
    if (!sessionToken || !q || !isCoding || !code.trim()) return;
    const push = () => {
      replayBufferRef.current.push({ timeMs: Date.now() - replayStartRef.current, diff: code });
    };
    push(); // capture immediately on change
    const interval = setInterval(push, 15000);
    return () => clearInterval(interval);
  }, [code, activeQuestionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Code auto-sync to server for live monitoring
  useEffect(() => {
    const q = questions[activeQuestionIndex];
    const isCoding = q?.type === "Coding" || q?.type === "BugFix";
    if (!sessionToken || !q || !isCoding) return;
    const selectedLang = languages.find((l) => l.id === language);
    sendSnapshot({
      code,
      language: selectedLang?.monacoLanguage ?? language,
      questionIndex: activeQuestionIndex,
    });
    const interval = setInterval(() => {
      sendSnapshot({
        code,
        language: selectedLang?.monacoLanguage ?? language,
        questionIndex: activeQuestionIndex,
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [code, activeQuestionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text">{t("exam.loading")}</div>;
  }

  if (!quiz) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text">{t("exam.notFound")}</div>;
  }

  if (isLocked) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg p-4 text-text text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{t("exam.locked")}</h1>
        <p className="text-muted">
          {wasRefreshed ? t("exam.lockedByRefresh") : t("exam.lockedMessage")}
        </p>
        <button onClick={() => navigate("/")} className="mt-6 rounded bg-surface2 px-4 py-2 hover:bg-border transition-colors">
          {t("exam.backToHome")}
        </button>
      </div>
    );
  }

  if (finishResult) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg p-4 text-text text-center gap-6">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-500 mb-2">{t("exam.finished")}</h1>
          <p className="text-muted text-sm mb-6">{t("exam.finishedMessage")}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-surface border border-border p-3 text-center">
              <div className="text-xs text-muted mb-1">{t("results.score")}</div>
              <div className="text-2xl font-bold text-text">{finishResult.totalScore} / {finishResult.maxScore}</div>
            </div>
            <div className="rounded-lg bg-surface border border-border p-3 text-center">
              <div className="text-xs text-muted mb-1">{t("results.completed")}</div>
              <div className="text-2xl font-bold text-text">{finishResult.submittedQuestions}</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t("exam.backToHome")}
          </button>
        </div>
      </div>
    );
  }

  const monacoTheme    = prefs.editorTheme;
  const monacoLanguage = languages.find((l) => l.id === language)?.monacoLanguage ?? language;

  // ── Helpers ────────────────────────────────────────────────

  const handleRun = () => {
    const selectedLang = languages.find((l) => l.id === language);
    const monacoLang   = selectedLang?.monacoLanguage ?? language;
    run({ language: monacoLang, code, stdin: stdin || undefined });
  };

  const handleLanguageChange = (langId: string) => {
    const selected = languages.find((l) => l.id === langId);
    setLanguage(langId, selected?.defaultCode);
  };

  // Save current answer to the draft map (called before switching questions)
  const saveDraft = () => {
    if (!question) return;
    if (question.type === "Coding" || question.type === "BugFix") {
      setDraftAnswers((prev) => ({ ...prev, [question.id]: { code, language } }));
    } else if (question.type === "MultipleChoice") {
      setDraftAnswers((prev) => ({ ...prev, [question.id]: { selectedChoiceIds: [...selectedChoiceIds] } }));
    } else {
      setDraftAnswers((prev) => ({ ...prev, [question.id]: { textAnswer } }));
    }
  };

  // Switch questions via the sidebar (saves draft first)
  const switchQuestion = (index: number) => {
    saveDraft();
    setActiveQuestion(index);
  };

  // Build submit payload for a question from its saved draft
  const buildDraftPayload = (q: typeof question, draft: DraftAnswer): SubmitRequest => {
    if (q.type === "Coding" || q.type === "BugFix") {
      return { questionId: q.id, language: draft.language, code: draft.code };
    }
    if (q.type === "MultipleChoice") {
      return { questionId: q.id, selectedChoiceIds: draft.selectedChoiceIds };
    }
    return { questionId: q.id, textAnswer: draft.textAnswer };
  };

  // Submit all unsaved drafts and (optionally) the current question's live state.
  // Returns after all submissions are attempted (errors are swallowed per question).
  const submitAllPending = async (
    extraDrafts: Record<string, DraftAnswer> = {}
  ) => {
    const merged = { ...draftAnswers, ...extraDrafts };
    for (const [qId, draft] of Object.entries(merged)) {
      if (submittedQuestionIds.has(qId)) continue;
      const q = questions.find((qq) => qq.id === qId);
      if (!q) continue;
      try {
        await sessionsApi.submit(id!, buildDraftPayload(q, draft));
      } catch { /* ignore individual question errors — exam must still finish */ }
    }
  };

  // ── Coding submit (auto-advance on success) ────────────────

  const handleSubmit = () => {
    const diffs    = [...replayBufferRef.current];
    const snapCode = code;
    const snapLang = language;
    const snapQId  = question.id;
    submit(
      { questionId: snapQId, language: snapLang, code: snapCode },
      {
        onSuccess: (result) => {
          setSubmitStatus("success");
          setSubmittedQuestionIds((prev) => new Set([...prev, snapQId]));
          replayBufferRef.current = [];
          if (diffs.length > 0 && result?.submissionId) {
            submissionsApi.appendReplayDiff(result.submissionId, diffs).catch(() => {});
          }
          // Preserve submitted code so navigating back shows what was submitted
          setDraftAnswers((prev) => ({ ...prev, [snapQId]: { code: snapCode, language: snapLang } }));
          // Auto-advance (brief delay so success feedback is visible)
          if (activeQuestionIndex < questions.length - 1) {
            setTimeout(() => setActiveQuestion(activeQuestionIndex + 1), 400);
          }
        },
        onError: () => setSubmitStatus("error"),
      }
    );
  };

  // ── Non-coding submit (auto-advance on success) ────────────

  const handleNonCodingSubmit = () => {
    if (!question || isSubmitting) return;
    const snapQId = question.id;
    const payload: SubmitRequest = { questionId: snapQId };
    let snapDraft: DraftAnswer = {};
    if (question.type === "MultipleChoice") {
      payload.selectedChoiceIds = selectedChoiceIds;
      snapDraft = { selectedChoiceIds: [...selectedChoiceIds] };
    } else {
      payload.textAnswer = textAnswer;
      snapDraft = { textAnswer };
    }
    submit(payload, {
      onSuccess: () => {
        setSubmitStatus("success");
        setSubmittedQuestionIds((prev) => new Set([...prev, snapQId]));
        // Preserve submitted answer so navigating back shows what was submitted
        setDraftAnswers((prev) => ({ ...prev, [snapQId]: snapDraft }));
        if (activeQuestionIndex < questions.length - 1) {
          setTimeout(() => setActiveQuestion(activeQuestionIndex + 1), 400);
        }
      },
      onError: () => setSubmitStatus("error"),
    });
  };

  // ── Last question: Complete and Submit Exam ────────────────

  const handleCompleteAndSubmitExam = async () => {
    if (isSubmittingAll || isFinishing) return;
    setIsSubmittingAll(true);
    examFinishedRef.current = true;

    // Include the current question's live state as a draft (if not yet submitted)
    const currentDraft: DraftAnswer = isCodingQuestion
      ? { code, language }
      : question?.type === "MultipleChoice"
        ? { selectedChoiceIds: [...selectedChoiceIds] }
        : { textAnswer };

    const extraDrafts = submittedQuestionIds.has(question?.id)
      ? {}
      : { [question.id]: currentDraft };

    // Persist replay for current question if it's a coding question
    if (isCodingQuestion && !submittedQuestionIds.has(question.id)) {
      const diffs = [...replayBufferRef.current];
      try {
        const result = await sessionsApi.submit(id!, { questionId: question.id, language, code });
        setSubmittedQuestionIds((prev) => new Set([...prev, question.id]));
        replayBufferRef.current = [];
        if (diffs.length > 0 && result?.submissionId) {
          submissionsApi.appendReplayDiff(result.submissionId, diffs).catch(() => {});
        }
        // Remove from extra drafts since we just submitted it directly
        delete extraDrafts[question.id];
      } catch { /* submit will still go through submitAllPending below */ }
    }

    await submitAllPending(extraDrafts);
    setIsSubmittingAll(false);

    finishExam(undefined, {
      onSuccess: (result) => {
        setFinishResult({
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          submittedQuestions: result.submittedQuestions,
        });
        localStorage.setItem(`codexam_completed_${id}`, "1");
        localStorage.removeItem(`codexam_session_${id}`);
        localStorage.removeItem(`codexam_full_session_${id}`);
      },
      onError: () => { examFinishedRef.current = false; },
    });
  };

  // ── Emergency Finish (header button) ──────────────────────

  const handleConfirmedFinish = async () => {
    if (isSubmittingAll || isFinishing) return;
    setIsSubmittingAll(true);
    examFinishedRef.current = true;

    // Add current question's live answer to extras (in case it hasn't been submitted/drafted)
    const currentDraft: DraftAnswer = isCodingQuestion
      ? { code, language }
      : question?.type === "MultipleChoice"
        ? { selectedChoiceIds: [...selectedChoiceIds] }
        : { textAnswer };

    const extraDrafts = question && !submittedQuestionIds.has(question.id)
      ? { [question.id]: currentDraft }
      : {};

    await submitAllPending(extraDrafts);
    setIsSubmittingAll(false);

    finishExam(undefined, {
      onSuccess: (result) => {
        setShowFinishConfirm(false);
        setFinishResult({
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          submittedQuestions: result.submittedQuestions,
        });
        localStorage.setItem(`codexam_completed_${id}`, "1");
        localStorage.removeItem(`codexam_session_${id}`);
        localStorage.removeItem(`codexam_full_session_${id}`);
      },
      onError: () => setShowFinishConfirm(false),
    });
  };

  const toggleStdinSlot = () => {
    prefs.setLayout({ stdinSlot: stdinOnLeft ? "right" : "left" });
  };

  const timeIsLow = timeLeft.startsWith("0") && parseInt(timeLeft.split(":")[0]) < 5;

  const isAnySubmitPending = isSubmitting || isSubmittingAll || isFinishing;

  // ── Shared sub-panels ──────────────────────────────────────

  const stdinPanel = (pct?: number) => (
    <div
      style={pct != null ? { height: `${pct}%` } : { flex: 1 }}
      className="flex flex-col overflow-hidden"
    >
      <div className="px-3 py-1.5 border-b border-border/50 bg-surface flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-warning uppercase">{t("exam.stdinLabel")}</span>
          <span className="text-xs text-muted">{t("exam.stdinHint")}</span>
        </div>
        <button
          onClick={toggleStdinSlot}
          className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-xs text-muted hover:text-text transition-colors"
          title={stdinOnLeft ? t("home.moveStdinRight") : t("home.moveStdinLeft")}
        >
          {stdinOnLeft ? "⇥" : "⇤"}
        </button>
      </div>
      <textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder={t("exam.stdinPlaceholder")}
        className="flex-1 resize-none bg-bg px-3 py-2 font-mono text-xs text-text focus:outline-none"
        spellCheck={false}
      />
    </div>
  );

  const outputPanel = (pct?: number) => (
    <div
      style={pct != null ? { height: `${pct}%` } : { flex: 1 }}
      className="flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-surface flex-shrink-0">
        <span className="text-xs font-bold uppercase text-muted">Output</span>
        {output && (
          <span className={`text-xs font-bold ${
            output.status === "Passed" ? "text-success"
              : output.status === "TLE" ? "text-warning"
              : "text-danger"
          }`}>
            {t(`exec.status.${output.status}`, output.status)}
            {output.timeMs != null && (
              <span className="ml-2 font-normal text-muted">{output.timeMs}ms</span>
            )}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {output ? (
          <pre className="px-3 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed text-text">
            {output.stderr
              ? <span className="text-danger">{output.stderr}</span>
              : output.stdout || <span className="text-muted italic">{t("exam.noOutput")}</span>
            }
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                {t("exam.running")}
              </span>
            ) : t("home.clickRun")}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-bg text-text overflow-hidden">
      {/* Warning toast from monitor */}
      {warnMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 shadow-lg flex items-start gap-3">
          <span className="text-yellow-400 text-lg flex-shrink-0">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-yellow-400">{t("exam.warningFromMonitor")}</p>
            <p className="text-sm text-text mt-0.5 break-words">{warnMessage}</p>
          </div>
          <button onClick={() => setWarnMessage(null)} className="text-muted hover:text-text flex-shrink-0">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 flex-shrink-0 gap-2">
        <div className="font-bold text-primary truncate max-w-[180px] flex-shrink-0">{quiz.title}</div>
        <div className="text-sm font-medium text-muted flex-shrink-0 hidden sm:block">
          {t("exam.questionLabel")}: {activeQuestionIndex + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* UI theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface2 border border-border text-sm hover:bg-border transition-colors"
            title={t("exam.uiTheme")}
          >
            {uiTheme === "dark" ? "☀" : "🌙"}
          </button>
          {/* App language switcher */}
          <button
            onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
            className="px-2 h-7 rounded bg-surface2 border border-border text-xs font-medium text-muted hover:text-text hover:bg-border transition-colors"
            title={t("exam.switchLanguage")}
          >
            {locale === "tr" ? "EN" : "TR"}
          </button>
          <div className={`text-sm font-bold tabular-nums ${timeIsLow ? "text-red-500" : "text-text"}`}>
            ⏱ {timeLeft}
          </div>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors"
          >
            {t("exam.finish")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Question List */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-surface2 overflow-y-auto hidden md:flex flex-col">
          <div className="px-3 py-2 text-xs font-bold text-muted uppercase tracking-wider border-b border-border flex-shrink-0">
            {t("exam.questions")}
          </div>
          <ul className="flex flex-col flex-1">
            {questions.map((q, i) => (
              <li key={q.id}>
                <button
                  onClick={() => switchQuestion(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-b border-border/50 ${
                    activeQuestionIndex === i
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-l-primary"
                      : "text-text hover:bg-surface border-l-2 border-l-transparent"
                  }`}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 border ${
                    submittedQuestionIds.has(q.id)
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-bg border-border"
                  }`}>
                    {submittedQuestionIds.has(q.id) ? "✓" : i + 1}
                  </span>
                  <span className="truncate text-xs">{q.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {question ? (
            // Outer wrapper — used by the description-panel resize hook
            <div ref={questionWrapRef} className="flex flex-1 overflow-hidden">

              {/* ── Question Description panel (resizable) ─── */}
              <div
                style={{ width: `${descWidth}%` }}
                className="flex-shrink-0 border-r border-border overflow-y-auto p-5 hidden lg:block"
              >
                <h2 className="text-xl font-bold mb-3">{question.title}</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted text-sm leading-relaxed">
                  {question.body}
                </div>
                {question.points != null && (
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {question.points} {t("question.points")}
                  </div>
                )}
              </div>

              {/* Description resize handle (desktop only) */}
              <div
                className="w-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors select-none hidden lg:block"
                onMouseDown={onDescDrag}
              />

              {/* ── Editor / Answer area ──────────────────────── */}
              {isCodingQuestion ? (
                <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                  {/* Toolbar */}
                  <div className="flex h-12 items-center gap-2 justify-between bg-surface px-3 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-surface2 border border-border rounded px-2 py-1 text-xs focus:outline-none text-text"
                      >
                        {availableLanguages.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => prefs.setFontSize(prefs.fontSize - 1)}
                          className="w-6 h-6 rounded bg-surface2 border border-border text-xs font-bold text-muted hover:text-text flex items-center justify-center"
                          title={t("exam.decreaseFontSize")}
                        >−</button>
                        <span className="text-xs text-muted w-6 text-center">{prefs.fontSize}</span>
                        <button
                          onClick={() => prefs.setFontSize(prefs.fontSize + 1)}
                          className="w-6 h-6 rounded bg-surface2 border border-border text-xs font-bold text-muted hover:text-text flex items-center justify-center"
                          title={t("exam.increaseFontSize")}
                        >+</button>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setShowEditorPrefs((v) => !v)}
                          className="px-2 py-1 rounded bg-surface2 border border-border text-xs text-muted hover:text-text"
                          title={t("exam.editorTheme")}
                        >🎨</button>
                        {showEditorPrefs && (
                          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                            {EDITOR_THEMES.map((th) => (
                              <button
                                key={th.id}
                                onClick={() => { prefs.setEditorTheme(th.id); setShowEditorPrefs(false); }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface2 transition-colors ${
                                  prefs.editorTheme === th.id ? "text-primary font-semibold" : "text-text"
                                }`}
                              >{th.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {submitStatus === "success" && (
                        <span className="text-xs text-green-500 font-medium">{t("exam.submitSuccess")}</span>
                      )}
                      {submitStatus === "error" && (
                        <span className="text-xs text-red-500 font-medium">{t("exam.submitError")}</span>
                      )}
                      <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="px-3 py-1 bg-surface2 hover:bg-border border border-border rounded text-xs transition-colors disabled:opacity-50 text-text"
                      >
                        {isRunning ? t("exam.running") : t("exam.runBtn")}
                      </button>
                      <button
                        onClick={isLastQuestion ? handleCompleteAndSubmitExam : handleSubmit}
                        disabled={isAnySubmitPending}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          isLastQuestion
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-primary hover:bg-primary-hover text-white"
                        }`}
                      >
                        {isAnySubmitPending
                          ? t("exam.submitting")
                          : isLastQuestion
                            ? t("exam.completeAndSubmit")
                            : t("common.submit")}
                      </button>
                    </div>
                  </div>

                  {/* Resizable panels area */}
                  <div ref={containerRef} className="flex flex-1 overflow-hidden">

                    {/* ── Left panel ── */}
                    <div
                      ref={leftPanelRef}
                      style={{ width: `${leftWidth}%` }}
                      className="flex flex-col overflow-hidden min-w-0"
                    >
                      {/* Editor fills entire left panel height, or top portion if stdin is here */}
                      <div style={{ height: stdinOnLeft ? `${splitPct}%` : "100%" }} className="overflow-hidden min-h-0 flex-shrink-0">
                        <Editor
                          height="100%"
                          language={monacoLanguage}
                          value={code}
                          onChange={(v) => setCode(v || "")}
                          theme={monacoTheme}
                          options={{
                            minimap:              { enabled: false },
                            fontSize:             prefs.fontSize,
                            scrollBeyondLastLine: false,
                            wordWrap:             "on",
                            automaticLayout:      true,
                          }}
                        />
                      </div>

                      {/* Stdin below editor (stdinSlot="left") */}
                      {stdinOnLeft && (
                        <>
                          <div
                            className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                            onMouseDown={onHorizDrag}
                          />
                          {stdinPanel(100 - splitPct)}
                        </>
                      )}
                    </div>

                    {/* Vertical resize handle */}
                    <div
                      className="w-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors select-none"
                      onMouseDown={onVertDrag}
                    />

                    {/* ── Right panel ── */}
                    <div
                      ref={rightPanelRef}
                      style={{ width: `${100 - leftWidth}%` }}
                      className="flex flex-col overflow-hidden min-w-0"
                    >
                      {stdinOnLeft ? (
                        /* Right panel: output (+ TC if applicable), fills full height */
                        <div ref={rightTopRef} className="flex flex-col flex-1 overflow-hidden min-h-0">
                          {hasTestCases ? (
                            <>
                              {outputPanel(outputPct)}
                              <div
                                className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                                onMouseDown={onOutputTcDrag}
                              />
                              <div style={{ height: `${100 - outputPct}%` }} className="flex flex-col overflow-hidden flex-shrink-0">
                                <TestCaseRunner
                                  testCases={question?.testCases ?? []}

                                  code={code}
                                  language={monacoLanguage}
                                  disabled={isLocked}
                                />
                              </div>
                            </>
                          ) : (
                            outputPanel()
                          )}
                        </div>
                      ) : (
                        /* Right panel: output (+ TC) + resize + stdin */
                        <>
                          <div ref={rightTopRef} style={{ height: `${splitPct}%` }} className="flex flex-col overflow-hidden flex-shrink-0 min-h-0">
                            {hasTestCases ? (
                              <>
                                {outputPanel(outputPct)}
                                <div
                                  className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                                  onMouseDown={onOutputTcDrag}
                                />
                                <div style={{ height: `${100 - outputPct}%` }} className="flex flex-col overflow-hidden flex-shrink-0">
                                  <TestCaseRunner
                                    testCases={question?.testCases ?? []}
  
                                    code={code}
                                    language={monacoLanguage}
                                    disabled={isLocked}
                                  />
                                </div>
                              </>
                            ) : (
                              outputPanel()
                            )}
                          </div>
                          <div
                            className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                            onMouseDown={onHorizDrag}
                          />
                          {stdinPanel(100 - splitPct)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-coding question answer area */
                <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                  {/* Mobile: question title + body (desktop shows it in the description panel) */}
                  <div className="lg:hidden border-b border-border px-5 py-4 max-h-52 overflow-y-auto flex-shrink-0">
                    <h2 className="text-lg font-bold mb-1">{question.title}</h2>
                    <p className="text-sm text-muted">{question.body}</p>
                  </div>

                  {/* Answer UI */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-2xl p-6 flex flex-col gap-5">

                      {/* Submit feedback */}
                      {submitStatus === "success" && (
                        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-500 font-medium">
                          {t("exam.submitSuccess")}
                        </div>
                      )}
                      {submitStatus === "error" && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-500 font-medium">
                          {t("exam.submitError")}
                        </div>
                      )}

                      {/* Multiple Choice */}
                      {question.type === "MultipleChoice" && (() => {
                        const isMulti = !!(question.options?.multiSelect);
                        return (
                          <div>
                            <p className="mb-3 text-xs font-bold text-muted uppercase tracking-wide">
                              {isMulti ? t("exam.multiSelectHint") : t("exam.selectChoice")}
                            </p>
                            <div className="flex flex-col gap-2">
                              {shuffledMcqChoices.map((choice) => {
                                const checked = selectedChoiceIds.includes(choice.id);
                                return (
                                  <label
                                    key={choice.id}
                                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                                      checked
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-surface hover:bg-surface2"
                                    } ${(isLocked || submitStatus === "success") ? "pointer-events-none opacity-70" : ""}`}
                                  >
                                    <input
                                      type={isMulti ? "checkbox" : "radio"}
                                      name="mcq-choice"
                                      checked={checked}
                                      disabled={isLocked || submitStatus === "success"}
                                      onChange={() => {
                                        if (isMulti) {
                                          setSelectedChoiceIds((prev) =>
                                            checked ? prev.filter((id) => id !== choice.id) : [...prev, choice.id]
                                          );
                                        } else {
                                          setSelectedChoiceIds([choice.id]);
                                        }
                                      }}
                                      className="text-primary focus:ring-primary flex-shrink-0"
                                    />
                                    <span className="text-sm text-text">{choice.text}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Output Prediction */}
                      {question.type === "OutputPrediction" && (
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="mb-2 text-xs font-bold text-muted uppercase tracking-wide">
                              {t("exam.codeToPredict")}
                            </p>
                            <div className="rounded-lg border border-border overflow-hidden">
                              <Editor
                                height="220px"
                                language={(question.options?.codeLanguage as string | undefined) ?? "javascript"}
                                value={(question.options?.codeBlock as string) ?? ""}
                                theme={monacoTheme}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 13,
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-bold text-muted uppercase tracking-wide">
                              {t("exam.yourAnswer")}
                            </label>
                            <textarea
                              value={textAnswer}
                              onChange={(e) => setTextAnswer(e.target.value)}
                              disabled={isLocked || submitStatus === "success"}
                              placeholder={t("exam.answerPlaceholder")}
                              className="w-full min-h-[80px] resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono text-text focus:border-primary focus:outline-none disabled:opacity-60"
                            />
                          </div>
                        </div>
                      )}

                      {/* Short Answer */}
                      {question.type === "ShortAnswer" && (
                        <div>
                          <label className="mb-2 block text-xs font-bold text-muted uppercase tracking-wide">
                            {t("exam.yourAnswer")}
                          </label>
                          <input
                            type="text"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            disabled={isLocked || submitStatus === "success"}
                            placeholder={t("exam.answerPlaceholder")}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:opacity-60"
                          />
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={isLastQuestion ? handleCompleteAndSubmitExam : handleNonCodingSubmit}
                          disabled={isAnySubmitPending || isLocked || submitStatus === "success"}
                          className={`rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50 transition-colors ${
                            isLastQuestion
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-primary hover:bg-primary-hover text-white"
                          }`}
                        >
                          {isAnySubmitPending
                            ? t("exam.submitting")
                            : isLastQuestion
                              ? t("exam.completeAndSubmit")
                              : t("exam.submitAnswer")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted">{t("exam.noQuestion")}</div>
          )}
        </div>
      </div>

      {/* Click-outside to close theme picker */}
      {showEditorPrefs && (
        <div className="fixed inset-0 z-10" onClick={() => setShowEditorPrefs(false)} />
      )}

      {/* Finish Confirm Dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-text mb-2">{t("exam.finishTitle")}</h2>
            <p className="text-sm text-muted mb-6">{t("exam.finishConfirmMessage")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                disabled={isAnySubmitPending}
                className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium text-text hover:bg-border transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmedFinish}
                disabled={isAnySubmitPending}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isAnySubmitPending ? t("exam.submitting") : t("exam.finish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
