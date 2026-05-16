// ==========================================================
// QuizSettings – Quiz Ayarları (Tabbed Interface)
// ROUTE: /dashboard/quiz/:id/settings  (PrivateRoute: User + Admin)
// ==========================================================

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import {
  useQuiz, useUpdateQuiz, usePublishQuiz,
  useQuestions, useDeleteQuestion,
} from "@/hooks/useQuizzes";
import { useLanguages } from "@/hooks/useExecute";
import { questionsApi, type CreateQuestionRequest } from "@/api/questions";
import { executeApi } from "@/api/execute";
import { toast } from "@/stores/toastStore";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import type { AntiCheatOptions, FormField, QuizMode, Question, McqChoice } from "@/api/types";

type Tab = "settings" | "questions" | "anticheat";

// ── TestCaseList sub-component ────────────────────────────────────────

function TestCaseList({
  testCases,
  isReadOnly,
  onUpdate,
  onRemove,
  t,
}: {
  testCases: { input: string; expectedOutput: string; isVisible: boolean }[];
  isReadOnly: boolean;
  onUpdate: (i: number, field: string, value: unknown) => void;
  onRemove: (i: number) => void;
  t: (key: string) => string;
}) {
  if (testCases.length === 0) {
    return <p className="text-xs text-muted italic py-2">{t("question.noTestCases")}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {testCases.map((tc, i) => (
        <div key={i} className="flex items-end gap-2 rounded border border-border bg-surface p-3">
          <div className="flex-1 min-w-0">
            <label className="mb-1 block text-xs font-medium text-muted">{t("question.input")}</label>
            <input type="text" value={tc.input} onChange={(e) => onUpdate(i, "input", e.target.value)} disabled={isReadOnly}
              className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="mb-1 block text-xs font-medium text-muted">{t("question.expectedOutput")}</label>
            <input type="text" value={tc.expectedOutput} onChange={(e) => onUpdate(i, "expectedOutput", e.target.value)} disabled={isReadOnly}
              className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60" />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer rounded border border-border bg-bg px-2 py-1 self-end">
            <input type="checkbox" checked={tc.isVisible} onChange={(e) => onUpdate(i, "isVisible", e.target.checked)} disabled={isReadOnly} className="rounded border-border" />
            <span className="text-xs text-text">{t("question.visible")}</span>
          </label>
          {!isReadOnly && (
            <button type="button" onClick={() => onRemove(i)} className="rounded bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20">✕</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function toUTCIso(datetimeLocal?: string): string | undefined {
  if (!datetimeLocal) return undefined;
  try { return new Date(datetimeLocal).toISOString(); } catch { return undefined; }
}

function quizParticipationUrl(token: string): string {
  return `${window.location.origin}/q/join/${token}`;
}

const STATUS_CLASSES: Record<string, string> = {
  Draft:     "bg-surface2 text-muted border-border",
  Published: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Active:    "bg-green-500/20 text-green-500 border-green-500/30",
  Ended:     "bg-red-500/20 text-red-400 border-red-500/30",
  Archived:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

// ── Component ────────────────────────────────────────────────────────

export default function QuizSettings() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Data hooks ──
  const queryClient = useQueryClient();
  const { data: quiz, isLoading } = useQuiz(id!);
  const { mutate: updateQuiz, isPending: saving } = useUpdateQuiz(id!);
  const { mutate: publishQuiz, isPending: publishing } = usePublishQuiz();
  const { data: questions } = useQuestions(id!);
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion(id!);
  const { data: languages = [] } = useLanguages();

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // ── Settings state ──
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [durationMinutes, setDuration]  = useState(60);
  const [mode, setMode]                 = useState<QuizMode>("RealTime");
  const [antiCheat, setAntiCheat]       = useState<AntiCheatOptions>({ tabSwitch: true, fullscreen: true, clipboard: false });
  const [formFields, setFormFields]     = useState<FormField[]>([]);
  const [accessCode, setAccessCode]     = useState("");
  const [startsAt, setStartsAt]         = useState("");
  const [endsAt, setEndsAt]             = useState("");
  const [linkCopied, setLinkCopied]     = useState(false);
  const [publishError, setPublishError]     = useState<string | null>(null);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Question state ──
  const [selectedQuestion, setSelectedQuestion]   = useState<Question | null>(null);
  const [showTypeModal, setShowTypeModal]         = useState(false);
  const [deleteQTarget, setDeleteQTarget]         = useState<Question | null>(null);
  const [qFormData, setQFormData]                 = useState<any>({});
  const [testCases, setTestCases]                 = useState<{ input: string; expectedOutput: string; isVisible: boolean }[]>([]);
  const [isSavingQuestion, setIsSavingQuestion]   = useState(false);
  const [opLanguage, setOpLanguage]               = useState("python");
  const [opIsRunning, setOpIsRunning]             = useState(false);
  const [opOutput, setOpOutput]                   = useState<{ stdout?: string; stderr?: string; status?: string } | null>(null);
  const opPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!quiz) return;
    setTitle(quiz.title || "");
    setDescription(quiz.description || "");
    setDuration(quiz.durationMinutes || 60);
    setMode(quiz.mode || "RealTime");
    setAntiCheat(quiz.antiCheatOptions || { tabSwitch: false, fullscreen: false, clipboard: false });
    setFormFields(quiz.formSchema || []);
    setAccessCode(quiz.accessCode || "");
    setStartsAt(formatDatetimeLocal(quiz.startsAt));
    setEndsAt(formatDatetimeLocal(quiz.endsAt));
  }, [quiz]);

  useEffect(() => {
    return () => { if (opPollRef.current) clearTimeout(opPollRef.current); };
  }, []);

  const hasParticipants  = (quiz?.participantCount ?? 0) > 0;
  const isStructureLocked = quiz?.status === "Active" || quiz?.status === "Ended" || hasParticipants;
  const canPublish        = quiz?.status === "Draft";
  const isTerminal        = quiz?.status === "Ended" || quiz?.status === "Archived";
  const isQReadOnly       = !!quiz && (quiz.status !== "Draft" || quiz.participantCount > 0);

  // ── Handlers: settings ──

  const handleSave = () => {
    if (!title.trim() || durationMinutes <= 0) {
      toast.error(t("quiz.validation.titleRequired") || "Title and duration are required.");
      return;
    }
    const startsAtIso = toUTCIso(startsAt);
    const endsAtIso   = toUTCIso(endsAt);

    if (startsAtIso && new Date(startsAtIso) < new Date()) {
      toast.error(t("quiz.validation.pastStartDate")); return;
    }
    if (startsAtIso && endsAtIso && new Date(endsAtIso) <= new Date(startsAtIso)) {
      toast.error(t("quiz.validation.endBeforeStart")); return;
    }
    if (endsAtIso && !startsAtIso && new Date(endsAtIso) <= new Date()) {
      toast.error(t("quiz.validation.pastEndDate")); return;
    }
    if (mode === "FreeStyle" && !endsAtIso && !isStructureLocked) {
      toast.error(t("quiz.validation.freestyleNeedsEnd")); return;
    }

    updateQuiz(
      {
        title,
        description,
        durationMinutes: isStructureLocked ? undefined : durationMinutes,
        mode:            isStructureLocked ? undefined : mode,
        antiCheatOptions: antiCheat,
        formSchema:       isStructureLocked ? undefined : formFields,
        accessCode,
        startsAt:        isStructureLocked ? undefined : startsAtIso,
        endsAt:          isStructureLocked ? undefined : endsAtIso,
        clearStartsAt:   !isStructureLocked && !startsAtIso,
        clearEndsAt:     !isStructureLocked && !endsAtIso,
      },
      {
        onSuccess: () => toast.success(t("quiz.savedSuccess")),
        onError: (err: any) => {
          const msg = err?.response?.data?.detail ?? err?.response?.data?.title ?? t("common.error");
          toast.error(msg);
        },
      }
    );
  };

  const handlePublish = () => {
    setPublishError(null);
    publishQuiz(id!, {
      onSuccess: () => setShowPublishedModal(true),
      onError: (err: any) => {
        const msg = err?.response?.data?.detail ?? err?.response?.data?.title ?? t("common.error");
        setPublishError(msg);
        toast.error(msg);
      },
    });
  };

  const handleCopyLink = () => {
    if (!quiz?.participationToken) return;
    navigator.clipboard.writeText(quizParticipationUrl(quiz.participationToken)).then(() => {
      setLinkCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // ── Handlers: form fields ──
  const addField = () =>
    setFormFields([...formFields, { key: `field_${Date.now()}`, label: "", type: "text", required: false }]);

  const updateField = (index: number, key: string, value: unknown) => {
    const next = [...formFields];
    next[index] = { ...next[index], [key]: value } as FormField;
    setFormFields(next);
  };

  const removeField = (index: number) =>
    setFormFields(formFields.filter((_, i) => i !== index));

  const toggleIdentityField = (index: number) =>
    setFormFields(formFields.map((f, i) => ({ ...f, isIdentity: i === index ? !f.isIdentity : false })));

  // ── Handlers: questions ──
  const QUESTION_TYPES = [
    { type: "Coding",           label: t("question.coding") },
    { type: "MultipleChoice",   label: t("question.mcq") },
    { type: "OutputPrediction", label: t("question.outputPrediction") },
    { type: "BugFix",           label: t("question.bugFix") },
    { type: "ShortAnswer",      label: t("question.shortAnswer") },
  ];

  const setQOption = (key: string, value: unknown) =>
    setQFormData((prev: any) => ({ ...prev, options: { ...(prev.options ?? {}), [key]: value } }));

  const handleSelectQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setQFormData({ ...q });
    setTestCases(q.testCases?.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isVisible: tc.isVisible })) ?? []);
    setOpOutput(null);
  };

  const runOutputPrediction = async () => {
    if (opIsRunning) return;
    if (opPollRef.current) clearTimeout(opPollRef.current);
    setOpIsRunning(true);
    setOpOutput(null);
    const selectedLang = languages.find((l) => l.id === opLanguage);
    setQOption("codeLanguage", opLanguage);
    try {
      const { jobId } = await executeApi.run({
        language: selectedLang?.monacoLanguage ?? opLanguage,
        code: qFormData.options?.codeBlock ?? "",
      });
      const poll = async () => {
        try {
          const result = await executeApi.getJobStatus(jobId);
          if (result.status === "Running" || result.status === "Pending") {
            opPollRef.current = setTimeout(poll, 1000);
          } else {
            setOpOutput({ stdout: result.stdout, stderr: result.stderr, status: result.status });
            setOpIsRunning(false);
          }
        } catch { setOpIsRunning(false); }
      };
      poll();
    } catch { setOpIsRunning(false); }
  };

  const handleCreateNew = (type: string) => {
    setShowTypeModal(false);
    const newQ = { id: "", quizId: id!, type, title: t("question.newTitle"), body: "", points: 10, orderNo: (questions?.length || 0) + 1, options: {} };
    setSelectedQuestion(newQ as any);
    setQFormData(newQ);
    setTestCases([]);
    setOpOutput(null);
  };

  const handleSaveQuestion = async () => {
    if (isSavingQuestion) return;
    setIsSavingQuestion(true);
    try {
      const { id: _id, quizId: _qid, testCases: _tc, ...rest } = qFormData as any;
      const isCodingType = ["Coding", "BugFix"].includes(qFormData.type);
      let savedId: string;

      if (selectedQuestion?.id) {
        await questionsApi.update(selectedQuestion.id, rest);
        savedId = selectedQuestion.id;
      } else {
        const created = await questionsApi.createInQuiz(id!, { ...rest, options: rest.options ?? {} } as CreateQuestionRequest);
        savedId = created.id;
      }

      if (isCodingType) {
        const oldTcs = selectedQuestion?.testCases ?? [];
        await Promise.all(oldTcs.map((tc) => questionsApi.deleteTestCase(savedId, tc.id.toString())));
        await Promise.all(testCases.map((tc) => questionsApi.createTestCase(savedId, tc)));
      }

      queryClient.invalidateQueries({ queryKey: ["questions", id] });
      queryClient.invalidateQueries({ queryKey: ["quiz", id] });
      setSelectedQuestion(null);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = () => {
    if (!deleteQTarget) return;
    deleteQuestion(deleteQTarget.id, {
      onSuccess: () => {
        setDeleteQTarget(null);
        if (selectedQuestion?.id === deleteQTarget.id) setSelectedQuestion(null);
      },
    });
  };

  const addTestCase    = () => setTestCases([...testCases, { input: "", expectedOutput: "", isVisible: true }]);
  const removeTestCase = (i: number) => setTestCases(testCases.filter((_, idx) => idx !== i));
  const updateTestCase = (i: number, field: string, value: unknown) => {
    const next = [...testCases]; next[i] = { ...next[i], [field]: value }; setTestCases(next);
  };

  // ── Render guards ──
  if (isLoading) return (
    <DashboardLayout noPadding>
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </DashboardLayout>
  );

  if (!quiz) return (
    <DashboardLayout noPadding>
      <div className="flex h-full items-center justify-center text-muted">{t("common.noData")}</div>
    </DashboardLayout>
  );

  // ── Tabs config ──
  const tabs: { id: Tab; label: string }[] = [
    { id: "settings",  label: t("quiz.tabSettings")  || "Settings" },
    { id: "questions", label: `${t("quiz.tabQuestions") || "Questions"} (${questions?.length ?? 0})` },
    { id: "anticheat", label: t("quiz.tabAntiCheat") || "Anti-Cheat" },
  ];

  return (
    <DashboardLayout noPadding>
      <div className="flex h-full flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-border bg-surface px-6 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-lg font-bold text-text truncate">{quiz.title || t("quiz.settings")}</h1>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border flex-shrink-0 ${STATUS_CLASSES[quiz.status] ?? STATUS_CLASSES.Draft}`}>
                {t(`quiz.status.${quiz.status.toLowerCase()}`, quiz.status)}
              </span>
              {isStructureLocked && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md border bg-orange-500/10 text-orange-400 border-orange-500/30 flex-shrink-0">
                  {hasParticipants ? t("quiz.lockedParticipants") : t("quiz.lockedActive")}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0 text-xs font-medium text-muted hover:text-text transition-colors"
            >
              {t("common.backToDashboard")}
            </button>
          </div>

          {quiz.participationToken && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted truncate flex-1 bg-bg border border-border rounded px-2 py-1 min-w-0">
                {quizParticipationUrl(quiz.participationToken)}
              </span>
              <button
                onClick={handleCopyLink}
                className={`flex-shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  linkCopied
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-surface2 text-text border-border hover:bg-border"
                }`}
              >
                {linkCopied ? t("quiz.linkCopied") : t("quiz.copyLink")}
              </button>
            </div>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div className="flex-shrink-0 flex border-b border-border bg-surface">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────────── */}
        <div className="flex-1 overflow-hidden">

          {/* Settings tab */}
          {activeTab === "settings" && (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-2xl px-6 py-6 flex flex-col gap-6">

                {/* Basic Info */}
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-text border-b border-border pb-2">{t("quiz.basicInfo")}</h2>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">
                        {t("quiz.title")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">{t("quiz.description")}</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none min-h-[80px]"
                      />
                    </div>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isStructureLocked ? "opacity-60" : ""}`}>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text">
                          {t("quiz.duration")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={durationMinutes}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          disabled={isStructureLocked}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text">{t("quiz.mode")}</label>
                        <select
                          value={mode}
                          onChange={(e) => setMode(e.target.value as QuizMode)}
                          disabled={isStructureLocked}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                        >
                          <option value="RealTime">{t("quiz.modeRealTime")}</option>
                          <option value="FreeStyle">{t("quiz.modeFreeStyle")}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">{t("quiz.accessCode")}</label>
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder={t("quiz.accessCodePlaceholder")}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className={`rounded-xl border border-border bg-surface p-6 shadow-sm ${isStructureLocked ? "opacity-60" : ""}`}>
                  <h2 className="mb-1 text-base font-bold text-text border-b border-border pb-2">{t("quiz.schedule")}</h2>
                  <p className="mb-4 text-xs text-muted">
                    {mode === "RealTime" ? t("quiz.scheduleHintRealTime") : t("quiz.scheduleHintFreeStyle")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">{t("quiz.startsAt")}</label>
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        disabled={isStructureLocked}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted">{t("quiz.startsAtHint")}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">
                        {t("quiz.endsAt")}
                        {mode === "FreeStyle" && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        disabled={isStructureLocked}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted">
                        {mode === "RealTime" ? t("quiz.endsAtHintRealTime") : t("quiz.endsAtHintFreeStyle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions tab */}
          {activeTab === "questions" && (
            <div className="flex h-full overflow-hidden">
              {/* Left: list — full-width on mobile when no question selected, fixed w-60 on md+ */}
              <div className={`border-r border-border flex flex-col overflow-hidden bg-surface flex-shrink-0 ${selectedQuestion ? "hidden md:flex md:w-60" : "w-full md:w-60"}`}>
                <div className="px-3 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
                  <span className="text-xs font-bold text-muted uppercase">
                    {t("question.questionsHeader")} ({questions?.length || 0})
                  </span>
                  {!isQReadOnly && (
                    <button
                      onClick={() => setShowTypeModal(true)}
                      className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white hover:bg-primary-hover"
                    >
                      +
                    </button>
                  )}
                </div>
                <ul className="flex-1 overflow-y-auto">
                  {questions?.length === 0 ? (
                    <li className="p-4 text-center text-sm text-muted">{t("question.noQuestions")}</li>
                  ) : (
                    questions?.map((q: Question, i: number) => (
                      <li key={q.id}>
                        <button
                          onClick={() => handleSelectQuestion(q)}
                          className={`flex w-full items-center justify-between border-b border-border/50 px-4 py-2.5 text-left transition-colors ${
                            selectedQuestion?.id === q.id
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "hover:bg-surface2 border-l-4 border-l-transparent text-text"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-bold text-muted">{i + 1}.</span>
                            <span className="truncate text-sm font-medium">{q.title}</span>
                          </div>
                          <span className="text-[10px] font-bold text-muted uppercase bg-surface px-1.5 py-0.5 rounded border border-border flex-shrink-0 ml-1">
                            {q.type.substring(0, 4)}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Right: editor — hidden on mobile when no question selected */}
              <div className={`overflow-y-auto bg-bg p-4 sm:p-6 ${selectedQuestion ? "flex-1" : "hidden md:flex md:flex-1"}`}>
                {selectedQuestion ? (
                  <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
                    {/* Back to list — mobile only */}
                    <button
                      onClick={() => setSelectedQuestion(null)}
                      className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors md:hidden"
                    >
                      ← {t("common.back")}
                    </button>
                    <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                      <h2 className="text-lg font-bold text-text">
                        {selectedQuestion.id
                          ? (isQReadOnly ? t("question.viewTitle") : t("question.editTitle"))
                          : t("question.newTitle")}
                        <span className="text-sm font-normal text-muted ml-2">({qFormData.type})</span>
                      </h2>
                      {selectedQuestion.id && !isQReadOnly && (
                        <button
                          onClick={() => setDeleteQTarget(selectedQuestion)}
                          className="rounded bg-red-500/10 px-3 py-1 text-sm font-medium text-red-500 hover:bg-red-500/20"
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text">{t("question.titleLabel")}</label>
                        <input
                          type="text"
                          value={qFormData.title || ""}
                          onChange={(e) => setQFormData({ ...qFormData, title: e.target.value })}
                          disabled={isQReadOnly}
                          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text">{t("question.bodyLabel")}</label>
                        <textarea
                          value={qFormData.body || ""}
                          onChange={(e) => setQFormData({ ...qFormData, body: e.target.value })}
                          disabled={isQReadOnly}
                          className="w-full min-h-[100px] rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text">{t("question.pointsLabel")}</label>
                        <input
                          type="number"
                          value={qFormData.points || 10}
                          onChange={(e) => setQFormData({ ...qFormData, points: Number(e.target.value) })}
                          disabled={isQReadOnly}
                          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                        />
                      </div>

                      {/* ── Coding ────────────────────────────────────────── */}
                      {qFormData.type === "Coding" && (
                        <div className="flex flex-col gap-4">
                          {/* Allowed languages */}
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <h3 className="mb-3 text-sm font-bold text-text">{t("question.languages")}</h3>
                            <div className="flex flex-wrap gap-2">
                              {languages.map((lang) => {
                                const saved = qFormData.options?.allowedLanguages as string[] | undefined;
                                const checked = !saved || saved.length === 0 || saved.includes(lang.id);
                                return (
                                  <label key={lang.id} className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${checked ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-bg text-muted"} ${isQReadOnly ? "opacity-60 cursor-default" : ""}`}>
                                    <input
                                      type="checkbox"
                                      className="rounded border-border text-primary focus:ring-primary"
                                      checked={checked}
                                      disabled={isQReadOnly}
                                      onChange={() => {
                                        const current: string[] = saved && saved.length > 0 ? [...saved] : languages.map((l) => l.id);
                                        const next = checked ? current.filter((lid) => lid !== lang.id) : [...current, lang.id];
                                        setQOption("allowedLanguages", next.length === languages.length ? [] : next);
                                      }}
                                    />
                                    {lang.label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          {/* Starter code */}
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <h3 className="mb-2 text-sm font-bold text-text">{t("question.starterCode")}</h3>
                            <div className="rounded border border-border overflow-hidden">
                              <Editor
                                height="140px"
                                language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? "python"}
                                value={qFormData.options?.starterCode ?? ""}
                                onChange={(v) => setQOption("starterCode", v ?? "")}
                                theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true, readOnly: isQReadOnly }}
                              />
                            </div>
                          </div>
                          {/* Test cases */}
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-sm font-bold text-text">{t("question.testCases")}</h3>
                              {!isQReadOnly && <button type="button" onClick={addTestCase} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addTestCase")}</button>}
                            </div>
                            <TestCaseList testCases={testCases} isReadOnly={isQReadOnly} onUpdate={updateTestCase} onRemove={removeTestCase} t={t} />
                          </div>
                        </div>
                      )}

                      {/* ── MultipleChoice ─────────────────────────────────── */}
                      {qFormData.type === "MultipleChoice" && (() => {
                        const rawChoices = qFormData.options?.choices;
                        const choices: McqChoice[] = Array.isArray(rawChoices)
                          ? rawChoices.map((c: unknown) =>
                              typeof c === "string" ? { id: crypto.randomUUID(), text: c as string } : (c as McqChoice)
                            )
                          : [];
                        const correctIds: string[] = (qFormData.options?.correctIds as string[] | undefined) ?? [];
                        const multiSelect: boolean = !!(qFormData.options?.multiSelect);

                        const setChoices = (next: McqChoice[]) => setQOption("choices", next);
                        const setCorrectIds = (next: string[]) => setQOption("correctIds", next);
                        const addChoice = () => { if (!isQReadOnly) setChoices([...choices, { id: crypto.randomUUID(), text: "" }]); };
                        const removeChoice = (cid: string) => { if (!isQReadOnly) { setChoices(choices.filter((c) => c.id !== cid)); setCorrectIds(correctIds.filter((x) => x !== cid)); } };
                        const updateChoice = (cid: string, text: string) => setChoices(choices.map((c) => c.id === cid ? { ...c, text } : c));
                        const toggleCorrect = (cid: string) => {
                          if (isQReadOnly) return;
                          setCorrectIds(multiSelect
                            ? (correctIds.includes(cid) ? correctIds.filter((x) => x !== cid) : [...correctIds, cid])
                            : [cid]);
                        };

                        return (
                          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-bold text-text">{t("question.options")}</h3>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted">
                                  <input type="checkbox" checked={multiSelect} onChange={(e) => { setQOption("multiSelect", e.target.checked); if (!e.target.checked) setCorrectIds(correctIds.slice(0, 1)); }} disabled={isQReadOnly} className="rounded border-border text-primary focus:ring-primary" />
                                  {t("question.mcqMultiSelect")}
                                </label>
                                {!isQReadOnly && <button type="button" onClick={addChoice} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addOption")}</button>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {choices.length === 0
                                ? <p className="text-xs text-muted italic py-1">{t("question.noChoicesYet")}</p>
                                : choices.map((choice) => {
                                  const isCorrect = correctIds.includes(choice.id);
                                  return (
                                    <div key={choice.id} className={`flex items-center gap-2 rounded border p-2 ${isCorrect ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
                                      <button type="button" onClick={() => toggleCorrect(choice.id)} disabled={isQReadOnly} title={t("question.markAsCorrect")}
                                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCorrect ? "border-primary bg-primary text-white" : "border-border bg-bg text-muted hover:border-primary"} ${isQReadOnly ? "cursor-default opacity-60" : "cursor-pointer"}`}>
                                        {isCorrect && "✓"}
                                      </button>
                                      <input type="text" value={choice.text} onChange={(e) => updateChoice(choice.id, e.target.value)} disabled={isQReadOnly}
                                        placeholder={`${t("question.optionLabel")} ${choices.indexOf(choice) + 1}`}
                                        className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm text-text focus:border-primary focus:outline-none disabled:opacity-60" />
                                      {!isQReadOnly && <button type="button" onClick={() => removeChoice(choice.id)} className="flex-shrink-0 text-muted hover:text-red-500 px-1 transition-colors">✕</button>}
                                    </div>
                                  );
                                })}
                            </div>
                            <p className="text-xs text-muted">{t("question.mcqHint")}</p>
                          </div>
                        );
                      })()}

                      {/* ── OutputPrediction ───────────────────────────────── */}
                      {qFormData.type === "OutputPrediction" && (
                        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-text">{t("question.codeBlock")}</h3>
                              <div className="flex items-center gap-2">
                                <select value={opLanguage} onChange={(e) => setOpLanguage(e.target.value)} disabled={isQReadOnly}
                                  className="rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none text-text">
                                  {languages.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                                </select>
                                {!isQReadOnly && (
                                  <button type="button" onClick={runOutputPrediction} disabled={opIsRunning || !qFormData.options?.codeBlock}
                                    className="px-3 py-1 rounded bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors">
                                    {opIsRunning ? t("home.running") : t("home.runBtn")}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="rounded border border-border overflow-hidden">
                              <Editor
                                height="200px"
                                language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? opLanguage}
                                value={qFormData.options?.codeBlock ?? ""}
                                onChange={(v) => setQOption("codeBlock", v ?? "")}
                                theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, wordWrap: "on", automaticLayout: true, readOnly: isQReadOnly }}
                              />
                            </div>
                            {opOutput && (
                              <div className="mt-2 rounded border border-border bg-bg p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-bold ${opOutput.status === "Passed" ? "text-green-500" : "text-red-500"}`}>{opOutput.status}</span>
                                  {opOutput.stdout && (
                                    <button type="button" onClick={() => setQOption("expectedOutput", opOutput.stdout)}
                                      className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 border border-green-500/20 transition-colors">
                                      {t("question.useAsExpected")}
                                    </button>
                                  )}
                                </div>
                                <pre className="text-xs font-mono whitespace-pre-wrap text-text max-h-24 overflow-auto">
                                  {opOutput.stderr ? <span className="text-red-500">{opOutput.stderr}</span> : opOutput.stdout || <span className="text-muted italic">{t("question.noOutputYet")}</span>}
                                </pre>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold text-text">{t("question.expectedOutput")}</h3>
                            <textarea value={qFormData.options?.expectedOutput ?? ""} onChange={(e) => setQOption("expectedOutput", e.target.value)} disabled={isQReadOnly}
                              rows={3} className="w-full rounded border border-border bg-bg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none disabled:opacity-60 resize-none"
                              placeholder={t("question.expectedOutputPlaceholder")} />
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold text-text">{t("question.matchMode")}</h3>
                            <select value={qFormData.options?.matchMode ?? "trimmed"} onChange={(e) => setQOption("matchMode", e.target.value)} disabled={isQReadOnly}
                              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60">
                              <option value="trimmed">{t("question.matchTrimmed")}</option>
                              <option value="ignoreWhitespace">{t("question.matchIgnoreWhitespace")}</option>
                              <option value="exact">{t("question.exact")}</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* ── BugFix ─────────────────────────────────────────── */}
                      {qFormData.type === "BugFix" && (
                        <div className="flex flex-col gap-4">
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-text">{t("question.buggyCode")}</h3>
                              <select value={opLanguage} onChange={(e) => setOpLanguage(e.target.value)} disabled={isQReadOnly}
                                className="rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none text-text">
                                {languages.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                              </select>
                            </div>
                            <div className="rounded border border-border overflow-hidden">
                              <Editor height="160px" language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? "python"}
                                value={qFormData.options?.buggyCode ?? ""} onChange={(v) => setQOption("buggyCode", v ?? "")} theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true, readOnly: isQReadOnly }} />
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <h3 className="mb-2 text-sm font-bold text-text">{t("question.correctCode")}</h3>
                            <div className="rounded border border-border overflow-hidden">
                              <Editor height="160px" language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? "python"}
                                value={qFormData.options?.correctCode ?? ""} onChange={(v) => setQOption("correctCode", v ?? "")} theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true, readOnly: isQReadOnly }} />
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-surface2 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-sm font-bold text-text">{t("question.testCases")}</h3>
                              {!isQReadOnly && <button type="button" onClick={addTestCase} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addTestCase")}</button>}
                            </div>
                            <TestCaseList testCases={testCases} isReadOnly={isQReadOnly} onUpdate={updateTestCase} onRemove={removeTestCase} t={t} />
                          </div>
                        </div>
                      )}

                      {/* ── ShortAnswer ─────────────────────────────────────── */}
                      {qFormData.type === "ShortAnswer" && (() => {
                        const answers: string[] = Array.isArray(qFormData.options?.acceptedAnswers)
                          ? (qFormData.options!.acceptedAnswers as string[])
                          : typeof qFormData.options?.acceptedAnswers === "string" && (qFormData.options.acceptedAnswers as string).length > 0
                            ? (qFormData.options.acceptedAnswers as string).split(",").map((s: string) => s.trim()).filter(Boolean)
                            : [];
                        const setAnswers = (next: string[]) => setQOption("acceptedAnswers", next);
                        const addAnswer = () => { if (!isQReadOnly) setAnswers([...answers, ""]); };
                        const removeAnswer = (i: number) => { if (!isQReadOnly) setAnswers(answers.filter((_, idx) => idx !== i)); };
                        const updateAnswer = (i: number, val: string) => { const next = [...answers]; next[i] = val; setAnswers(next); };
                        return (
                          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-text">{t("question.acceptedAnswers")}</h3>
                                {!isQReadOnly && <button type="button" onClick={addAnswer} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addAnswer")}</button>}
                              </div>
                              <div className="flex flex-col gap-2">
                                {answers.length === 0
                                  ? <p className="text-xs text-muted italic py-1">{t("question.noAnswersYet")}</p>
                                  : answers.map((answer, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input type="text" value={answer} onChange={(e) => updateAnswer(i, e.target.value)} disabled={isQReadOnly}
                                        placeholder={`${t("question.answerLabel")} ${i + 1}`}
                                        className="flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm focus:border-primary focus:outline-none disabled:opacity-60" />
                                      {!isQReadOnly && <button type="button" onClick={() => removeAnswer(i)} className="text-muted hover:text-red-500 px-1 transition-colors">✕</button>}
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="mb-2 text-sm font-bold text-text">{t("question.matchMode")}</h3>
                              <select value={qFormData.options?.matchMode ?? "exactIgnoreCase"} onChange={(e) => setQOption("matchMode", e.target.value)} disabled={isQReadOnly}
                                className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60">
                                <option value="exactIgnoreCase">{t("question.exactIgnoreCase")}</option>
                                <option value="exact">{t("question.exact")}</option>
                                <option value="contains">{t("question.contains")}</option>
                              </select>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                      <button
                        onClick={() => setSelectedQuestion(null)}
                        className="rounded border border-border bg-surface2 px-4 py-2 text-sm font-medium hover:bg-border"
                      >
                        {isQReadOnly ? t("common.close") : t("common.cancel")}
                      </button>
                      {!isQReadOnly && (
                        <button
                          onClick={handleSaveQuestion}
                          disabled={isSavingQuestion}
                          className="rounded bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          {isSavingQuestion ? t("common.saving") : t("common.save")}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted">
                    <p>{isQReadOnly ? t("question.selectToView") : t("question.selectOrAdd")}</p>
                    {!isQReadOnly && (
                      <button
                        onClick={() => setShowTypeModal(true)}
                        className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                      >
                        {t("question.add")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Anti-Cheat & Form tab */}
          {activeTab === "anticheat" && (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-2xl px-6 py-6 flex flex-col gap-6">

                {/* Anti-Cheat */}
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-text border-b border-border pb-2">{t("quiz.antiCheat")}</h2>
                  <div className="flex flex-col gap-3">
                    {(["tabSwitch", "fullscreen", "clipboard"] as const).map((key) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={antiCheat[key]}
                          onChange={(e) => setAntiCheat({ ...antiCheat, [key]: e.target.checked })}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-bg"
                        />
                        <span className="text-sm font-medium text-text">
                          {t(`quiz.antiCheat${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Participant Form Fields */}
                <div className={`rounded-xl border border-border bg-surface p-6 shadow-sm ${isStructureLocked ? "opacity-60" : ""}`}>
                  <h2 className="mb-4 text-base font-bold text-text border-b border-border pb-2">{t("quiz.participantFormInfo")}</h2>
                  {isStructureLocked && (
                    <p className="mb-3 text-xs text-orange-400 bg-orange-500/10 rounded px-3 py-2 border border-orange-500/20">
                      {t("quiz.formFieldsLocked")}
                    </p>
                  )}
                  <div className="flex flex-col gap-4">
                    {formFields.map((field, i) => (
                      <div key={i} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-3 bg-bg border border-border rounded-lg">
                        <div className="flex-1 min-w-[150px]">
                          <label className="mb-1 block text-xs font-medium text-muted">{t("common.fieldName")}</label>
                          <input
                            type="text" value={field.label}
                            onChange={(e) => updateField(i, "label", e.target.value)}
                            disabled={isStructureLocked}
                            className="w-full rounded bg-surface px-2 py-1.5 text-sm text-text border border-border focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="mb-1 block text-xs font-medium text-muted">{t("common.dataType")}</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(i, "type", e.target.value)}
                            disabled={isStructureLocked}
                            className="w-full rounded bg-surface px-2 py-1.5 text-sm text-text border border-border focus:outline-none disabled:cursor-not-allowed"
                          >
                            <option value="text">{t("common.text")}</option>
                            <option value="number">{t("common.number")}</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3 pb-1.5 flex-wrap">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox" checked={field.required}
                              onChange={(e) => updateField(i, "required", e.target.checked)}
                              disabled={isStructureLocked}
                              className="h-3.5 w-3.5 rounded border-border text-primary bg-surface disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-medium text-text">{t("common.requiredField")}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleIdentityField(i)}
                            disabled={isStructureLocked}
                            title={t("quiz.identityFieldHint")}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              field.isIdentity
                                ? "bg-primary/15 text-primary border-primary/40"
                                : "text-muted border-dashed border-border hover:text-text hover:border-text/40"
                            }`}
                          >
                            🔑 {t("quiz.identityFieldBadge")}
                          </button>
                        </div>
                        <button
                          type="button" onClick={() => removeField(i)}
                          disabled={isStructureLocked}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ✕
                        </button>
                        {field.isIdentity && (
                          <p className="w-full text-xs text-primary/70 italic">{t("quiz.identityFieldHint")}</p>
                        )}
                      </div>
                    ))}
                    {!isStructureLocked && (
                      <button
                        type="button" onClick={addField}
                        className="self-start rounded bg-surface2 px-3 py-1.5 text-xs font-medium text-text hover:bg-border transition-colors border border-dashed border-border hover:border-text"
                      >
                        {t("common.addField")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-border bg-surface px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {canPublish && (
                <>
                  <p className="text-xs text-muted hidden sm:block">{t("quiz.publishReqQuestions")}</p>
                  {publishError && (
                    <span className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">{publishError}</span>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {publishing ? t("quiz.publishing") : t("quiz.publishQuiz")}
                  </button>
                </>
              )}
              {!canPublish && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${STATUS_CLASSES[quiz.status] ?? ""}`}>
                    {t(`quiz.status.${quiz.status.toLowerCase()}`, quiz.status)}
                  </span>
                  {(quiz.status === "Active" || quiz.status === "Ended") && (
                    <button
                      onClick={() => navigate(`/dashboard/quiz/${id}/monitor`)}
                      className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      {t("quiz.monitorBtn")} →
                    </button>
                  )}
                </div>
              )}
            </div>

            {activeTab !== "questions" && (
              <button
                onClick={handleSave}
                disabled={saving || isTerminal}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {saving ? t("common.saving") : t("quiz.saveChanges")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Published Success Modal ── */}
      {showPublishedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-text">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-xl">✓</div>
              <h3 className="text-lg font-bold text-text">{t("quiz.publishedSuccess")}</h3>
            </div>
            <p className="text-sm text-muted">{t("quiz.publishedModalDesc")}</p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setShowPublishedModal(false)}
                className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border transition-colors"
              >
                {t("common.close")}
              </button>
              <button
                onClick={() => { setShowPublishedModal(false); navigate(`/dashboard/quiz/${id}/monitor`); }}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                {t("quiz.goToMonitor")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Type Modal ── */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-text">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-text">{t("question.typeSelect")}</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {QUESTION_TYPES.map(qt => (
                <button key={qt.type} onClick={() => handleCreateNew(qt.type)}
                  className="rounded border border-border bg-surface2 p-3 text-center text-sm font-medium hover:bg-border hover:text-primary transition-colors">
                  {qt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTypeModal(false)}
              className="w-full rounded border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border">
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Question Confirm ── */}
      {deleteQTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-text">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-text">{t("question.deleteQuestion")}</h3>
            <p className="mb-6 text-sm text-muted">{t("question.deleteQuestionConfirm")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteQTarget(null)}
                className="flex-1 rounded border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border">
                {t("common.cancel")}
              </button>
              <button onClick={handleDeleteQuestion} disabled={isDeleting}
                className="flex-1 rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
