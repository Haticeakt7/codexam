import { create } from "zustand";
import { persist } from "zustand/middleware";

type UITheme = "light" | "dark";

interface ThemeState {
  uiTheme: UITheme;
  toggleTheme: () => void;
  setTheme: (theme: UITheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      uiTheme: "light",

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ uiTheme: theme });
      },

      toggleTheme: () => {
        set((state) => {
          const next = state.uiTheme === "light" ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          return { uiTheme: next };
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
