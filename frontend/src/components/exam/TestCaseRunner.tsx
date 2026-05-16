import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { executeApi } from "@/api/execute";
import type { TestCase } from "@/api/types";

interface TCResult {
  passed: boolean;
  actualOutput: string;
  timedOut?: boolean;
}

interface Props {
  testCases: TestCase[];
  code: string;
  language: string;
  disabled?: boolean;
}

export default function TestCaseRunner({ testCases, code, language, disabled }: Props) {
  const { t } = useTranslation();
  const [results, setResults] = useState<Record<string, TCResult>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = testCases.filter((tc) => tc.isVisible);
  const hidden  = testCases.filter((tc) => !tc.isVisible);

  const runAll = useCallback(async () => {
    if (!visible.length || running || !code.trim()) return;
    setRunning(true);
    setError(null);
    setResults({});

    try {
      // Kick off all visible TCs in parallel
      const jobs = await Promise.all(
        visible.map((tc) => executeApi.run({ language, code, stdin: tc.input }))
      );

      const jobMap = new Map(visible.map((tc, i) => [tc.id, jobs[i].jobId]));
      const pending = new Set(visible.map((tc) => tc.id));
      const partial: Record<string, TCResult> = {};

      for (let attempt = 0; attempt < 60 && pending.size > 0; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));

        for (const tcId of [...pending]) {
          const jobId = jobMap.get(tcId)!;
          const job = await executeApi.getJobStatus(jobId);

          if (job.status === "Pending" || job.status === "Running") continue;

          const tc = visible.find((t) => t.id === tcId)!;
          const actual = job.stdout?.trim() ?? "";
          partial[tcId] = {
            passed: job.status !== "Error" && job.status !== "TLE" && actual === tc.expectedOutput.trim(),
            actualOutput: actual,
            timedOut: job.status === "TLE",
          };
          pending.delete(tcId);
        }

        setResults({ ...partial });
      }

      // Mark any jobs that never resolved as timed out
      for (const tcId of pending) {
        partial[tcId] = { passed: false, actualOutput: "", timedOut: true };
      }
      if (pending.size > 0) setResults({ ...partial });
    } catch {
      setError(t("exam.tcRunError"));
    } finally {
      setRunning(false);
    }
  }, [visible, code, language, running, t]);

  if (!testCases.length) return null;

  return (
    <div className="border-t border-border/50 flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface/50 flex-shrink-0">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          {t("exam.testCases")} ({testCases.length})
        </span>
        {visible.length > 0 && (
          <button
            onClick={runAll}
            disabled={disabled || running || !code.trim()}
            className="px-2 py-0.5 rounded bg-primary text-white text-xs font-medium disabled:opacity-50 hover:bg-primary-hover transition-colors"
          >
            {running ? t("exam.tcRunning") : t("exam.tcRunBtn")}
          </button>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-red-500 bg-red-500/10 border-b border-border/30">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-border/30 min-h-0">
        {visible.map((tc, i) => {
          const res   = results[tc.id];
          const icon  = !res ? "○" : res.passed ? "✓" : "✗";
          const color = !res ? "text-muted" : res.passed ? "text-green-500" : "text-red-500";
          return (
            <div key={tc.id} className="px-3 py-2 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold ${color}`}>{icon}</span>
                <span className="text-muted font-medium">{t("exam.testCaseLabel", { n: i + 1 })}</span>
                {res?.passed  && <span className="text-green-500">{t("exam.tcPassed")}</span>}
                {res && !res.passed && <span className="text-red-500">{res.timedOut ? t("exam.tcTLE") : t("exam.tcFailed")}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <div className="text-xs text-muted mb-0.5">{t("exam.tcInput")}</div>
                  <pre className="bg-bg rounded px-2 py-1 text-xs font-mono text-text whitespace-pre-wrap max-h-16 overflow-auto">{tc.input || "—"}</pre>
                </div>
                <div>
                  <div className="text-xs text-muted mb-0.5">{t("exam.tcExpected")}</div>
                  <pre className="bg-bg rounded px-2 py-1 text-xs font-mono text-text whitespace-pre-wrap max-h-16 overflow-auto">{tc.expectedOutput || "—"}</pre>
                </div>
              </div>
              {res && (
                <div className="mt-1">
                  <div className="text-xs text-muted mb-0.5">{t("exam.tcActual")}</div>
                  <pre className={`bg-bg rounded px-2 py-1 text-xs font-mono whitespace-pre-wrap max-h-16 overflow-auto ${res.passed ? "text-green-400" : "text-red-400"}`}>
                    {res.actualOutput || "—"}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {hidden.map((tc, i) => (
          <div key={tc.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
            <span className="text-muted">🔒</span>
            <span className="text-muted">{t("exam.testCaseLabel", { n: visible.length + i + 1 })} ({t("exam.tcHidden")})</span>
            <span className="text-muted/60 italic">{t("exam.tcHiddenNote")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
