import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen bg-bg text-text">
      <aside className="w-56 border-r border-border bg-surface p-4">
        <p className="font-bold text-primary">CodExam Admin</p>
        <nav className="mt-4 space-y-1 text-sm text-muted">
          <a href="/admin/users"   className="block hover:text-text">{t("admin.users")}</a>
          <a href="/admin/quizzes" className="block hover:text-text">{t("admin.quizzes")}</a>
          <a href="/admin/sessions"className="block hover:text-text">{t("admin.sessions")}</a>
          <a href="/admin/system"  className="block hover:text-text">{t("admin.logs")}</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<p>{t("admin.stats")}</p>} />
        </Routes>
      </main>
    </div>
  );
}
