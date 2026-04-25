import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen bg-bg text-text">
      <aside className="w-56 border-r border-border bg-surface p-4">
        <p className="font-bold text-primary">CodExam</p>
        <nav className="mt-4 space-y-1 text-sm text-muted">
          <a href="/dashboard" className="block hover:text-text">{t("dashboard.myQuizzes")}</a>
          <a href="/profile"   className="block hover:text-text">{t("nav.profile")}</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<p>{t("dashboard.myQuizzes")}</p>} />
        </Routes>
      </main>
    </div>
  );
}
