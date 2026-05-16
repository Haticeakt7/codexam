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

export type QuizStatus   = "Draft" | "Published" | "Active" | "Ended" | "Archived";
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
  isIdentity?: boolean;
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
  participationToken: string;
  participantCount: number;
  questionCount: number;
  createdAt: string;
  publishedAt?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface QuizInfo {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questionCount: number;
  mode: QuizMode;
  formSchema: FormField[];
  antiCheatOptions: AntiCheatOptions;
  status: QuizStatus;
  startsAt?: string;
  endsAt?: string;
}

// ---------- Question ----------

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isVisible: boolean;
}

/** Stable choice object used in MCQ questions (new schema) */
export interface McqChoice {
  id: string;
  text: string;
}

// Per-type option shapes (used for type-safe access in components)
export interface CodingOptions {
  allowedLanguages?: string[];
  starterCode?: string;
}
export interface McqOptions {
  choices: McqChoice[];
  correctIds: string[];
  multiSelect?: boolean;
}
export interface OutputPredictionOptions {
  codeBlock: string;
  codeLanguage?: string;
  expectedOutput?: string;
  matchMode?: "trimmed" | "ignoreWhitespace" | "exact";
}
export interface BugFixOptions {
  buggyCode?: string;
  correctCode?: string;
  codeLanguage?: string;
}
export interface ShortAnswerOptions {
  acceptedAnswers?: string[];
  matchMode?: "exact" | "exactIgnoreCase" | "contains";
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

export interface SupportedLanguage {
  id: string;
  label: string;
  monacoLanguage: string;
  defaultCode: string;
}

// ---------- Session ----------

export interface SubmitResponse {
  submissionId: string;
  score: number;
  maxScore: number;
  /** "Passed" | "Failed" | "Pending" */
  status: string;
  /** false for Coding/BugFix — graded asynchronously */
  isGraded: boolean;
}

export interface JoinQuizResponse {
  sessionToken: string;
  sessionId: string;
  quizId: string;
  endsAt: string;
  questions: Question[];
}

// ---------- User Preferences ----------

export interface UserPreferences {
  editorTheme: string;   // "vs" | "vs-dark" | "hc-black"
  fontSize: number;      // 8–32
  layoutJson: string;    // JSON string for panel layout
}

// ---------- Session Submissions (participant answer detail) ----------

export interface SessionSubmission {
  submissionId: string;
  questionId: string;
  questionTitle: string;
  questionType: string;
  questionPoints: number;
  language: string;
  code: string;
  score: number;
  status: string;
  submittedAt: string;
  hasReplay: boolean;
}

export interface SessionSubmissionsResponse {
  sessionId: string;
  formData: Record<string, unknown>;
  submissions: SessionSubmission[];
}

// ---------- Results / Replay ----------

export interface ReplayDiffEntry {
  timeMs: number;
  diff: string;
}

export interface ReplayQuestionEntry {
  submissionId: string;
  questionId: string;
  questionTitle: string;
  questionType: string;
  orderNo: number;
  diffs: ReplayDiffEntry[];
}

export interface ReplayData {
  submissionId: string;
  diffs: ReplayDiffEntry[];
  questions: ReplayQuestionEntry[];
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

export interface AdminSessionEvent {
  eventType: string;
  severity: string;
  timestamp: string;
  message?: string;
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
  totalScore: number;
  antiCheatEventCount: number;
  antiCheatEvents: AdminSessionEvent[];
  warnings: AdminSessionEvent[];
  // live fields (populated via SignalR)
  latestCode?: string;
  latestLanguage?: string;
  currentQuestionIndex?: number;
}

export interface FinishResponse {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  finishedAt: string;
  submittedQuestions: number;
}

export interface AdminUserSession {
  userId: string;
  email: string;
  displayName: string;
  role: "Admin" | "User";
  sessionExpiresAt: string;
}

export interface SystemLog {
  id: string;
  sourceService: string;
  errorTitle: string;
  errorMessage: string;
  stackTrace?: string;
  createdAt: string;
}
