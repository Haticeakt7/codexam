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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-6 backdrop-blur-sm">
        <Link to="/" className="text-lg font-bold text-primary">
          CodExam
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUiLang(uiLang === "tr" ? "en" : "tr")}
            className="rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
          >
            {uiLang.toUpperCase()}
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-sm transition-colors hover:bg-surface"
          >
            {uiTheme === "dark" ? "☀" : "☾"}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {user?.role === "Admin" && (
                <Link to="/admin" className="text-sm text-muted hover:text-text transition-colors">
                  {t("nav.admin")}
                </Link>
              )}
              <Link to="/dashboard" className="text-sm text-muted hover:text-text transition-colors">
                {t("nav.dashboard")}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-text transition-colors"
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-muted hover:text-text transition-colors">
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
