import { create } from "zustand";

export type ExecutionStatus =
  | "Pending"
  | "Running"
  | "Passed"
  | "Failed"
  | "Error"
  | "TLE";

export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  status: ExecutionStatus;
  timeMs: number | null;
  memKb: number | null;
}

// Fallback starter code for known languages when backend is unavailable
export const FALLBACK_STARTERS: Record<string, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
};

interface EditorState {
  language: string;
  code: string;
  stdin: string;
  output: ExecutionOutput | null;
  isRunning: boolean;

  setLanguage: (lang: string, defaultCode?: string) => void;
  setCode: (code: string) => void;
  setStdin: (stdin: string) => void;
  setOutput: (output: ExecutionOutput | null) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  language: "python",
  code: FALLBACK_STARTERS.python,
  stdin: "",
  output: null,
  isRunning: false,

  setLanguage: (language, defaultCode) =>
    set({
      language,
      code: defaultCode ?? FALLBACK_STARTERS[language] ?? "// Start coding here\n",
      output: null,
    }),

  setCode: (code) => set({ code }),
  setStdin: (stdin) => set({ stdin }),
  setOutput: (output) => set({ output }),
  setRunning: (isRunning) => set({ isRunning }),
  reset: () => set({ output: null, isRunning: false }),
}));
