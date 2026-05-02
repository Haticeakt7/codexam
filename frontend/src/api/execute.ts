import client from "./client";
import type { ExecutionResult } from "./types";

export interface ExecuteRequest {
  language: string;
  code: string;
  stdin?: string;
}

export const executeApi = {
  run: (data: ExecuteRequest) =>
    client.post<{ jobId: string }>("/execute", data).then((r) => r.data),

  getJobStatus: (jobId: string) =>
    client.get<ExecutionResult>(`/execute/${jobId}`).then((r) => r.data),
};
