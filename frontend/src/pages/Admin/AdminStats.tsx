// ==========================================================
// AdminStats – Admin Dashboard (KPI Özeti)
// ROUTE: /admin  (Admin index sayfası)
// ==========================================================

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdmin";

export default function AdminStats() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const defaultStats = {
    totalUsers: 0,
    activeQuizzes: 0,
    dailyExecutions: 0,
    last24hErrors: 0,
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="flex flex-col gap-8 text-text">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.systemDashboard")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
          <span className="mb-1 text-3xl font-bold text-primary">{currentStats.totalUsers}</span>
          <span className="text-sm font-medium text-muted">{t("admin.totalUsers")}</span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
          <span className="mb-1 text-3xl font-bold text-green-500">{currentStats.activeQuizzes}</span>
          <span className="text-sm font-medium text-muted">{t("admin.activeQuizzes")}</span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
          <span className="mb-1 text-3xl font-bold text-blue-500">{currentStats.last24hErrors}</span>
          <span className="text-sm font-medium text-muted">{t("admin.last24hErrors")}</span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
          <span className="mb-1 text-3xl font-bold text-purple-500">{currentStats.dailyExecutions}</span>
          <span className="text-sm font-medium text-muted">{t("admin.dailyExecutions")}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {t("admin.recentErrors")}
            {currentStats.last24hErrors > 0 && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-500">
                {currentStats.last24hErrors} {t("admin.errorsLabel")}
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate("/admin/system")}
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {t("admin.viewAll")}
          </button>
        </div>

        {currentStats.last24hErrors === 0 ? (
          <div className="py-8 text-center text-sm text-muted">{t("admin.noErrors")}</div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-sm flex gap-3 items-center">
              <span className="font-bold text-red-500 min-w-[60px]">[API]</span>
              <span className="truncate flex-1">Null reference exception in ExecutionService</span>
              <span className="text-xs text-muted">14:32</span>
            </div>
            <div className="rounded border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm flex gap-3 items-center">
              <span className="font-bold text-yellow-600 dark:text-yellow-500 min-w-[60px]">[Runner]</span>
              <span className="truncate flex-1">Container timeout for sessionId 1234</span>
              <span className="text-xs text-muted">13:15</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
