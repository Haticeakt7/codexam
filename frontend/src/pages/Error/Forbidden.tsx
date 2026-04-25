import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Forbidden() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg text-text">
      <h1 className="text-6xl font-bold text-muted">403</h1>
      <p className="text-lg">{t("error.403")}</p>
      <Link to="/" className="text-primary hover:underline">{t("error.goHome")}</Link>
    </div>
  );
}
