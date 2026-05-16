// ==========================================================
// QuizQuestions – Quiz Soru Yönetimi
// ROUTE: /dashboard/quiz/:id/questions  (PrivateRoute: User + Admin)
// ==========================================================

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import {
  useQuiz,
  useQuestions,
  useDeleteQuestion,
} from "@/hooks/useQuizzes";
import { useLanguages } from "@/hooks/useExecute";
import { questionsApi, type CreateQuestionRequest } from "@/api/questions";
import { executeApi } from "@/api/execute";
import type { Question, McqChoice } from "@/api/types";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function QuizQuestions() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: quiz } = useQuiz(id!);
  const { data: questions, isLoading } = useQuestions(id!);
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion(id!);
  const { data: languages = [] } = useLanguages();

  const isReadOnly = !!quiz && (quiz.status !== "Draft" || quiz.participantCount > 0);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const [formData, setFormData] = useState<any>({});
  const [testCases, setTestCases] = useState<{ input: string; expectedOutput: string; isVisible: boolean }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // OutputPrediction local execution state
  const [opLanguage, setOpLanguage] = useState("python");
  const [opIsRunning, setOpIsRunning] = useState(false);
  const [opOutput, setOpOutput] = useState<{ stdout?: string; stderr?: string; status?: string } | null>(null);
  const opPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (opPollRef.current) clearTimeout(opPollRef.current); };
  }, []);

  const setOption = (key: string, value: unknown) => {
    setFormData((prev: any) => ({ ...prev, options: { ...(prev.options ?? {}), [key]: value } }));
  };

  const handleSelect = (q: Question) => {
    setSelectedQuestion(q);
    setFormData({ ...q });
    setTestCases(q.testCases?.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isVisible: tc.isVisible })) ?? []);
    setOpOutput(null);
    const lang = q.options?.codeLanguage as string | undefined;
    if (lang) setOpLanguage(lang);
  };

  const handleCreateNew = (type: string) => {
    setShowTypeModal(false);
    const newQ = { id: "", quizId: id!, type, title: t("question.newTitle"), body: "", points: 10, orderNo: (questions?.length || 0) + 1, options: {} };
    setSelectedQuestion(newQ as any);
    setFormData(newQ);
    setTestCases([]);
    setOpOutput(null);
  };

  const addTestCase = () => setTestCases([...testCases, { input: "", expectedOutput: "", isVisible: true }]);
  const removeTestCase = (i: number) => setTestCases(testCases.filter((_, idx) => idx !== i));
  const updateTestCase = (i: number, field: string, value: unknown) => {
    const next = [...testCases];
    next[i] = { ...next[i], [field]: value };
    setTestCases(next);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { id: _id, quizId: _qid, testCases: _tc, ...rest } = formData as any;
      const isCodingType = ["Coding", "BugFix"].includes(formData.type);

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
      // errors are visible via network
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteQuestion(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); if (selectedQuestion?.id === deleteTarget.id) setSelectedQuestion(null); } });
  };

  const runOutputPrediction = async () => {
    if (opIsRunning) return;
    if (opPollRef.current) clearTimeout(opPollRef.current);
    setOpIsRunning(true);
    setOpOutput(null);
    const selectedLang = languages.find((l) => l.id === opLanguage);
    // Persist codeLanguage in options so the grader knows which runner to use
    setOption("codeLanguage", opLanguage);
    try {
      const { jobId } = await executeApi.run({
        language: selectedLang?.monacoLanguage ?? opLanguage,
        code: formData.options?.codeBlock ?? "",
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

  const QUESTION_TYPES = [
    { type: "Coding",           label: t("question.coding") },
    { type: "MultipleChoice",   label: t("question.mcq") },
    { type: "OutputPrediction", label: t("question.outputPrediction") },
    { type: "BugFix",           label: t("question.bugFix") },
    { type: "ShortAnswer",      label: t("question.shortAnswer") },
  ];

  return (
    <DashboardLayout noPadding>
      <div className="flex h-full flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text">{t("question.management")}</h1>
            {isReadOnly && (
              <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                {quiz?.status !== "Draft" ? `${t("quiz.lockedActive")} (${quiz?.status})` : t("quiz.lockedParticipants")}
              </span>
            )}
          </div>
          <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-muted hover:text-text">
            {t("common.backToDashboard")}
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Question List — full-width on mobile when no question, fixed w-64 on md+ */}
          <div className={`flex flex-col border-r border-border bg-surface2 flex-shrink-0 ${selectedQuestion ? "hidden md:flex md:w-64" : "w-full md:w-64"}`}>
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="text-sm font-bold text-muted uppercase">{t("question.questionsHeader")} ({questions?.length || 0})</span>
              {!isReadOnly && (
                <button onClick={() => setShowTypeModal(true)} className="rounded bg-primary px-2 py-1 text-xs font-bold text-white hover:bg-primary-hover">+</button>
              )}
            </div>
            <ul className="flex-1 overflow-y-auto">
              {isLoading ? (
                <li className="p-4 text-center text-sm text-muted">{t("common.loading")}</li>
              ) : questions?.length === 0 ? (
                <li className="p-4 text-center text-sm text-muted">{t("question.noQuestions")}</li>
              ) : (
                questions?.map((q: Question, i: number) => (
                  <li key={q.id}>
                    <button
                      onClick={() => handleSelect(q)}
                      className={`flex w-full items-center justify-between border-b border-border/50 px-4 py-3 text-left transition-colors ${selectedQuestion?.id === q.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-surface border-l-4 border-l-transparent text-text'}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-bold text-muted">{i + 1}.</span>
                        <span className="truncate text-sm font-medium">{q.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted uppercase bg-surface px-1.5 py-0.5 rounded border border-border">{q.type.substring(0,4)}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Right Panel: Form — hidden on mobile when no question selected */}
          <div className={`bg-bg text-text ${selectedQuestion ? "flex-1 overflow-y-auto p-4 sm:p-6" : "hidden md:flex md:flex-col md:flex-1"}`}>
            {selectedQuestion ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
                {/* Back to list — mobile only */}
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors md:hidden"
                >
                  ← {t("common.back")}
                </button>
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-text">
                    {selectedQuestion.id ? (isReadOnly ? t("question.viewTitle") : t("question.editTitle")) : t("question.newTitle")}
                    <span className="text-sm font-normal text-muted ml-2">({formData.type})</span>
                  </h2>
                  {selectedQuestion.id && !isReadOnly && (
                    <button onClick={() => setDeleteTarget(selectedQuestion)} className="rounded bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/20">
                      {t("common.delete")}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">{t("question.titleLabel")}</label>
                    <input type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">{t("question.bodyLabel")}</label>
                    <textarea value={formData.body || ""} onChange={(e) => setFormData({ ...formData, body: e.target.value })} className="w-full min-h-[100px] rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">{t("question.pointsLabel")}</label>
                    <input type="number" value={formData.points || 10} onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })} className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  </div>

                  {/* Type-specific fields */}
                  <div className="mt-4">
                    {formData.type === 'Coding' && (
                      <div className="flex flex-col gap-4">
                        <div className="rounded-lg border border-border bg-surface2 p-4">
                          <h3 className="mb-3 text-sm font-bold text-text">{t("question.languages")}</h3>
                          <div className="flex flex-wrap gap-3">
                            {languages.map(lang => {
                              const saved = formData.options?.allowedLanguages as string[] | undefined;
                              // undefined/empty = all allowed (default)
                              const checked = !saved || saved.length === 0 || saved.includes(lang.id);
                              return (
                                <label key={lang.id} className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${
                                  checked ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-bg text-muted'
                                } ${isReadOnly ? 'opacity-60 cursor-default' : ''}`}>
                                  <input
                                    type="checkbox"
                                    className="rounded border-border text-primary focus:ring-primary"
                                    checked={checked}
                                    disabled={isReadOnly}
                                    onChange={() => {
                                      const current: string[] = saved && saved.length > 0
                                        ? [...saved]
                                        : languages.map(l => l.id);
                                      const next = checked
                                        ? current.filter(id => id !== lang.id)
                                        : [...current, lang.id];
                                      // If all languages are selected, store undefined (meaning "all")
                                      setOption("allowedLanguages", next.length === languages.length ? [] : next);
                                    }}
                                  />
                                  {lang.label}
                                </label>
                              );
                            })}
                          </div>
                          {(() => {
                            const saved = formData.options?.allowedLanguages as string[] | undefined;
                            const restricted = saved && saved.length > 0 && saved.length < languages.length;
                            return restricted ? (
                              <p className="mt-2 text-xs text-muted">
                                {t("question.languageRestriction", { count: saved!.length })}
                              </p>
                            ) : null;
                          })()}
                        </div>

                        <div className="rounded-lg border border-border bg-surface2 p-4">
                          <h3 className="mb-2 text-sm font-bold text-text">{t("question.starterCode")}</h3>
                          <div className="rounded border border-border overflow-hidden">
                            <Editor
                              height="160px"
                              language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? opLanguage}
                              value={formData.options?.starterCode ?? ""}
                              onChange={(v) => setOption("starterCode", v ?? "")}
                              theme="vs-dark"
                              options={{
                                minimap: { enabled: false },
                                fontSize: 12,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                readOnly: isReadOnly,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-surface2 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text">{t("question.testCases")}</h3>
                            {!isReadOnly && (
                              <button type="button" onClick={addTestCase} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addTestCase")}</button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {testCases.length === 0 ? (
                              <p className="text-xs text-muted italic py-2">{t("question.noTestCases")}</p>
                            ) : testCases.map((tc, i) => (
                              <div key={i} className="flex items-end gap-2 rounded border border-border bg-surface p-3">
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-medium text-muted">{t("question.input")}</label>
                                  <input
                                    type="text"
                                    value={tc.input}
                                    onChange={(e) => updateTestCase(i, "input", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-medium text-muted">{t("question.expectedOutput")}</label>
                                  <input
                                    type="text"
                                    value={tc.expectedOutput}
                                    onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="mb-1 block h-4 text-xs font-medium text-muted" />
                                  <label className="flex cursor-pointer items-center gap-1.5 rounded border border-border bg-bg px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={tc.isVisible}
                                      onChange={(e) => updateTestCase(i, "isVisible", e.target.checked)}
                                      disabled={isReadOnly}
                                      className="rounded border-border"
                                    />
                                    <span className="text-xs text-text">{t("question.visible")}</span>
                                  </label>
                                </div>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => removeTestCase(i)}
                                    className="rounded bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20"
                                    title={t("common.delete")}
                                  >✕</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'MultipleChoice' && (() => {
                      // Normalize legacy string[] → McqChoice[] on the fly
                      const rawChoices = formData.options?.choices;
                      const choices: McqChoice[] = Array.isArray(rawChoices)
                        ? rawChoices.map((c: unknown) =>
                            typeof c === "string"
                              ? { id: crypto.randomUUID(), text: c as string }
                              : (c as McqChoice)
                          )
                        : [];
                      const correctIds: string[] = (formData.options?.correctIds as string[] | undefined) ?? [];
                      const multiSelect: boolean = !!(formData.options?.multiSelect);

                      const setChoices = (next: McqChoice[]) => setOption("choices", next);
                      const setCorrectIds = (next: string[]) => setOption("correctIds", next);

                      const addChoice = () => {
                        if (!isReadOnly) setChoices([...choices, { id: crypto.randomUUID(), text: "" }]);
                      };
                      const removeChoice = (id: string) => {
                        if (isReadOnly) return;
                        setChoices(choices.filter((c) => c.id !== id));
                        setCorrectIds(correctIds.filter((cid) => cid !== id));
                      };
                      const updateChoice = (id: string, text: string) => {
                        setChoices(choices.map((c) => c.id === id ? { ...c, text } : c));
                      };
                      const toggleCorrect = (id: string) => {
                        if (isReadOnly) return;
                        if (multiSelect) {
                          setCorrectIds(correctIds.includes(id) ? correctIds.filter((c) => c !== id) : [...correctIds, id]);
                        } else {
                          setCorrectIds([id]);
                        }
                      };

                      return (
                        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text">{t("question.options")}</h3>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted">
                                <input
                                  type="checkbox"
                                  checked={multiSelect}
                                  onChange={(e) => {
                                    setOption("multiSelect", e.target.checked);
                                    if (!e.target.checked) setCorrectIds(correctIds.slice(0, 1));
                                  }}
                                  disabled={isReadOnly}
                                  className="rounded border-border text-primary focus:ring-primary"
                                />
                                {t("question.mcqMultiSelect")}
                              </label>
                              {!isReadOnly && (
                                <button type="button" onClick={addChoice} className="text-xs font-bold text-primary hover:text-primary-hover">
                                  {t("question.addOption")}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {choices.length === 0 ? (
                              <p className="text-xs text-muted italic py-1">{t("question.noChoicesYet")}</p>
                            ) : choices.map((choice) => {
                              const isCorrect = correctIds.includes(choice.id);
                              return (
                                <div key={choice.id} className={`flex items-center gap-2 rounded border p-2 ${isCorrect ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
                                  <button
                                    type="button"
                                    onClick={() => toggleCorrect(choice.id)}
                                    disabled={isReadOnly}
                                    title={t("question.markAsCorrect")}
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isCorrect ? "border-primary bg-primary text-white" : "border-border bg-bg text-muted hover:border-primary"
                                    } ${isReadOnly ? "cursor-default opacity-60" : "cursor-pointer"}`}
                                  >
                                    {isCorrect && "✓"}
                                  </button>
                                  <input
                                    type="text"
                                    value={choice.text}
                                    onChange={(e) => updateChoice(choice.id, e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder={`${t("question.optionLabel")} ${choices.indexOf(choice) + 1}`}
                                    className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm text-text focus:border-primary focus:outline-none disabled:opacity-60"
                                  />
                                  {!isReadOnly && (
                                    <button type="button" onClick={() => removeChoice(choice.id)} className="flex-shrink-0 text-muted hover:text-red-500 px-1 transition-colors">✕</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted">{t("question.mcqHint")}</p>
                        </div>
                      );
                    })()}

                    {formData.type === 'BugFix' && (
                      <div className="flex flex-col gap-4">
                        <div className="rounded-lg border border-border bg-surface2 p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-text">{t("question.buggyCode")}</h3>
                            <select
                              value={opLanguage}
                              onChange={(e) => { setOpLanguage(e.target.value); setOption("codeLanguage", e.target.value); }}
                              disabled={isReadOnly}
                              className="rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none text-text"
                            >
                              {languages.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                            </select>
                          </div>
                          <div className="rounded border border-border overflow-hidden">
                            <Editor
                              height="200px"
                              language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? opLanguage}
                              value={formData.options?.buggyCode ?? ""}
                              onChange={(v) => setOption("buggyCode", v ?? "")}
                              theme="vs-dark"
                              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, readOnly: isReadOnly }}
                            />
                          </div>
                        </div>

                        {/* Test cases are the only way to auto-grade BugFix (no correct-code field) */}
                        <div className="rounded-lg border border-border bg-surface2 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text">{t("question.testCases")}</h3>
                            {!isReadOnly && (
                              <button type="button" onClick={addTestCase} className="text-xs font-bold text-primary hover:text-primary-hover">{t("question.addTestCase")}</button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {testCases.length === 0 ? (
                              <p className="text-xs text-muted italic py-2">{t("question.noTestCases")}</p>
                            ) : testCases.map((tc, i) => (
                              <div key={i} className="flex items-end gap-2 rounded border border-border bg-surface p-3">
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-medium text-muted">{t("question.input")}</label>
                                  <input type="text" value={tc.input} onChange={(e) => updateTestCase(i, "input", e.target.value)} disabled={isReadOnly}
                                    className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60" />
                                </div>
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-medium text-muted">{t("question.expectedOutput")}</label>
                                  <input type="text" value={tc.expectedOutput} onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)} disabled={isReadOnly}
                                    className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-60" />
                                </div>
                                <label className="flex cursor-pointer items-center gap-1.5 rounded border border-border bg-bg px-2 py-1">
                                  <input type="checkbox" checked={tc.isVisible} onChange={(e) => updateTestCase(i, "isVisible", e.target.checked)} disabled={isReadOnly} className="rounded border-border" />
                                  <span className="text-xs text-text">{t("question.visible")}</span>
                                </label>
                                {!isReadOnly && (
                                  <button type="button" onClick={() => removeTestCase(i)} className="rounded bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20" title={t("common.delete")}>✕</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OutputPrediction: Monaco editor + run + use-output button */}
                    {formData.type === 'OutputPrediction' && (
                      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-text">{t("question.codeBlock")}</h3>
                            <div className="flex items-center gap-2">
                              <select
                                value={opLanguage}
                                onChange={(e) => setOpLanguage(e.target.value)}
                                className="rounded border border-border bg-bg px-2 py-1 text-xs focus:border-primary focus:outline-none text-text"
                                disabled={isReadOnly}
                              >
                                {languages.map((l) => (
                                  <option key={l.id} value={l.id}>{l.label}</option>
                                ))}
                              </select>
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={runOutputPrediction}
                                  disabled={opIsRunning || !formData.options?.codeBlock}
                                  className="px-3 py-1 rounded bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                >
                                  {opIsRunning ? t("home.running") : t("home.runBtn")}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="rounded border border-border overflow-hidden">
                            <Editor
                              height="200px"
                              language={languages.find((l) => l.id === opLanguage)?.monacoLanguage ?? opLanguage}
                              value={formData.options?.codeBlock ?? ""}
                              onChange={(v) => setOption("codeBlock", v ?? "")}
                              theme="vs-dark"
                              options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                automaticLayout: true,
                                readOnly: isReadOnly,
                              }}
                            />
                          </div>

                          {/* Execution output */}
                          {opOutput && (
                            <div className="mt-2 rounded border border-border bg-bg p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${opOutput.status === "Passed" ? "text-green-500" : "text-red-500"}`}>
                                  {opOutput.status}
                                </span>
                                {opOutput.stdout && (
                                  <button
                                    type="button"
                                    onClick={() => setOption("expectedOutput", opOutput.stdout)}
                                    className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 border border-green-500/20 transition-colors"
                                  >
                                    {t("question.useAsExpected")}
                                  </button>
                                )}
                              </div>
                              <pre className="text-xs font-mono whitespace-pre-wrap text-text max-h-24 overflow-auto">
                                {opOutput.stderr
                                  ? <span className="text-red-500">{opOutput.stderr}</span>
                                  : opOutput.stdout || <span className="text-muted italic">{t("question.noOutputYet")}</span>
                                }
                              </pre>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="mb-2 text-sm font-bold text-text">{t("question.expectedOutput")}</h3>
                          <textarea
                            value={formData.options?.expectedOutput ?? ""}
                            onChange={(e) => setOption("expectedOutput", e.target.value)}
                            disabled={isReadOnly}
                            rows={3}
                            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none disabled:opacity-60 resize-none"
                            placeholder={t("question.expectedOutputPlaceholder")}
                          />
                        </div>

                        <div>
                          <h3 className="mb-2 text-sm font-bold text-text">{t("question.matchMode")}</h3>
                          <select
                            value={formData.options?.matchMode ?? "trimmed"}
                            onChange={(e) => setOption("matchMode", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                          >
                            <option value="trimmed">{t("question.matchTrimmed")}</option>
                            <option value="ignoreWhitespace">{t("question.matchIgnoreWhitespace")}</option>
                            <option value="exact">{t("question.exact")}</option>
                          </select>
                          <p className="mt-1 text-xs text-muted">{t("question.opMatchModeHint")}</p>
                        </div>
                      </div>
                    )}

                    {/* ShortAnswer */}
                    {formData.type === 'ShortAnswer' && (() => {
                      const answers: string[] = Array.isArray(formData.options?.acceptedAnswers)
                        ? (formData.options!.acceptedAnswers as string[])
                        : typeof formData.options?.acceptedAnswers === "string" && (formData.options.acceptedAnswers as string).length > 0
                          ? (formData.options.acceptedAnswers as string).split(",").map((s: string) => s.trim()).filter(Boolean)
                          : [];

                      const setAnswers = (next: string[]) => setOption("acceptedAnswers", next);
                      const addAnswer = () => { if (!isReadOnly) setAnswers([...answers, ""]); };
                      const removeAnswer = (i: number) => { if (!isReadOnly) setAnswers(answers.filter((_, idx) => idx !== i)); };
                      const updateAnswer = (i: number, val: string) => {
                        const next = [...answers]; next[i] = val; setAnswers(next);
                      };

                      return (
                        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface2 p-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-sm font-bold text-text">{t("question.acceptedAnswers")}</h3>
                              {!isReadOnly && (
                                <button type="button" onClick={addAnswer} className="text-xs font-bold text-primary hover:text-primary-hover">
                                  {t("question.addAnswer")}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {answers.length === 0 ? (
                                <p className="text-xs text-muted italic py-1">{t("question.noAnswersYet")}</p>
                              ) : answers.map((answer, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => updateAnswer(i, e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder={`${t("question.answerLabel")} ${i + 1}`}
                                    className="flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                                  />
                                  {!isReadOnly && (
                                    <button type="button" onClick={() => removeAnswer(i)} className="text-muted hover:text-red-500 px-1 transition-colors">✕</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold text-text">{t("question.matchMode")}</h3>
                            <select
                              value={formData.options?.matchMode ?? "exactIgnoreCase"}
                              onChange={(e) => setOption("matchMode", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                            >
                              <option value="exactIgnoreCase">{t("question.exactIgnoreCase")}</option>
                              <option value="exact">{t("question.exact")}</option>
                              <option value="contains">{t("question.contains")}</option>
                            </select>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                  <button onClick={() => setSelectedQuestion(null)} className="rounded border border-border bg-surface2 px-4 py-2 text-sm font-medium hover:bg-border">
                    {isReadOnly ? t("common.close") : t("common.cancel")}
                  </button>
                  {!isReadOnly && (
                    <button onClick={handleSave} disabled={isSaving} className="rounded bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                      {isSaving ? t("common.saving") : t("common.save")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-muted">
                <p>{isReadOnly ? t("question.selectToView") : t("question.selectOrAdd")}</p>
                {!isReadOnly && (
                  <button onClick={() => setShowTypeModal(true)} className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                    {t("question.add")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-text">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-text">{t("question.typeSelect")}</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {QUESTION_TYPES.map(qt => (
                <button
                  key={qt.type}
                  onClick={() => handleCreateNew(qt.type)}
                  className="rounded border border-border bg-surface2 p-3 text-center text-sm font-medium hover:bg-border hover:text-primary transition-colors"
                >
                  {qt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTypeModal(false)} className="w-full rounded border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border">
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-text">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-text">{t("question.deleteQuestion")}</h3>
            <p className="mb-6 text-sm text-muted">{t("question.deleteQuestionConfirm")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border">{t("common.cancel")}</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
