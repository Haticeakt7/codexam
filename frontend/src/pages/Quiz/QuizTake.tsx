import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-2 text-sm">
        Quiz {id} — {t("exam.timeRemaining")}: 00:00
      </header>
      <main className="flex flex-1">
        <div className="w-1/3 border-r border-border p-4 text-muted">Soru listesi</div>
        <div className="flex-1 p-4 text-muted">Monaco Editor</div>
      </main>
    </div>
  );
}
