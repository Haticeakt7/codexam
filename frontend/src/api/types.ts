export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  errors?: Record<string, string[]>;
  detail?: string;
}

// ---------- Auth ----------

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "Admin" | "User";
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

// ---------- Quiz ----------

export type QuizStatus   = "Draft" | "Active" | "Ended";
export type QuizMode     = "RealTime" | "FreeStyle";
export type QuestionType =
  | "Coding"
  | "MultipleChoice"
  | "OutputPrediction"
  | "BugFix"
  | "ShortAnswer";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "email";
  required: boolean;
}

export interface AntiCheatOptions {
  tabSwitch: boolean;
  fullscreen: boolean;
  clipboard: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  mode: QuizMode;
  status: QuizStatus;
  antiCheatOptions: AntiCheatOptions;
  formSchema: FormField[];
  accessCode?: string;
  participantCount: number;
  questionCount: number;
  createdAt: string;
  publishedAt?: string;
}

export interface QuizInfo {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questionCount: number;
  formSchema: FormField[];
  antiCheatOptions: AntiCheatOptions;
  status: QuizStatus;
}

// ---------- Question ----------

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isVisible: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  body: string;
  points: number;
  orderNo: number;
  options: Record<string, unknown>;
  testCases?: TestCase[];
}

// ---------- Execution ----------

export type ExecutionStatus =
  | "Pending"
  | "Running"
  | "Passed"
  | "Failed"
  | "Error"
  | "TLE";

export interface ExecutionResult {
  jobId: string;
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
}

// ---------- Session ----------

export interface JoinQuizResponse {
  sessionToken: string;
  sessionId: string;
  quizId: string;
  endsAt: string;
  questions: Question[];
}

// ---------- Results / Replay ----------

export interface ReplayDiffEntry {
  timeMs: number;
  diff: string;
}

export interface ReplayData {
  submissionId: string;
  diffs: ReplayDiffEntry[];
}

export interface ParticipantResult {
  sessionId: string;
  formData: Record<string, unknown>;
  totalScore: number;
  maxScore: number;
  completedQuestions: number;
  submittedAt: string;
}

export interface QuestionStat {
  questionId: string;
  title: string;
  successRate: number;
}

export interface QuizResults {
  participantCount: number;
  avgScore: number;
  participants: ParticipantResult[];
  questionStats: QuestionStat[];
}

// ---------- Admin ----------

export interface AdminStats {
  totalUsers: number;
  activeQuizzes: number;
  dailyExecutions: number;
  last24hErrors: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: "Admin" | "User";
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminSession {
  id: string;
  quizId: string;
  quizTitle: string;
  formData: Record<string, unknown>;
  startedAt: string;
  endsAt: string;
  finishedAt?: string;
  isActive: boolean;
  isLocked: boolean;
}
