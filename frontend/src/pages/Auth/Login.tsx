import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Login() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-6 text-xl font-bold text-text">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-primary hover:underline">
            {t("nav.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
