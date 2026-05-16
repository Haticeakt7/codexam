// ==========================================================
// AdminUsers – Kullanıcı Yönetimi
// ROUTE: /admin/users  (Admin only)
// ==========================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminUsers, useUpdateUser, useDeleteUser } from "@/hooks/useAdmin";
import type { AdminUser } from "@/api/types";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useAdminUsers();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "Admin" | "User">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const filteredUsers = users?.filter((u: AdminUser) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  }) || [];

  const handleRoleChange = (id: string, newRole: "Admin" | "User") => {
    updateUser({ id, data: { role: newRole } });
  };

  const handleStatusChange = (id: string, currentStatus: string) => {
    const newStatus: "active" | "inactive" = currentStatus === "active" ? "inactive" : "active";
    updateUser({ id, data: { status: newStatus } });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteUser(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-text h-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("admin.userManagement")}</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder={t("admin.searchUsers")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus:outline-none flex-1 sm:w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:outline-none"
          >
            <option value="all">{t("common.all")}</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface2 border-b border-border text-xs uppercase text-muted z-10">
              <tr>
                <th className="px-6 py-4 font-bold">{t("admin.userCol")}</th>
                <th className="px-6 py-4 font-bold">{t("admin.roleCol")}</th>
                <th className="px-6 py-4 font-bold">{t("common.status")}</th>
                <th className="px-6 py-4 font-bold text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted">{t("admin.noUsers")}</td>
                </tr>
              ) : (
                filteredUsers.map((user: AdminUser) => (
                  <tr key={user.id} className={`border-b border-border transition-colors ${user.status === 'inactive' ? 'bg-bg/50 opacity-70' : 'hover:bg-surface2/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{user.displayName || t("admin.unnamed")}</span>
                        <span className="text-xs text-muted">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as "Admin" | "User")}
                          className={`appearance-none cursor-pointer rounded border pl-2 pr-6 py-1 text-xs font-bold focus:outline-none focus:ring-1 ${
                            user.role === 'Admin'
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700 focus:ring-indigo-400 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'border-slate-300 bg-white text-slate-700 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {user.status === 'active' ? t("admin.activeStatus") : t("admin.inactiveStatus")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(user.id, user.status)}
                          className="rounded border border-border bg-surface px-2 py-2 text-xs hover:bg-border transition-colors"
                          title={user.status === 'active' ? t("admin.deactivate") : t("admin.activate")}
                        >
                          {user.status === 'active' ? '⛔' : '✅'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="rounded border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs text-red-500 hover:bg-red-500/20 transition-colors"
                          title={t("common.delete")}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-surface2 px-6 py-3 flex items-center justify-between text-xs text-muted">
          <span>{t("admin.totalCount", { count: filteredUsers.length })}</span>
          <div className="flex gap-2">
            <button className="rounded px-2 py-1 hover:bg-border disabled:opacity-50" disabled>{t("admin.prevPage")}</button>
            <span className="px-2 py-1">{t("admin.page1of1")}</span>
            <button className="rounded px-2 py-1 hover:bg-border disabled:opacity-50" disabled>{t("admin.nextPage")}</button>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-bold text-red-500">{t("admin.deleteUser")}</h3>
            <p className="mb-6 text-sm text-muted">
              <strong>{deleteTarget.displayName || deleteTarget.email}</strong> {t("admin.deleteUserConfirmPrefix")}
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
    </div>
  );
}
