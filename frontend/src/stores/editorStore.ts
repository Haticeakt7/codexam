import { create } from "zustand";

export type Language = "python" | "javascript" | "cpp";

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

export const STARTERS: Record<Language, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
};

interface EditorState {
  language: Language;
  code: string;
  stdin: string;
  output: ExecutionOutput | null;
  isRunning: boolean;

  setLanguage: (lang: Language) => void;
  setCode: (code: string) => void;
  setStdin: (stdin: string) => void;
  setOutput: (output: ExecutionOutput | null) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  language: "python",
  code: STARTERS.python,
  stdin: "",
  output: null,
  isRunning: false,

  setLanguage: (language) =>
    set({ language, code: STARTERS[language], output: null }),

  setCode: (code) => set({ code }),
  setStdin: (stdin) => set({ stdin }),
  setOutput: (output) => set({ output }),
  setRunning: (isRunning) => set({ isRunning }),
  reset: () => set({ output: null, isRunning: false }),
}));
