// ==========================================================
// AdminLayout – Admin Paneli Kabuğu
// KULLANIMLAR: /admin/*
// ==========================================================
//
// AMAÇ:
//   DashboardLayout'a benzer sol sidebar + içerik yapısı, ancak Admin'e özel
//   navigasyon linkleri ve "Admin" badge'i ile ayrışır.
//   Bu layout'u görebilmek için kullanıcının role=Admin olması gerekir
//   (PrivateRoute seviyesinde kontrol edilir).
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
//   │ CodExam  [Admin] │  h-14, border-b, "Admin" badge → bg-danger/10 text-danger
//   ├──────────────────┤
//   │ ◈ İstatistikler  │  NavLink (end=true için /admin tam eşleşme)
//   │ ◉ Kullanıcılar   │
//   │ ▤ Quiz'ler       │
//   │ ◌ Oturumlar      │
//   │ ⊞ Sistem Logları │
//   ├──────────────────┤
//   │ Admin User       │  bg-surface2 card
//   │ admin@mail.com   │
//   │ [☀/☾]  [Çıkış]  │
//   └──────────────────┘
//
//   - Aktif/pasif NavLink stilleri DashboardLayout ile aynı
//   - "Admin" badge: küçük, uppercase, bg-danger/10 text-danger, rounded
//
// İÇERİK ALANI:
//   flex-1, overflow-y-auto, p-6
//
// ==========================================================

import { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";

const NAV_ITEMS = [
  { to: "/admin",          label: "admin.stats",    icon: "◈", end: true },
  { to: "/admin/users",    label: "admin.users",    icon: "◉" },
  { to: "/admin/quizzes",  label: "admin.quizzes",  icon: "▤" },
  { to: "/admin/sessions", label: "admin.sessions", icon: "◌" },
  { to: "/admin/system",   label: "admin.logs",     icon: "⊞" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link to="/" className="text-base font-bold text-primary">
            CodExam
          </Link>
          <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
