// ==========================================================
// Home – Ana Sayfa (Anonim Kod Editörü, Resizable Panels)
// ROUTE: /  (public, auth gerekmez)
// ==========================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import { useEditorStore } from "@/stores/editorStore";
import { usePreferencesStore, EDITOR_THEMES } from "@/stores/preferencesStore";
import { useRunCode, useLanguages } from "@/hooks/useExecute";
import { toast } from "@/stores/toastStore";
import AppLayout from "@/components/layouts/AppLayout";

// ── Resize hooks ──────────────────────────────────────────

function useVerticalResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialPct: number,
  onEnd: (pct: number) => void
) {
  const [pct, setPct]   = useState(initialPct);
  const dragging        = useRef(false);
  const startX          = useRef(0);
  const startPct        = useRef(initialPct);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current   = e.clientX;
      startPct.current = pct;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const w    = containerRef.current.getBoundingClientRect().width;
        const delta = ((ev.clientX - startX.current) / w) * 100;
        setPct(Math.max(25, Math.min(80, startPct.current + delta)));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
        setPct((cur) => { onEnd(cur); return cur; });
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    },
    [pct, containerRef, onEnd]
  );

  return { pct, setPct, onMouseDown };
}

function useHorizontalResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialPct: number,
  onEnd: (pct: number) => void
) {
  const [pct, setPct]   = useState(initialPct);
  const dragging        = useRef(false);
  const startY          = useRef(0);
  const startPct        = useRef(initialPct);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current   = e.clientY;
      startPct.current = pct;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const h    = containerRef.current.getBoundingClientRect().height;
        const delta = ((ev.clientY - startY.current) / h) * 100;
        setPct(Math.max(20, Math.min(85, startPct.current + delta)));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
        setPct((cur) => { onEnd(cur); return cur; });
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    },
    [pct, containerRef, onEnd]
  );

  return { pct, setPct, onMouseDown };
}

// ── Stdin panel ───────────────────────────────────────────

function StdinPanel({ t, stdin, setStdin, pct, onToggle, stdinOnLeft, hideToggle }: {
  t: ReturnType<typeof import("react-i18next").useTranslation>["t"];
  stdin: string;
  setStdin: (v: string) => void;
  pct?: number;
  onToggle: () => void;
  stdinOnLeft: boolean;
  hideToggle?: boolean;
}) {
  const style = pct != null ? { height: `${pct}%` } : { flex: 1 };
  return (
    <div style={style} className="flex flex-col overflow-hidden min-h-0">
      <div className="flex h-8 items-center justify-between border-b border-border px-4 flex-shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-warning uppercase">{t("home.stdin")}</span>
          <span className="text-xs text-muted">{t("exam.stdinHint")}</span>
        </div>
        {!hideToggle && (
          <button
            onClick={onToggle}
            className="px-2 py-0.5 rounded bg-surface2 border border-border text-xs text-muted hover:text-text transition-colors"
            title={stdinOnLeft ? t("home.moveStdinRight") : t("home.moveStdinLeft")}
          >
            {stdinOnLeft ? "⇥" : "⇤"}
          </button>
        )}
      </div>
      <textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        className="flex-1 resize-none bg-bg px-4 py-2 font-mono text-sm text-text focus:outline-none"
        placeholder={t("home.stdinPlaceholder")}
        spellCheck={false}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────

type MobileTab = "output" | "stdin";

export default function Home() {
  const { t } = useTranslation();
  const { language, setLanguage, code, setCode, stdin, setStdin, output, isRunning } = useEditorStore();
  const prefs = usePreferencesStore();
  const { run } = useRunCode();
  const { data: languages = [] } = useLanguages();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("output");

  const stdinOnLeft = prefs.layout.stdinSlot !== "right";

  const containerRef  = useRef<HTMLDivElement>(null);
  const leftPanelRef  = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Horizontal resize lives in whichever panel holds stdin
  const horizPanelRef = stdinOnLeft ? leftPanelRef : rightPanelRef;

  const { pct: leftPct, setPct: setLeftPct, onMouseDown: onVertDrag } = useVerticalResize(
    containerRef,
    prefs.layout.leftWidth,
    (w) => prefs.setLayout({ leftWidth: w })
  );

  const { pct: splitPct, setPct: setSplitPct, onMouseDown: onHorizDrag } = useHorizontalResize(
    horizPanelRef,
    prefs.layout.rightTopHeight,
    (h) => prefs.setLayout({ rightTopHeight: h })
  );

  // Sync panel sizes when Zustand rehydrates from localStorage after initial render
  useEffect(() => { setLeftPct(prefs.layout.leftWidth); }, [prefs.layout.leftWidth, setLeftPct]);
  useEffect(() => { setSplitPct(prefs.layout.rightTopHeight); }, [prefs.layout.rightTopHeight, setSplitPct]);

  const handleRun = () => {
    const selected = languages.find((l: any) => l.id === language);
    run({ language: selected?.monacoLanguage ?? language, code, stdin: stdin || undefined });
  };

  const handleLanguageChange = (langId: string) => {
    const selected = languages.find((l: any) => l.id === langId);
    setLanguage(langId, selected?.defaultCode);
  };

  const toggleStdinSlot = () => {
    prefs.setLayout({ stdinSlot: stdinOnLeft ? "right" : "left" });
  };

  // Toast on execution complete
  const prevOutputRef = useRef<typeof output>(undefined as any);
  useEffect(() => {
    if (prevOutputRef.current === undefined) { prevOutputRef.current = output; return; }
    prevOutputRef.current = output;
    if (!output?.status || output.status === "Running" || output.status === "Pending") return;
    const label = t(`exec.status.${output.status}`, output.status);
    if (output.status === "Passed") toast.success(label);
    else toast.error(label);
  }, [output]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadgeClass = (status: string | undefined) => {
    switch (status) {
      case "Passed":  return "bg-green-500/20 text-green-500 border-green-500/30";
      case "Failed":
      case "Error":
      case "TLE":     return "bg-red-500/20 text-red-500 border-red-500/30";
      case "Running":
      case "Pending": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default:        return "bg-surface2 text-muted border-border";
    }
  };

  const selectedLang = languages.find((l) => l.id === language);

  const toolbar = (
    <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-3 sm:px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-lg border border-border bg-surface2 px-2 py-1.5 text-sm font-medium text-text focus:outline-none max-w-[110px] sm:max-w-none"
        >
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => prefs.setFontSize(prefs.fontSize - 1)}
            className="w-8 h-8 rounded bg-surface2 border border-border text-sm text-muted hover:text-text flex items-center justify-center"
            title={t("exam.decreaseFontSize")}
          >−</button>
          <span className="text-xs text-muted w-6 text-center tabular-nums">{prefs.fontSize}</span>
          <button
            onClick={() => prefs.setFontSize(prefs.fontSize + 1)}
            className="w-8 h-8 rounded bg-surface2 border border-border text-sm text-muted hover:text-text flex items-center justify-center"
            title={t("exam.increaseFontSize")}
          >+</button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowThemePicker((v) => !v)}
            className="px-2 py-1.5 rounded bg-surface2 border border-border text-sm text-muted hover:text-text"
            title={t("exam.editorTheme")}
          >🎨</button>
          {showThemePicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThemePicker(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                {EDITOR_THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => { prefs.setEditorTheme(th.id); setShowThemePicker(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface2 transition-colors ${
                      prefs.editorTheme === th.id ? "text-primary font-semibold" : "text-text"
                    }`}
                  >{th.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning}
        className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {isRunning ? t("home.running") : t("home.runBtn")}
      </button>
    </div>
  );

  const outputPanel = (
    <div className="flex flex-col bg-bg overflow-hidden min-w-0 flex-1">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 flex-shrink-0">
        <span className="text-xs font-bold tracking-wider text-muted uppercase">{t("home.output")}</span>
        {output?.status && (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusBadgeClass(output.status)}`}>
            {t(`exec.status.${output.status}`, output.status)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isRunning ? (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">{t("home.running")}</span>
          </div>
        ) : output ? (
          <div className="flex flex-col gap-4 h-full">
            <pre className={`flex-1 whitespace-pre-wrap font-mono text-sm bg-surface border border-border rounded-lg p-3 overflow-auto ${output.stderr ? "text-red-500" : "text-text"}`}>
              {output.stderr || output.stdout || <span className="text-muted italic">{t("home.noOutput")}</span>}
            </pre>
            {(output.timeMs != null || output.memKb != null) && (
              <div className="flex items-center gap-4 text-xs text-muted border-t border-border pt-3">
                {output.timeMs != null && <span>{t("home.execTime")}: {output.timeMs}ms</span>}
                {output.memKb  != null && <span>{t("home.memory")}: {(output.memKb / 1024).toFixed(1)} MB</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted">
            {t("home.clickRun")}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Outer container */}
      <div ref={containerRef} className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* ── Mobile: stacked + tabbed layout (flex-col, md:hidden) ── */}
        <div className="flex flex-col w-full md:hidden overflow-hidden">
          {toolbar}
          {/* Editor: 55% of available height */}
          <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ height: "55%" }}>
            <Editor
              height="100%"
              language={selectedLang?.monacoLanguage ?? language}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme={prefs.editorTheme}
              options={{
                fontSize:                prefs.fontSize,
                minimap:                 { enabled: false },
                scrollBeyondLastLine:    false,
                wordWrap:                "on",
                automaticLayout:         true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
          {/* Tab bar */}
          <div className="flex border-t border-b border-border bg-surface flex-shrink-0">
            <button
              onClick={() => setMobileTab("output")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                mobileTab === "output"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-text"
              }`}
            >
              {t("home.output")}
            </button>
            <button
              onClick={() => setMobileTab("stdin")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                mobileTab === "stdin"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-text"
              }`}
            >
              {t("home.stdin")}
            </button>
          </div>
          {/* Tab content: remaining height */}
          <div className="flex-1 overflow-hidden">
            {mobileTab === "output"
              ? outputPanel
              : <StdinPanel t={t} stdin={stdin} setStdin={setStdin} onToggle={toggleStdinSlot} stdinOnLeft={stdinOnLeft} hideToggle />
            }
          </div>
        </div>

        {/* ── Desktop: side-by-side resizable layout (md+) ── */}
        <div
          ref={leftPanelRef}
          style={{ width: `${leftPct}%` }}
          className="hidden md:flex flex-col overflow-hidden min-w-0 border-r border-border"
        >
          {toolbar}

          {/* Monaco Editor */}
          <div style={{ height: stdinOnLeft ? `${splitPct}%` : "100%" }} className="overflow-hidden min-h-0 flex-shrink-0">
            <Editor
              height="100%"
              language={selectedLang?.monacoLanguage ?? language}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme={prefs.editorTheme}
              options={{
                fontSize:                prefs.fontSize,
                minimap:                 { enabled: false },
                scrollBeyondLastLine:    false,
                wordWrap:                "on",
                automaticLayout:         true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* Stdin below editor (only when stdinSlot="left") */}
          {stdinOnLeft && (
            <>
              <div
                className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                onMouseDown={onHorizDrag}
              />
              <StdinPanel t={t} stdin={stdin} setStdin={setStdin} pct={100 - splitPct} onToggle={toggleStdinSlot} stdinOnLeft={stdinOnLeft} />
            </>
          )}
        </div>

        {/* Vertical resize handle between left and right panels (desktop only) */}
        <div
          className="hidden md:block w-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors select-none"
          onMouseDown={onVertDrag}
        />

        {/* ── Right Panel (desktop only) ── */}
        <div
          ref={rightPanelRef}
          className="hidden md:flex flex-col overflow-hidden min-w-0"
          style={{ width: `${100 - leftPct}%` }}
        >
          {stdinOnLeft ? (
            /* Right panel: output only */
            outputPanel
          ) : (
            /* Right panel: output + resize + stdin */
            <>
              <div style={{ height: `${splitPct}%` }} className="flex flex-col overflow-hidden min-h-0">
                {outputPanel}
              </div>
              <div
                className="h-1.5 flex-shrink-0 bg-border hover:bg-primary/60 cursor-row-resize transition-colors select-none"
                onMouseDown={onHorizDrag}
              />
              <StdinPanel t={t} stdin={stdin} setStdin={setStdin} pct={100 - splitPct} onToggle={toggleStdinSlot} stdinOnLeft={stdinOnLeft} />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
