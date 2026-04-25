import { useTranslation } from "react-i18next";
import { useEditorStore } from "@/stores/editorStore";
import { useThemeStore } from "@/stores/themeStore";
import { useI18nStore } from "@/stores/i18nStore";

export default function Home() {
  const { t } = useTranslation();
  const { language, setLanguage, toggleTheme, uiTheme } = {
    ...useEditorStore(),
    ...useThemeStore(),
    ...useI18nStore(),
  };

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <span className="text-lg font-bold text-primary">CodExam</span>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="rounded border border-border bg-surface2 px-2 py-1 text-sm text-text"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
          </select>
          <button
            onClick={() => useThemeStore.getState().toggleTheme()}
            className="rounded border border-border bg-surface2 px-3 py-1 text-sm"
          >
            {uiTheme === "dark" ? "☀️" : "🌙"}
          </button>
          <a href="/login" className="text-sm text-primary hover:underline">
            {t("nav.login")}
          </a>
        </div>
      </header>

      {/* Editor + Output placeholder */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-border bg-surface p-4 text-muted text-sm">
          {/* Monaco Editor buraya gelecek */}
          Monaco Editor — {t("home.title")}
        </div>
        <div className="w-1/3 bg-surface2 p-4 text-sm text-muted">
          {/* Output panel */}
          {t("home.output")}
        </div>
      </main>
    </div>
  );
}
