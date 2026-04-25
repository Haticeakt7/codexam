import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function QuizLanding() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-bg text-text">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-2 text-xl font-bold">Quiz: {id}</h1>
        <p className="text-muted">{t("exam.rules")}</p>
        <button className="mt-6 rounded bg-primary px-6 py-2 text-white">
          {t("exam.enter")}
        </button>
      </div>
    </div>
  );
}
