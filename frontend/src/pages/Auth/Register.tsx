import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Register() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-6 text-xl font-bold text-text">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-muted">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
