// ==========================================================
// Profile – Kullanıcı Profili
// ROUTE: /profile  (PrivateRoute: User + Admin)
// ==========================================================

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { usersApi } from "@/api/users";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setDisplayName } = useAuthStore();
  const [displayName, setDisplayNameInput] = useState(user?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage("");
    } else {
      setSuccessMessage(msg);
      setErrorMessage("");
    }
    setTimeout(() => { setSuccessMessage(""); setErrorMessage(""); }, 4000);
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      flash(t("profile.emptyDisplayName"), true);
      return;
    }
    setProfileLoading(true);
    try {
      const res = await usersApi.updateDisplayName(displayName.trim());
      setDisplayName(res.displayName);
      setDisplayNameInput(res.displayName);
      flash(t("profile.profileUpdated"));
    } catch {
      flash(t("profile.updateFailed"), true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      flash(t("profile.fillAllPasswordFields"), true);
      return;
    }
    if (newPassword.length < 8) {
      flash(t("profile.passwordTooShort"), true);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      flash(t("profile.passwordMismatch"), true);
      return;
    }
    setPasswordLoading(true);
    try {
      await usersApi.updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      flash(t("profile.passwordUpdated"));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      flash(status === 401 ? t("profile.wrongCurrentPassword") : t("profile.updateFailed"), true);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-text">{t("profile.title")}</h1>

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm font-medium text-green-500">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-500">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Account Info */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 border-b border-border pb-2 text-lg font-bold text-text">{t("profile.accountInfo")}</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 text-sm font-medium text-muted">{t("profile.emailLabel")}</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="flex-1 rounded-lg border border-border bg-surface2 px-4 py-2 text-sm text-muted opacity-70"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 text-sm font-medium text-muted">{t("profile.roleLabel")}</label>
                <div className="flex-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${user?.role === 'Admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface2 text-muted border border-border'}`}>
                    {user?.role || t("common.unknown")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 flex-shrink-0 text-sm font-medium text-muted">{t("profile.displayNameLabel")}</label>
                <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:items-center">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-bg px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleUpdateProfile}
                    disabled={profileLoading}
                    className="sm:flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {profileLoading ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 border-b border-border pb-2 text-lg font-bold text-text">{t("profile.changePassword")}</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 text-sm font-medium text-muted">{t("profile.currentPassword")}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-bg px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 text-sm font-medium text-muted">{t("profile.newPassword")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("profile.minPassword")}
                  className="flex-1 rounded-lg border border-border bg-bg px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="w-32 text-sm font-medium text-muted">{t("profile.confirmNewPassword")}</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-bg px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading}
                  className="rounded-lg border border-border bg-surface2 px-6 py-2 text-sm font-bold text-text hover:bg-border transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? t("common.saving") : t("profile.updatePassword")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
