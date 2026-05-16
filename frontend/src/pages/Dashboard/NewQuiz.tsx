// ==========================================================
// NewQuiz – Yeni Quiz Oluştur
// ROUTE: /dashboard/new  (PrivateRoute: User + Admin)
// Creates the quiz in Draft state, then redirects to settings
// where the full editor lives.
// ==========================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCreateQuiz } from "@/hooks/useQuizzes";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import type { Quiz } from "@/api/types";

export default function NewQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createQuiz, isPending } = useCreateQuiz();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode]             = useState<"RealTime" | "FreeStyle">("RealTime");
  const [durationMinutes, setDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createQuiz(
      {
        title,
        description,
        durationMinutes,
        mode,
        antiCheatOptions: { tabSwitch: true, fullscreen: true, clipboard: false },
        formSchema: [{ key: "name", label: "Name", type: "text", required: true }],
      },
      {
        onSuccess: (quiz: Quiz) =>
          navigate(`/dashboard/quiz/${quiz.id}/settings`),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">{t("quiz.create")}</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-medium text-muted hover:text-text transition-colors"
          >
            {t("common.backToDashboard")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-text border-b border-border pb-2">
              {t("quiz.basicInfo")}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  {t("quiz.title")} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  placeholder={t("quiz.titlePlaceholder")}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  {t("quiz.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none min-h-[72px]"
                  placeholder={t("quiz.descPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    {t("quiz.duration")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    {t("quiz.mode")}
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "RealTime" | "FreeStyle")}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  >
                    <option value="RealTime">{t("quiz.modeRealTime")}</option>
                    <option value="FreeStyle">{t("quiz.modeFreeStyle")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted text-center">
            {t("quiz.createHint", "You can configure questions, dates, anti-cheat rules, and more in the next step.")}
          </p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-border bg-surface2 px-6 py-2.5 text-sm font-medium text-text hover:bg-border transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-8 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {isPending ? t("common.creating") : t("quiz.createBtn")}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
