import { create } from "zustand";
import { persist } from "zustand/middleware";

type UITheme = "light" | "dark";
type MonacoTheme = "vs" | "vs-dark";

interface ThemeState {
  uiTheme: UITheme;
  monacoTheme: MonacoTheme;
  toggleTheme: () => void;
  setTheme: (theme: UITheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      uiTheme: "light",
      monacoTheme: "vs",

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ uiTheme: theme, monacoTheme: theme === "dark" ? "vs-dark" : "vs" });
      },

      toggleTheme: () => {
        set((state) => {
          const next = state.uiTheme === "light" ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          return { uiTheme: next, monacoTheme: next === "dark" ? "vs-dark" : "vs" };
        });
      },
    }),
    {
      name: "codexam_theme",
      onRehydrateStorage: () => (state) => {
        if (state?.uiTheme === "dark") {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
