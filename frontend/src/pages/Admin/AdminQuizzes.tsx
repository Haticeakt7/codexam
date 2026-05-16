// ==========================================================
// AdminQuizzes – Admin Quiz Yönetimi
// ROUTE: /admin/quizzes  (Admin only)
// ==========================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminQuizzes, useAdminDeleteQuiz, useAdminBulkDeleteQuizzes } from "@/hooks/useAdmin";
import type { Quiz } from "@/api/types";

export default function AdminQuizzes() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading } = useAdminQuizzes();
  const { mutate: deleteQuiz, isPending: isDeleting } = useAdminDeleteQuiz();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useAdminBulkDeleteQuizzes();

  const [statusFilter, setStatusFilter] = useState<"all" | "Draft" | "Active" | "Ended">("all");
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const filteredQuizzes = (quizzes ?? []).filter((q) => statusFilter === "all" || q.status === statusFilter);

  const allSelected = filteredQuizzes.length > 0 && filteredQuizzes.every((q) => selected.has(q.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredQuizzes.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredQuizzes.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteQuiz(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const handleBulkDelete = () => {
    bulkDelete([...selected], {
      onSuccess: () => {
        setSelected(new Set());
        setShowBulkConfirm(false);
      },
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500/10 text-green-500";
      case "Draft":  return "bg-surface2 text-muted";
      case "Ended":  return "bg-red-500/10 text-red-500";
      default:       return "bg-surface2 text-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Active": return t("quiz.active");
      case "Draft":  return t("quiz.draft");
      case "Ended":  return t("quiz.ended");
      default:       return status;
    }
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{t("admin.systemQuizzes")}</h1>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted">{t("admin.selectedCount", { count: selected.size })}</span>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-border bg-surface2 px-3 py-1.5 text-xs font-medium hover:bg-border transition-colors"
              >
                {t("common.clearSelection")}
              </button>
              <button
                onClick={() => setShowBulkConfirm(true)}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors"
              >
                {t("admin.deleteSelected")}
              </button>
            </>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="all">{t("admin.allStatuses")}</option>
            <option value="Active">{t("quiz.active")}</option>
            <option value="Draft">{t("quiz.draft")}</option>
            <option value="Ended">{t("quiz.ended")}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface2 border-b border-border text-xs uppercase text-muted z-10">
              <tr>
                <th className="px-4 py-4">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-6 py-4 font-bold">{t("admin.quizTitleCol")}</th>
                <th className="px-6 py-4 font-bold">{t("admin.quizOwner")}</th>
                <th className="px-6 py-4 font-bold">{t("common.status")}</th>
                <th className="px-6 py-4 font-bold">{t("admin.quizQuestionsCol")}</th>
                <th className="px-6 py-4 font-bold">{t("admin.quizSessionsCol")}</th>
                <th className="px-6 py-4 font-bold text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">{t("admin.noQuizzesFound")}</td>
                </tr>
              ) : (
                filteredQuizzes.map((q) => (
                  <tr key={q.id} className={`border-b border-border hover:bg-surface2/50 transition-colors ${selected.has(q.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleOne(q.id)} className="rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{q.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted">{(q as Record<string, unknown> & typeof q & { owner?: { name?: string }; ownerId?: string }).owner?.name || (q as Record<string, unknown> & typeof q & { ownerId?: string }).ownerId || t("common.unknown")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusStyle(q.status)}`}>
                        {getStatusLabel(q.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">{q.questionCount || 0}</td>
                    <td className="px-6 py-4 text-muted">{q.participantCount || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="rounded border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs text-red-500 hover:bg-red-500/20 transition-colors"
                        title={t("common.delete")}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-surface2 px-6 py-3 flex items-center justify-between text-xs text-muted">
          <span>{t("admin.totalCount", { count: filteredQuizzes.length })}</span>
        </div>
      </div>

      {/* Single delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-red-500">{t("admin.deleteQuiz")}</h3>
            <p className="mb-6 text-sm text-muted">
              <strong>{deleteTarget.title}</strong> {t("admin.deleteQuizConfirmSuffix")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isDeleting ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-red-500">{t("admin.bulkDeleteQuizzes")}</h3>
            <p className="mb-6 text-sm text-muted">
              {t("admin.bulkDeleteQuizzesConfirm", { count: selected.size })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isBulkDeleting ? t("common.deleting") : t("admin.deleteSelected")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
