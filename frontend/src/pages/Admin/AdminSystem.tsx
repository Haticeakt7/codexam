// ==========================================================
// AdminSystem – Sistem Logları
// ROUTE: /admin/system  (Admin only)
// ==========================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminSystemLogs } from "@/hooks/useAdmin";

export default function AdminSystem() {
  const { t } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState<"" | "API" | "Runner" | "Nginx">("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { data: logs, isLoading } = useAdminSystemLogs(sourceFilter || undefined);

  const getSourceStyle = (source: string) => {
    switch (source) {
      case "API":    return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "Runner": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "Nginx":  return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default:       return "bg-surface2 text-muted border-border";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return (
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " · " +
      date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-text h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.logs")}</h1>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("admin.allSources")}</option>
          <option value="API">API</option>
          <option value="Runner">Runner</option>
          <option value="Nginx">Nginx</option>
        </select>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!logs?.length ? (
            <div className="flex h-full flex-col items-center justify-center text-muted">
              {t("admin.noLogsFound")}
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-col rounded-lg border border-border bg-surface2/50 overflow-hidden">
                <div
                  className="flex cursor-pointer items-center gap-4 p-3 hover:bg-surface2 transition-colors"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="w-36 text-xs text-muted flex-shrink-0">
                    {formatDate(log.createdAt)}
                  </div>
                  <div className={`flex-shrink-0 rounded border px-2 py-0.5 text-xs font-bold w-16 text-center ${getSourceStyle(log.sourceService)}`}>
                    {log.sourceService}
                  </div>
                  <div className="flex-1 truncate font-medium text-sm">
                    {log.errorTitle}
                  </div>
                  <div className="text-muted text-xs">
                    {expandedLog === log.id ? "▲" : "▼"}
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="border-t border-border bg-bg p-4 text-xs font-mono">
                    <div className="mb-2 whitespace-pre-wrap text-red-400 font-bold">
                      {log.errorMessage}
                    </div>
                    {log.stackTrace && (
                      <div className="max-h-64 overflow-y-auto rounded border border-border bg-surface p-3 text-muted/80 whitespace-pre-wrap">
                        {log.stackTrace}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border bg-surface2 px-6 py-3 text-xs text-muted">
          {t("admin.totalCount", { count: logs?.length ?? 0 })}
        </div>
      </div>
    </div>
  );
}
