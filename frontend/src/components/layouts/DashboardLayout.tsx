// ==========================================================
// DashboardLayout – Kullanıcı Dashboard Kabuğu
// KULLANIMLAR: /dashboard/*, /profile
// ==========================================================

import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useI18nStore } from "@/stores/i18nStore";

const NAV_ITEMS = [
  { to: "/dashboard",     label: "dashboard.myQuizzes", icon: "▤" },
  { to: "/dashboard/new", label: "dashboard.newQuiz",   icon: "＋" },
  { to: "/profile",       label: "nav.profile",         icon: "◉" },
];

const ADMIN_NAV_ITEMS = [
  { to: "/admin",          label: "admin.stats",    icon: "◈", end: true },
  { to: "/admin/users",    label: "admin.users",    icon: "◉" },
  { to: "/admin/quizzes",  label: "admin.quizzes",  icon: "▤" },
  { to: "/admin/sessions", label: "admin.sessions", icon: "◌" },
  { to: "/admin/system",   label: "admin.logs",     icon: "⊞" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export default function DashboardLayout({ children, noPadding }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { uiTheme, toggleTheme } = useThemeStore();
  const { locale: uiLang, setLocale: setUiLang } = useI18nStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={closeSidebar}>
          <img src="/icon.png" alt="logo" className="h-7 w-7 rounded-md" />
          <span className="text-base font-bold text-primary">CodExam</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg text-muted hover:bg-surface2 hover:text-text transition-colors"
          aria-label="Menüyü kapat"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted hover:bg-surface2 hover:text-text"
              }`
            }
          >
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            {t(item.label)}
          </NavLink>
        ))}
        {user?.role === "Admin" && (
          <>
            <div className="mt-3 mb-1 px-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-danger">{t("nav.admin")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-danger/10 font-medium text-danger"
                      : "text-muted hover:bg-surface2 hover:text-text"
                  }`
                }
              >
                <span className="text-base leading-none w-5 text-center">{item.icon}</span>
                {t(item.label)}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="mb-3 rounded-lg bg-surface2 px-3 py-2">
          <p className="truncate text-sm font-medium text-text">{user?.displayName}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <div className="mb-2 flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 rounded-lg border border-border py-2 text-sm text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label="Toggle theme"
          >
            {uiTheme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={() => setUiLang(uiLang === "tr" ? "en" : "tr")}
            className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            {uiLang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-border/50 py-2 text-sm font-semibold text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
        >
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">

      {/* ── Desktop sidebar (lg+) ─────────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile sidebar drawer ─────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Content area ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface2 hover:text-text transition-colors"
            aria-label="Menüyü aç"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1"/>
              <rect y="9" width="20" height="2" rx="1"/>
              <rect y="15" width="20" height="2" rx="1"/>
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="logo" className="h-7 w-7 rounded-md" />
            <span className="text-base font-bold text-primary">CodExam</span>
          </Link>
          <div className="w-10" aria-hidden="true" />
        </header>

        <main className={`flex-1 ${noPadding ? "overflow-hidden" : "overflow-y-auto p-4 sm:p-6"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
