import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeApi, type ExecuteRequest } from "@/api/execute";
import { useEditorStore } from "@/stores/editorStore";
import type { SupportedLanguage } from "@/api/types";

const FALLBACK_LANGUAGES: SupportedLanguage[] = [
  { id: "python",     label: "Python 3", monacoLanguage: "python",     defaultCode: 'print("Hello, World!")' },
  { id: "javascript", label: "Node.js",  monacoLanguage: "javascript", defaultCode: 'console.log("Hello, World!");' },
  { id: "cpp",        label: "C++",      monacoLanguage: "cpp",        defaultCode: '#include <iostream>\nusing namespace std;\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}' },
];

const normalizeLanguages = (data: SupportedLanguage[] | unknown): SupportedLanguage[] => {
  if (Array.isArray(data)) return data as SupportedLanguage[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as SupportedLanguage[]) : FALLBACK_LANGUAGES;
};

export function useLanguages() {
  return useQuery<SupportedLanguage[]>({
    queryKey:        ["languages"],
    queryFn:         async () => normalizeLanguages(await executeApi.getLanguages()),
    staleTime:       Infinity,
    placeholderData: FALLBACK_LANGUAGES,
    retry:           1,
  });
}

export function useRunCode() {
  const [jobId, setJobId] = useState<string | null>(null);
  const setRunning = useEditorStore((s) => s.setRunning);
  const setOutput  = useEditorStore((s) => s.setOutput);

  const enqueue = useMutation({
    mutationFn: (data: ExecuteRequest) => executeApi.run(data),
    onSuccess: (data) => setJobId(data.jobId),
    onError:   () => setRunning(false),
  });

  const poll = useQuery({
    queryKey: ["execute-job", jobId],
    queryFn:  () => executeApi.getJobStatus(jobId!),
    enabled:  !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return !status || status === "Pending" || status === "Running" ? 1000 : false;
    },
  });

  useEffect(() => {
    const data = poll.data;
    if (!data) return;
    const terminal = !["Pending", "Running"].includes(data.status);
    if (!terminal) return;

    setRunning(false);
    setOutput({
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      status: data.status,
      timeMs: data.executionTimeMs ?? null,
      memKb:  data.memoryUsedKb  ?? null,
    });
    setJobId(null);
  }, [poll.data, setOutput, setRunning]);

  const run = (request: ExecuteRequest) => {
    setRunning(true);
    setOutput(null);
    enqueue.mutate(request);
  };

  return {
    run,
    isRunning: enqueue.isPending || !!jobId,
    error: enqueue.error,
  };
}
