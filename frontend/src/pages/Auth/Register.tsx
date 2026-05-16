// ==========================================================
// Register – Kayıt Sayfası
// ROUTE: /register  (GuestRoute korumalı)
// ==========================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRegister } from "@/hooks/useAuth";

export default function Register() {
  const { t } = useTranslation();
  const { mutate: register, isPending } = useRegister();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = t("common.required");
    if (!email.includes("@")) next.email = t("common.required");
    if (password.length < 8) next.password = t("auth.minPassword");
    if (password !== confirmPassword) next.confirmPassword = t("auth.registerError");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    register(
      { displayName, email, password },
      { onError: () => setErrors({ form: t("auth.registerError") }) }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
            CodExam
          </Link>
          <p className="mt-2 text-sm text-muted">{t("auth.registerSubtitle")}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.displayName")}</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:outline-none ${errors.displayName ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                placeholder={t("auth.namePlaceholder")}
              />
              {errors.displayName && <span className="text-xs text-red-500 mt-1">{errors.displayName}</span>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:outline-none ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                placeholder={t("auth.emailPlaceholder")}
              />
              {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:outline-none ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                placeholder="••••••••"
              />
              {errors.password ? (
                <span className="text-xs text-red-500 mt-1">{errors.password}</span>
              ) : (
                <span className="text-xs text-muted mt-1 block">{t("auth.minPassword")}</span>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.passwordConfirm")}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:outline-none ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword}</span>}
            </div>

            {errors.form && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {errors.form}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isPending ? `${t("nav.register")}...` : t("nav.register")}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("auth.goToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
