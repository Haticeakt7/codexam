// ==========================================================
// Forbidden – 403 Sayfası
// ROUTE: /403  (PrivateRoute: rol uyumsuzluğunda buraya yönlendirir)
// ==========================================================

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";

export default function Forbidden() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const returnPath = user?.role === "Admin" ? "/admin" : (user ? "/dashboard" : "/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-text">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-8xl font-bold text-red-500">403</h1>
        <h2 className="mb-6 text-2xl font-bold text-text">{t("error.403")}</h2>
        <p className="mb-8 text-muted">{t("error.403Message")}</p>
        <Link
          to={returnPath}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
        >
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
