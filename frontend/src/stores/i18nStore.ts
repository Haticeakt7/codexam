import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "i18next";

type Locale = "tr" | "en";

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "tr",
      setLocale: (locale) => {
        i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    { name: "codexam_locale" }
  )
);
