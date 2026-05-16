// ==========================================================
// Login – Giriş Sayfası
// ROUTE: /login  (GuestRoute korumalı)
// ==========================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLogin } from "@/hooks/useAuth";

export default function Login() {
  const { t } = useTranslation();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login(
      { email, password },
      {
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "";
          if (msg.toLowerCase().includes("inactive")) {
            setError(t("auth.accountInactive"));
          } else {
            setError(t("auth.loginError"));
          }
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
            CodExam
          </Link>
          <p className="mt-2 text-sm text-muted">{t("auth.loginSubtitle")}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">{t("auth.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isPending ? `${t("nav.login")}...` : t("nav.login")}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t("auth.goToRegister")}
          </Link>
        </div>
      </div>
    </div>
  );
}
