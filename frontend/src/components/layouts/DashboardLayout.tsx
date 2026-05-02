// ==========================================================
// DashboardLayout – Kullanıcı Dashboard Kabuğu
// KULLANIMLAR: /dashboard/*, /profile
// ==========================================================
//
// AMAÇ:
//   Sol sidebar + sağ içerik alanından oluşan, giriş yapmış kullanıcıların
//   quiz yönetimi yaptığı ekranların kabuğu. h-screen, overflow-hidden yapısı.
//
// PROPS:
//   - children: ReactNode → sayfa içeriği
//
// BAĞLI STORE'LAR:
//   - useAuthStore() → user (displayName, email), logout
//   - useThemeStore() → uiTheme, toggleTheme
//
// SIDEBAR TASARIM (w-56, bg-surface, border-r):
//
//   ┌──────────────────┐
//   │ CodExam ←logo    │  h-14, border-b
//   ├──────────────────┤
//   │ ▤ Quizlerim      │  NavLink, aktifse bg-primary/10 text-primary
//   │ ＋ Yeni Quiz      │
//   │ ◉ Profil         │
//   ├──────────────────┤
//   │ Ahmet Yılmaz     │  bg-surface2 card (displayName + email)
//   │ ahmet@mail.com   │
//   │ [☀/☾]  [Çıkış]  │  yan yana iki buton
//   └──────────────────┘
//
//   - NavLink aktif stili: bg-primary/10 + text-primary + font-medium
//   - NavLink pasif stili: text-muted, hover:bg-surface2 hover:text-text
//   - /dashboard end=true ile tam eşleşme kontrolü
//
// İÇERİK ALANI:
//   flex-1, overflow-y-auto, p-6 → sayfa içeriği burada render edilir
//
// ==========================================================

import { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";

const NAV_ITEMS = [
  { to: "/dashboard",         label: "dashboard.myQuizzes", icon: "▤" },
  { to: "/dashboard/new",     label: "dashboard.newQuiz",   icon: "＋" },
  { to: "/profile",           label: "nav.profile",         icon: "◉" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { uiTheme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-bg text-text">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link to="/" className="text-base font-bold text-primary">
            CodExam
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted hover:bg-surface2 hover:text-text"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 rounded-lg bg-surface2 px-3 py-2">
            <p className="truncate text-sm font-medium text-text">{user?.displayName}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted transition-colors hover:bg-surface2 hover:text-text"
            >
              {uiTheme === "dark" ? "☀" : "☾"}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted transition-colors hover:bg-surface2 hover:text-text"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
