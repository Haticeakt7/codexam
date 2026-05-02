import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeApi, type ExecuteRequest } from "@/api/execute";
import { useEditorStore } from "@/stores/editorStore";

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
