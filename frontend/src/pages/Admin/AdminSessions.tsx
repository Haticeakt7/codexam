// ==========================================================
// AdminSessions – Aktif JWT Kullanıcı Oturumları
// ROUTE: /admin/sessions  (Admin only)
// ==========================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminUserSessions, useRevokeUserSession } from "@/hooks/useAdmin";
import { useAuthStore } from "@/stores/authStore";
import type { AdminUserSession } from "@/api/types";

export default function AdminSessions() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const { data: sessions, isLoading } = useAdminUserSessions();
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeUserSession();

  const [revokeTarget, setRevokeTarget] = useState<AdminUserSession | null>(null);

  const handleRevoke = () => {
    if (!revokeTarget) return;
    revokeSession(revokeTarget.userId, { onSuccess: () => setRevokeTarget(null) });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString([], {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
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
        <div>
          <h1 className="text-2xl font-bold">{t("admin.sessionManagement")}</h1>
          <p className="mt-1 text-sm text-muted">{t("admin.activeJwtSessions")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface2 border-b border-border text-xs uppercase text-muted z-10">
              <tr>
                <th className="px-6 py-4 font-bold">{t("admin.userCol")}</th>
                <th className="px-6 py-4 font-bold">{t("profile.emailLabel")}</th>
                <th className="px-6 py-4 font-bold">{t("profile.roleLabel")}</th>
                <th className="px-6 py-4 font-bold">{t("admin.sessionExpiresCol")}</th>
                <th className="px-6 py-4 font-bold text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {!sessions?.length ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">{t("admin.noActiveSessions")}</td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.userId} className="border-b border-border hover:bg-surface2/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold">{s.displayName}</span>
                    </td>
                    <td className="px-6 py-4 text-muted">{s.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${s.role === "Admin" ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface2 text-muted border border-border"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">{formatDate(s.sessionExpiresAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {s.userId === currentUser?.id ? (
                        <span className="text-xs text-muted italic">{t("admin.currentSession")}</span>
                      ) : (
                        <button
                          onClick={() => setRevokeTarget(s)}
                          className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          {t("admin.forceLogout")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-surface2 px-6 py-3 text-xs text-muted">
          {t("admin.totalCount", { count: sessions?.length ?? 0 })}
        </div>
      </div>

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-red-500">{t("admin.forceLogout")}</h3>
            <p className="mb-6 text-sm text-muted">
              <strong>{revokeTarget.displayName}</strong> {t("admin.forceLogoutConfirmSuffix")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeTarget(null)} className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium hover:bg-border transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleRevoke} disabled={isRevoking} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isRevoking ? t("common.loading") : t("admin.forceLogout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
