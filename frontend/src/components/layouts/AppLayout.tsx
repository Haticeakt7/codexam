// ==========================================================
// AppLayout – Genel Sayfa Kabuğu
// KULLANIMLAR: Login, Register, Home, QuizLanding gibi public sayfalar
// ==========================================================
//
// AMAÇ:
//   Sticky header + children içerik alanından oluşan genel uygulama kabuğu.
//   Auth gerektirmeyen tüm public sayfalar bu layout içinde render edilir.
//
// PROPS:
//   - children: ReactNode → sayfa içeriği
//
// BAĞLI STORE'LAR:
//   - useAuthStore() → user, isAuthenticated, logout
//   - useThemeStore() → uiTheme, toggleTheme
//   - useI18nStore()  → locale (tr/en), setLocale → i18next dil değişimi
//
// ÜST BAR (Header) TASARIM:
//   Sticky, z-40, bg-surface/95 backdrop-blur
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  CodExam ←logo    [TR/EN] [☀/☾]  [Giriş] [Kayıt Ol →]     │
//   │                                   (auth varsa: Dashboard/Çıkış)│
//   └──────────────────────────────────────────────────────────────┘
//
//   - Logo: "CodExam" metni, primary renk, / route'a bağlı
//   - Dil toggle: "TR" / "EN" buton (border-border, bg-surface2)
//   - Tema toggle: ☀ (dark modda) / ☾ (light modda) buton
//   - isAuthenticated=false → Login linki + "Kayıt Ol" primary buton
//   - isAuthenticated=true  → (Admin rolü varsa) Admin linki + Dashboard linki + Çıkış butonu
//
// İÇERİK ALANI:
//   flex-1, children direkt render edilir (padding yok — sayfa kendi ayarlar)
//
// ==========================================================

import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useI18nStore } from "@/stores/i18nStore";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { uiTheme, toggleTheme } = useThemeStore();
  const { locale: uiLang, setLocale: setUiLang } = useI18nStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="logo" className="h-8 w-8 rounded-md" />
            <span className="text-xl font-bold tracking-tight text-primary">CodExam</span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5">
            {/* Language + Theme toggles */}
            <div className="flex items-center rounded-lg border border-border bg-surface2 p-0.5">
              <button
                onClick={() => setUiLang(uiLang === "tr" ? "en" : "tr")}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-text"
              >
                {uiLang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
              </button>
              <div className="h-4 w-px bg-border" />
              <button
                onClick={toggleTheme}
                className="rounded-md px-2.5 py-1.5 text-sm leading-none transition-colors hover:bg-surface"
                aria-label="Tema değiştir"
              >
                {uiTheme === "dark" ? "☀" : "☾"}
              </button>
            </div>

            {/* Divider */}
            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Auth links */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                {user?.role === "Admin" && (
                  <Link
                    to="/admin"
                    className="hidden sm:block rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
                  >
                    {t("nav.admin")}
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
                >
                  {t("nav.dashboard")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                >
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
