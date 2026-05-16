// ==========================================================
// NotFound – 404 Sayfası
// ROUTE: /404  (App.tsx'de * → /404 yönlendirmesi)
// ==========================================================

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-text">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-8xl font-bold text-muted/50">404</h1>
        <h2 className="mb-6 text-2xl font-bold text-text">{t("error.404")}</h2>
        <p className="mb-8 text-muted">{t("error.404Message")}</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface2 px-6 py-3 text-sm font-bold text-text hover:bg-border transition-colors"
        >
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
