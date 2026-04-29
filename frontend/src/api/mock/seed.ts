import type {
  AuthUser,
  Quiz,
  Question,
  TestCase,
  AdminUser,
  AdminSession,
  AdminStats,
  QuizResults,
  ReplayData,
} from "@/api/types";

export const DEMO_USERS = {
  admin: {
    id: "demo-admin-1",
    email: "admin@demo.com",
    displayName: "Demo Admin",
    role: "Admin" as const,
  } satisfies AuthUser,
  user: {
    id: "demo-user-1",
    email: "user@demo.com",
    displayName: "Demo Kullanıcı",
    role: "User" as const,
  } satisfies AuthUser,
};

export const DEMO_CREDENTIALS = {
  "admin@demo.com": { password: "demo1234", userId: "demo-admin-1" },
  "user@demo.com":  { password: "demo1234", userId: "demo-user-1" },
};

export const DEMO_QUIZ_IDS = {
  draft:  "quiz-demo-draft",
  active: "quiz-demo-active",
  ended:  "quiz-demo-ended",
};

export const DEMO_QUESTIONS: Record<string, Question[]> = {
  [DEMO_QUIZ_IDS.draft]: [
    {
      id: "q-draft-1",
      type: "Coding",
      title: "Fibonacci Dizisi",
      body: "n. Fibonacci sayısını döndüren bir fonksiyon yazın. (f(0)=0, f(1)=1)",
      points: 30,
      orderNo: 1,
      options: { starterCode: { python: "def fibonacci(n):\n    pass\n" } },
      testCases: [
        { id: "tc-d1-1", input: "0", expectedOutput: "0", isVisible: true },
        { id: "tc-d1-2", input: "5", expectedOutput: "5", isVisible: true },
        { id: "tc-d1-3", input: "10", expectedOutput: "55", isVisible: false },
      ] satisfies TestCase[],
    },
    {
      id: "q-draft-2",
      type: "MultipleChoice",
      title: "Python'da liste kavrama (list comprehension)",
      body: "Aşağıdakilerden hangisi `[x*2 for x in range(5)]` ifadesinin doğru çıktısıdır?",
      points: 10,
      orderNo: 2,
      options: {
        choices: [
          "[0, 1, 2, 3, 4]",
          "[0, 2, 4, 6, 8]",
          "[2, 4, 6, 8, 10]",
          "[1, 2, 3, 4, 5]",
        ],
        correctIndices: [1],
      },
      testCases: [],
    },
  ],
  [DEMO_QUIZ_IDS.active]: [
    {
      id: "q-active-1",
      type: "Coding",
      title: "İki Sayının Toplamı",
      body: "Girdi olarak verilen iki tam sayının toplamını stdout'a yazdırın.",
      points: 20,
      orderNo: 1,
      options: {
        starterCode: {
          python: "a, b = map(int, input().split())\n# kodunuzu buraya yazın\n",
          javascript: "const [a, b] = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\n// kodunuzu buraya yazın\n",
          cpp: "#include<iostream>\nusing namespace std;\nint main(){\n    int a, b;\n    cin >> a >> b;\n    // kodunuzu buraya yazın\n}\n",
        },
      },
      testCases: [
        { id: "tc-a1-1", input: "3 5",   expectedOutput: "8",  isVisible: true },
        { id: "tc-a1-2", input: "10 20", expectedOutput: "30", isVisible: true },
        { id: "tc-a1-3", input: "-1 1",  expectedOutput: "0",  isVisible: false },
      ] satisfies TestCase[],
    },
    {
      id: "q-active-2",
      type: "ShortAnswer",
      title: "Big-O Notasyonu",
      body: "Bir dizi içinde doğrusal arama (linear search) algoritmasının en kötü durum zaman karmaşıklığı nedir?",
      points: 10,
      orderNo: 2,
      options: { expectedAnswer: "O(n)" },
      testCases: [],
    },
    {
      id: "q-active-3",
      type: "OutputPrediction",
      title: "Python Çıktı Tahmini",
      body: "```python\nfor i in range(3):\n    print(i * i)\n```\nYukarıdaki kodun çıktısı nedir?",
      points: 10,
      orderNo: 3,
      options: { expectedOutput: "0\n1\n4" },
      testCases: [],
    },
  ],
  [DEMO_QUIZ_IDS.ended]: [
    {
      id: "q-ended-1",
      type: "Coding",
      title: "Palindrom Kontrolü",
      body: "Verilen bir stringin palindrom olup olmadığını kontrol eden bir fonksiyon yazın. Palindrom ise `True`, değilse `False` yazdırın.",
      points: 40,
      orderNo: 1,
      options: {
        starterCode: {
          python: "s = input()\n# kodunuzu buraya yazın\n",
        },
      },
      testCases: [
        { id: "tc-e1-1", input: "racecar", expectedOutput: "True",  isVisible: true },
        { id: "tc-e1-2", input: "hello",   expectedOutput: "False", isVisible: true },
        { id: "tc-e1-3", input: "madam",   expectedOutput: "True",  isVisible: false },
      ] satisfies TestCase[],
    },
    {
      id: "q-ended-2",
      type: "BugFix",
      title: "Hatalı Faktöriyel Fonksiyonu",
      body: "Aşağıdaki fonksiyondaki hatayı bulup düzeltin:\n```python\ndef factorial(n):\n    if n == 0:\n        return 0\n    return n * factorial(n - 1)\n```",
      points: 20,
      orderNo: 2,
      options: { bugLine: 3 },
      testCases: [
        { id: "tc-e2-1", input: "5",  expectedOutput: "120", isVisible: true },
        { id: "tc-e2-2", input: "0",  expectedOutput: "1",   isVisible: true },
      ] satisfies TestCase[],
    },
    {
      id: "q-ended-3",
      type: "MultipleChoice",
      title: "Veri Yapıları",
      body: "LIFO (Last In First Out) prensibiyle çalışan veri yapısı hangisidir?",
      points: 10,
      orderNo: 3,
      options: {
        choices: ["Queue", "Stack", "Linked List", "Binary Tree"],
        correctIndices: [1],
      },
      testCases: [],
    },
  ],
};

const now = new Date();
const past = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
const future = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: DEMO_QUIZ_IDS.draft,
    title: "Algoritma Temelleri (Taslak)",
    description: "Temel algoritma soruları — henüz yayınlanmadı.",
    durationMinutes: 45,
    mode: "FreeStyle",
    status: "Draft",
    antiCheatOptions: { tabSwitch: false, fullscreen: false, clipboard: false },
    formSchema: [
      { key: "name", label: "Ad Soyad", type: "text", required: true },
    ],
    accessCode: undefined,
    participantCount: 0,
    questionCount: 2,
    createdAt: past(72),
  },
  {
    id: DEMO_QUIZ_IDS.active,
    title: "Canlı Kodlama Sınavı",
    description: "Gerçek zamanlı moda aktif sınav. Katılımcılar şu anda giriyor.",
    durationMinutes: 60,
    mode: "RealTime",
    status: "Active",
    antiCheatOptions: { tabSwitch: true, fullscreen: true, clipboard: false },
    formSchema: [
      { key: "name",       label: "Ad Soyad",     type: "text",   required: true },
      { key: "studentId",  label: "Öğrenci No",   type: "text",   required: true },
      { key: "email",      label: "E-posta",       type: "email",  required: false },
    ],
    accessCode: "DEMO42",
    participantCount: 3,
    questionCount: 3,
    createdAt: past(48),
    publishedAt: past(1),
  },
  {
    id: DEMO_QUIZ_IDS.ended,
    title: "Veri Yapıları Finali",
    description: "Bitmiş sınav — sonuçları ve tekrarları görüntüleyebilirsiniz.",
    durationMinutes: 90,
    mode: "FreeStyle",
    status: "Ended",
    antiCheatOptions: { tabSwitch: true, fullscreen: false, clipboard: true },
    formSchema: [
      { key: "name",  label: "Ad Soyad",   type: "text",  required: true },
      { key: "dept",  label: "Bölüm",      type: "text",  required: true },
    ],
    accessCode: undefined,
    participantCount: 5,
    questionCount: 3,
    createdAt: past(168),
    publishedAt: past(96),
  },
];

export const DEMO_SESSIONS: AdminSession[] = [
  {
    id: "sess-active-1",
    quizId: DEMO_QUIZ_IDS.active,
    quizTitle: "Canlı Kodlama Sınavı",
    formData: { name: "Ahmet Yılmaz", studentId: "2021001", email: "ahmet@uni.edu" },
    startedAt: past(0.5),
    endsAt:    future(0.5),
    isActive: true,
    isLocked: false,
  },
  {
    id: "sess-active-2",
    quizId: DEMO_QUIZ_IDS.active,
    quizTitle: "Canlı Kodlama Sınavı",
    formData: { name: "Zeynep Kaya", studentId: "2021042" },
    startedAt: past(0.4),
    endsAt:    future(0.6),
    isActive: true,
    isLocked: false,
  },
  {
    id: "sess-active-3",
    quizId: DEMO_QUIZ_IDS.active,
    quizTitle: "Canlı Kodlama Sınavı",
    formData: { name: "Mehmet Demir", studentId: "2020098", email: "" },
    startedAt: past(0.3),
    endsAt:    future(0.7),
    isActive: true,
    isLocked: true,
  },
  {
    id: "sess-ended-1",
    quizId: DEMO_QUIZ_IDS.ended,
    quizTitle: "Veri Yapıları Finali",
    formData: { name: "Elif Şahin", dept: "Bilgisayar Mühendisliği" },
    startedAt: past(95),
    endsAt:    past(93.5),
    finishedAt: past(93.8),
    isActive: false,
    isLocked: false,
  },
  {
    id: "sess-ended-2",
    quizId: DEMO_QUIZ_IDS.ended,
    quizTitle: "Veri Yapıları Finali",
    formData: { name: "Burak Arslan", dept: "Yazılım Mühendisliği" },
    startedAt: past(95),
    endsAt:    past(93.5),
    finishedAt: past(94),
    isActive: false,
    isLocked: false,
  },
  {
    id: "sess-ended-3",
    quizId: DEMO_QUIZ_IDS.ended,
    quizTitle: "Veri Yapıları Finali",
    formData: { name: "Selin Öztürk", dept: "Bilgisayar Mühendisliği" },
    startedAt: past(95),
    endsAt:    past(93.5),
    finishedAt: past(93.6),
    isActive: false,
    isLocked: false,
  },
  {
    id: "sess-ended-4",
    quizId: DEMO_QUIZ_IDS.ended,
    quizTitle: "Veri Yapıları Finali",
    formData: { name: "Tolga Aydın", dept: "Elektrik-Elektronik" },
    startedAt: past(95),
    endsAt:    past(93.5),
    finishedAt: past(94.2),
    isActive: false,
    isLocked: false,
  },
  {
    id: "sess-ended-5",
    quizId: DEMO_QUIZ_IDS.ended,
    quizTitle: "Veri Yapıları Finali",
    formData: { name: "Ayşe Çelik", dept: "Bilgisayar Mühendisliği" },
    startedAt: past(95),
    endsAt:    past(93.5),
    finishedAt: past(93.7),
    isActive: false,
    isLocked: false,
  },
];

export const DEMO_RESULTS: Record<string, QuizResults> = {
  [DEMO_QUIZ_IDS.ended]: {
    participantCount: 5,
    avgScore: 52,
    participants: [
      { sessionId: "sess-ended-1", formData: { name: "Elif Şahin",  dept: "Bilgisayar Mühendisliği" }, totalScore: 70, maxScore: 70, completedQuestions: 3, submittedAt: past(93.8) },
      { sessionId: "sess-ended-2", formData: { name: "Burak Arslan", dept: "Yazılım Mühendisliği"  }, totalScore: 60, maxScore: 70, completedQuestions: 3, submittedAt: past(94)   },
      { sessionId: "sess-ended-3", formData: { name: "Selin Öztürk", dept: "Bilgisayar Mühendisliği"}, totalScore: 50, maxScore: 70, completedQuestions: 2, submittedAt: past(93.6) },
      { sessionId: "sess-ended-4", formData: { name: "Tolga Aydın",  dept: "Elektrik-Elektronik"  }, totalScore: 30, maxScore: 70, completedQuestions: 2, submittedAt: past(94.2) },
      { sessionId: "sess-ended-5", formData: { name: "Ayşe Çelik",   dept: "Bilgisayar Mühendisliği"}, totalScore: 50, maxScore: 70, completedQuestions: 3, submittedAt: past(93.7) },
    ],
    questionStats: [
      { questionId: "q-ended-1", title: "Palindrom Kontrolü",          successRate: 60 },
      { questionId: "q-ended-2", title: "Hatalı Faktöriyel Fonksiyonu", successRate: 40 },
      { questionId: "q-ended-3", title: "Veri Yapıları",               successRate: 80 },
    ],
  },
};

export const DEMO_REPLAY: Record<string, ReplayData> = {
  "sess-ended-1": {
    submissionId: "sub-e1-1",
    diffs: [
      { timeMs: 1000,  diff: "+s = input()" },
      { timeMs: 5000,  diff: "+print(s == s[::-1])" },
      { timeMs: 12000, diff: "-print(s == s[::-1])\n+result = s == s[::-1]\n+print(result)" },
    ],
  },
};

export const DEMO_ADMIN_STATS: AdminStats = {
  totalUsers:       8,
  activeQuizzes:    1,
  dailyExecutions:  42,
  last24hErrors:    2,
};

export const DEMO_ADMIN_USERS: AdminUser[] = [
  { id: "demo-admin-1", email: "admin@demo.com", displayName: "Demo Admin",          role: "Admin", status: "active", createdAt: past(720) },
  { id: "demo-user-1",  email: "user@demo.com",  displayName: "Demo Kullanıcı",      role: "User",  status: "active", createdAt: past(480) },
  { id: "demo-user-2",  email: "ahmet@uni.edu",  displayName: "Ahmet Yılmaz",        role: "User",  status: "active", createdAt: past(300) },
  { id: "demo-user-3",  email: "zeynep@uni.edu", displayName: "Zeynep Kaya",         role: "User",  status: "active", createdAt: past(240) },
  { id: "demo-user-4",  email: "mehmet@uni.edu", displayName: "Mehmet Demir",        role: "User",  status: "inactive", createdAt: past(200) },
  { id: "demo-user-5",  email: "elif@uni.edu",   displayName: "Elif Şahin",          role: "User",  status: "active", createdAt: past(168) },
  { id: "demo-user-6",  email: "burak@uni.edu",  displayName: "Burak Arslan",        role: "User",  status: "active", createdAt: past(120) },
  { id: "demo-user-7",  email: "selin@uni.edu",  displayName: "Selin Öztürk",        role: "User",  status: "active", createdAt: past(96)  },
];
