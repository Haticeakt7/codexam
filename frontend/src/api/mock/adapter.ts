import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import {
  DEMO_CREDENTIALS,
  DEMO_USERS,
  INITIAL_QUIZZES,
  DEMO_QUESTIONS,
  DEMO_SESSIONS,
  DEMO_RESULTS,
  DEMO_REPLAY,
  DEMO_ADMIN_STATS,
  DEMO_ADMIN_USERS,
} from "./seed";
import type { Quiz, Question, TestCase, AdminUser, AdminSession } from "@/api/types";

// ---------------------------------------------------------------------------
// Mutable in-memory state (reset on page reload)
// ---------------------------------------------------------------------------

let quizzes = structuredClone(INITIAL_QUIZZES) as Quiz[];
const questions = structuredClone(DEMO_QUESTIONS) as Record<string, Question[]>;
let adminUsers = structuredClone(DEMO_ADMIN_USERS) as AdminUser[];
let sessions = structuredClone(DEMO_SESSIONS) as AdminSession[];

// pending execution jobs: jobId → result ready after ~800ms
const pendingJobs = new Map<string, { readyAt: number; stdout: string }>();

let uidCounter = Date.now();
const uid = () => `demo-${(uidCounter++).toString(36)}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

function err(status: number, title: string): never {
  const e = Object.assign(new Error(title), {
    isAxiosError: true,
    response: {
      status,
      statusText: title,
      data: { type: "Demo", title, status },
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    },
  });
  throw e;
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try { return JSON.parse(config.data); } catch { return {}; }
  }
  return config.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

type Handler = (
  path: string,
  match: RegExpMatchArray,
  config: InternalAxiosRequestConfig,
) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const ROUTES: Route[] = [];

function route(method: string, pattern: RegExp, handler: Handler) {
  ROUTES.push({ method: method.toUpperCase(), pattern, handler });
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

route("POST", /^\/auth\/login$/, (_url, _m, config) => {
  const { email, password } = parseBody(config) as { email: string; password: string };
  const cred = DEMO_CREDENTIALS[email as keyof typeof DEMO_CREDENTIALS];
  if (!cred || cred.password !== password) err(401, "Geçersiz e-posta veya şifre.");
  const user = Object.values(DEMO_USERS).find((u) => u.id === cred.userId)!;
  return { accessToken: `demo-access-${user.id}`, refreshToken: `demo-refresh-${user.id}`, expiresIn: 3600, user };
});

route("POST", /^\/auth\/register$/, (_url, _m, config) => {
  const { email, displayName } = parseBody(config) as { email: string; displayName: string; password: string };
  const newUser = { id: uid(), email, displayName, role: "User" as const };
  adminUsers.push({ ...newUser, status: "active", createdAt: new Date().toISOString() });
  return { accessToken: `demo-access-${newUser.id}`, refreshToken: `demo-refresh-${newUser.id}`, expiresIn: 3600, user: newUser };
});

route("POST", /^\/auth\/refresh$/, (_url, _m, config) => {
  const { refreshToken } = parseBody(config) as { refreshToken: string };
  const userId = refreshToken?.replace("demo-refresh-", "") ?? "";
  const user = Object.values(DEMO_USERS).find((u) => u.id === userId) ?? DEMO_USERS.user;
  return { accessToken: `demo-access-${user.id}`, refreshToken, expiresIn: 3600, user };
});

route("GET", /^\/auth\/me$/, (_url, _m, config) => {
  const authHeader = (config.headers?.Authorization ?? "") as string;
  const userId = authHeader.replace("Bearer demo-access-", "");
  return Object.values(DEMO_USERS).find((u) => u.id === userId) ?? DEMO_USERS.user;
});

// ---------------------------------------------------------------------------
// Quiz routes
// ---------------------------------------------------------------------------

route("GET", /^\/quizzes$/, () => quizzes);

route("POST", /^\/quizzes$/, (_url, _m, config) => {
  const body = parseBody(config) as Partial<Quiz>;
  const q: Quiz = {
    id: uid(),
    title: (body.title as string) ?? "Yeni Sınav",
    description: body.description,
    durationMinutes: (body.durationMinutes as number) ?? 60,
    mode: (body.mode as Quiz["mode"]) ?? "FreeStyle",
    status: "Draft",
    antiCheatOptions: (body.antiCheatOptions as Quiz["antiCheatOptions"]) ?? { tabSwitch: false, fullscreen: false, clipboard: false },
    formSchema: (body.formSchema as Quiz["formSchema"]) ?? [],
    accessCode: body.accessCode,
    participantCount: 0,
    questionCount: 0,
    createdAt: new Date().toISOString(),
  };
  quizzes.push(q);
  questions[q.id] = [];
  return q;
});

route("GET", /^\/quizzes\/([^/]+)$/, (_url, m) => {
  const q = quizzes.find((x) => x.id === m[1]);
  if (!q) err(404, "Sınav bulunamadı.");
  return q;
});

route("PUT", /^\/quizzes\/([^/]+)$/, (_url, m, config) => {
  const idx = quizzes.findIndex((x) => x.id === m[1]);
  if (idx === -1) err(404, "Sınav bulunamadı.");
  quizzes[idx] = { ...quizzes[idx], ...parseBody(config) };
  return quizzes[idx];
});

route("DELETE", /^\/quizzes\/([^/]+)$/, (_url, m) => {
  quizzes = quizzes.filter((x) => x.id !== m[1]);
  return null;
});

route("POST", /^\/quizzes\/([^/]+)\/publish$/, (_url, m) => {
  const idx = quizzes.findIndex((x) => x.id === m[1]);
  if (idx === -1) err(404, "Sınav bulunamadı.");
  quizzes[idx] = { ...quizzes[idx], status: "Active", publishedAt: new Date().toISOString() };
  return quizzes[idx];
});

route("GET", /^\/quizzes\/([^/]+)\/info$/, (_url, m) => {
  const q = quizzes.find((x) => x.id === m[1]);
  if (!q) err(404, "Sınav bulunamadı.");
  return {
    id: q!.id,
    title: q!.title,
    description: q!.description,
    durationMinutes: q!.durationMinutes,
    questionCount: q!.questionCount,
    formSchema: q!.formSchema,
    antiCheatOptions: q!.antiCheatOptions,
    status: q!.status,
  };
});

// ---------------------------------------------------------------------------
// Question routes
// ---------------------------------------------------------------------------

route("GET", /^\/quizzes\/([^/]+)\/questions$/, (_url, m) => questions[m[1]] ?? []);

route("POST", /^\/quizzes\/([^/]+)\/questions$/, (_url, m, config) => {
  const body = parseBody(config) as Partial<Question>;
  if (!questions[m[1]]) questions[m[1]] = [];
  const q: Question = {
    id: uid(),
    type: (body.type as Question["type"]) ?? "Coding",
    title: (body.title as string) ?? "Yeni Soru",
    body: (body.body as string) ?? "",
    points: (body.points as number) ?? 10,
    orderNo: (body.orderNo as number) ?? questions[m[1]].length + 1,
    options: (body.options as Record<string, unknown>) ?? {},
    testCases: [],
  };
  questions[m[1]].push(q);
  const quiz = quizzes.find((x) => x.id === m[1]);
  if (quiz) quiz.questionCount = questions[m[1]].length;
  return q;
});

route("PUT", /^\/questions\/([^/]+)$/, (_url, m, config) => {
  for (const qs of Object.values(questions)) {
    const idx = qs.findIndex((q) => q.id === m[1]);
    if (idx !== -1) {
      qs[idx] = { ...qs[idx], ...parseBody(config) };
      return qs[idx];
    }
  }
  err(404, "Soru bulunamadı.");
});

route("DELETE", /^\/questions\/([^/]+)$/, (_url, m) => {
  for (const [qzId, qs] of Object.entries(questions)) {
    const idx = qs.findIndex((q) => q.id === m[1]);
    if (idx !== -1) {
      qs.splice(idx, 1);
      const quiz = quizzes.find((x) => x.id === qzId);
      if (quiz) quiz.questionCount = qs.length;
      return null;
    }
  }
  return null;
});

route("PATCH", /^\/questions\/([^/]+)\/order$/, (_url, m, config) => {
  const newOrder = parseBody(config) as number;
  for (const qs of Object.values(questions)) {
    const q = qs.find((x) => x.id === m[1]);
    if (q) { q.orderNo = newOrder; return q; }
  }
  return null;
});

// Test cases
route("GET", /^\/questions\/([^/]+)\/test-cases$/, (_url, m) => {
  for (const qs of Object.values(questions)) {
    const q = qs.find((x) => x.id === m[1]);
    if (q) return q.testCases ?? [];
  }
  return [];
});

route("POST", /^\/questions\/([^/]+)\/test-cases$/, (_url, m, config) => {
  const body = parseBody(config) as Partial<TestCase>;
  for (const qs of Object.values(questions)) {
    const q = qs.find((x) => x.id === m[1]);
    if (q) {
      if (!q.testCases) q.testCases = [];
      const tc: TestCase = { id: uid(), input: body.input ?? "", expectedOutput: body.expectedOutput ?? "", isVisible: body.isVisible ?? true };
      q.testCases.push(tc);
      return tc;
    }
  }
  err(404, "Soru bulunamadı.");
});

route("DELETE", /^\/questions\/([^/]+)\/test-cases\/([^/]+)$/, (_url, m) => {
  for (const qs of Object.values(questions)) {
    const q = qs.find((x) => x.id === m[1]);
    if (q && q.testCases) {
      q.testCases = q.testCases.filter((tc) => tc.id !== m[2]);
      return null;
    }
  }
  return null;
});

// ---------------------------------------------------------------------------
// Code execution routes
// ---------------------------------------------------------------------------

route("POST", /^\/execute$/, (_url, _m, config) => {
  const { code, language } = parseBody(config) as { code: string; language: string; stdin?: string };
  const jobId = uid();
  // Simulate output from the code (naive)
  let stdout = "Hello, World!\n";
  if (language === "python" && code.includes("print(")) {
    const match = code.match(/print\(["'](.+?)["']\)/);
    if (match) stdout = match[1] + "\n";
  }
  pendingJobs.set(jobId, { readyAt: Date.now() + 800, stdout });
  return { jobId };
});

route("GET", /^\/execute\/([^/]+)$/, (_url, m) => {
  const job = pendingJobs.get(m[1]);
  if (!job) return { jobId: m[1], status: "Error", stderr: "İş bulunamadı." };
  if (Date.now() < job.readyAt) return { jobId: m[1], status: "Running" };
  pendingJobs.delete(m[1]);
  return { jobId: m[1], status: "Passed", stdout: job.stdout, executionTimeMs: 42, memoryUsedKb: 1024 };
});

// ---------------------------------------------------------------------------
// Session routes
// ---------------------------------------------------------------------------

route("POST", /^\/quizzes\/([^/]+)\/join$/, (_url, m) => {
  const quiz = quizzes.find((x) => x.id === m[1]);
  if (!quiz) err(404, "Sınav bulunamadı.");
  if (quiz!.status !== "Active") err(400, "Sınav aktif değil.");
  const sessionId = uid();
  const sessionToken = `demo-sess-${sessionId}`;
  const endsAt = new Date(Date.now() + quiz!.durationMinutes * 60_000).toISOString();
  return {
    sessionToken,
    sessionId,
    quizId: m[1],
    endsAt,
    questions: (questions[m[1]] ?? []).map(({ testCases, ...q }) => ({
      ...q,
      testCases: (testCases ?? []).filter((tc) => tc.isVisible),
    })),
  };
});

route("POST", /^\/quizzes\/([^/]+)\/submit$/, () => null);
route("POST", /^\/quizzes\/([^/]+)\/event$/, () => null);

route("GET", /^\/quizzes\/([^/]+)\/sessions$/, (_url, m) =>
  sessions.filter((s) => s.quizId === m[1])
);

// ---------------------------------------------------------------------------
// Results & replay routes
// ---------------------------------------------------------------------------

route("GET", /^\/quizzes\/([^/]+)\/results$/, (_url, m) => {
  return DEMO_RESULTS[m[1]] ?? { participantCount: 0, avgScore: 0, participants: [], questionStats: [] };
});

route("GET", /^\/sessions\/([^/]+)\/replay$/, (_url, m) => {
  return DEMO_REPLAY[m[1]] ?? { submissionId: uid(), diffs: [] };
});

route("PATCH", /^\/submissions\/([^/]+)\/replay$/, () => null);

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

route("GET", /^\/admin\/stats$/, () => DEMO_ADMIN_STATS);

route("GET", /^\/admin\/users$/, () => adminUsers);

route("PUT", /^\/admin\/users\/([^/]+)$/, (_url, m, config) => {
  const idx = adminUsers.findIndex((u) => u.id === m[1]);
  if (idx === -1) err(404, "Kullanıcı bulunamadı.");
  adminUsers[idx] = { ...adminUsers[idx], ...parseBody(config) };
  return adminUsers[idx];
});

route("DELETE", /^\/admin\/users\/([^/]+)$/, (_url, m) => {
  adminUsers = adminUsers.filter((u) => u.id !== m[1]);
  return null;
});

route("GET", /^\/admin\/quizzes$/, () => quizzes);

route("DELETE", /^\/admin\/quizzes\/([^/]+)$/, (_url, m) => {
  quizzes = quizzes.filter((x) => x.id !== m[1]);
  return null;
});

route("GET", /^\/admin\/sessions$/, () => sessions);

route("DELETE", /^\/admin\/sessions\/([^/]+)$/, (_url, m) => {
  sessions = sessions.filter((s) => s.id !== m[1]);
  return null;
});

// ---------------------------------------------------------------------------
// The adapter itself
// ---------------------------------------------------------------------------

export function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return new Promise((resolve, reject) => {
    // Small artificial delay so loading states are visible
    setTimeout(() => {
      const method = (config.method ?? "GET").toUpperCase();
      const path = (config.url ?? "").split("?")[0];

      for (const r of ROUTES) {
        if (r.method !== method) continue;
        const m = path.match(r.pattern);
        if (!m) continue;
        try {
          const data = r.handler(path, m, config);
          resolve(ok(data));
        } catch (e) {
          reject(e);
        }
        return;
      }

      // No route matched
      const e = Object.assign(new Error(`[Demo] Unmapped route: ${method} ${path}`), {
        isAxiosError: true,
        response: ok({ type: "Demo", title: `No handler for ${method} ${path}`, status: 404 }, 404),
      });
      reject(e);
    }, 120);
  });
}
