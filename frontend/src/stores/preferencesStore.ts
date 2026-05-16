import { create } from "zustand";
import { persist } from "zustand/middleware";
import { preferencesApi } from "@/api/preferences";

export interface PanelLayout {
  leftWidth: number;       // % of total editor area width (default 55)
  rightTopHeight: number;  // % of right panel height for output (default 50)
  outputTopHeight: number; // % of output+TC container given to output when TC visible (default 65)
  stdinSlot: "left" | "right"; // which panel holds stdin (default "left" for Home, "right" for exam)
}

export const EDITOR_THEMES = [
  { id: "vs-dark", label: "Dark (VS Code)" },
  { id: "vs",      label: "Light (VS Code)" },
  { id: "hc-black", label: "High Contrast" },
] as const;

export type EditorThemeId = (typeof EDITOR_THEMES)[number]["id"];

const DEFAULT_LAYOUT: PanelLayout = { leftWidth: 55, rightTopHeight: 50, outputTopHeight: 65, stdinSlot: "left" };

interface PreferencesState {
  editorTheme: EditorThemeId;
  fontSize: number;
  layout: PanelLayout;

  setEditorTheme: (theme: EditorThemeId) => void;
  setFontSize: (size: number) => void;
  setLayout: (layout: Partial<PanelLayout>) => void;

  /** Call after login to merge server prefs (server wins for auth users) */
  loadFromServer: () => Promise<void>;
  /** Persist current state to server for authenticated users */
  saveToServer: () => Promise<void>;
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

const debouncedServerSave = (fn: () => void, delayMs = 1200) => {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(fn, delayMs);
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      editorTheme: "vs-dark",
      fontSize: 14,
      layout: DEFAULT_LAYOUT,

      setEditorTheme: (theme) => {
        set({ editorTheme: theme });
        debouncedServerSave(() => get().saveToServer());
      },

      setFontSize: (size) => {
        const clamped = Math.max(8, Math.min(32, size));
        set({ fontSize: clamped });
        debouncedServerSave(() => get().saveToServer());
      },

      setLayout: (partial) => {
        set((s) => ({ layout: { ...s.layout, ...partial } }));
        // Throttle layout saves more aggressively (only after drag ends)
        debouncedServerSave(() => get().saveToServer(), 2000);
      },

      loadFromServer: async () => {
        try {
          const prefs = await preferencesApi.get();
          let layout = DEFAULT_LAYOUT;
          if (prefs.layoutJson) {
            try { layout = { ...DEFAULT_LAYOUT, ...JSON.parse(prefs.layoutJson) }; }
            catch { /* keep default */ }
          }
          set({
            editorTheme: (prefs.editorTheme as EditorThemeId) || "vs-dark",
            fontSize: Math.max(8, Math.min(32, prefs.fontSize || 14)),
            layout,
          });
        } catch {
          // Server unavailable — keep local state
        }
      },

      saveToServer: async () => {
        try {
          const { editorTheme, fontSize, layout } = get();
          await preferencesApi.update({
            editorTheme,
            fontSize,
            layoutJson: JSON.stringify(layout),
          });
        } catch {
          // Silently ignore — local state is always persisted
        }
      },
    }),
    {
      name: "codexam_preferences",
    }
  )
);
