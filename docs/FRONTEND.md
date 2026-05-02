# CodExam – Frontend Dokümanı

> React 19 + TypeScript 6 + Vite 8 · TailwindCSS 3 · Monaco Editor · Zustand 5 · TanStack Query v5

---

## İçindekiler

1. [Tech Stack](#1-tech-stack)
2. [Klasör Yapısı](#2-klasör-yapısı)
3. [Routing ve Sayfa Haritası](#3-routing-ve-sayfa-haritası)
4. [Zustand Store Mimarisi](#4-zustand-store-mimarisi)
5. [Tema Sistemi](#5-tema-sistemi)
6. [i18n Sistemi](#6-i18n-sistemi)
7. [API Katmanı](#7-api-katmanı)
8. [SignalR Client](#8-signalr-client)
9. [Monaco Editör Entegrasyonu](#9-monaco-editör-entegrasyonu)
10. [Sayfa Detayları](#10-sayfa-detayları)
11. [Bileşen Kütüphanesi](#11-bileşen-kütüphanesi)
12. [Demo Modu](#12-demo-modu)

---

## 1. Tech Stack

| Paket | Versiyon | Kullanım |
|-------|----------|---------|
| `react` | 19.x | UI framework |
| `typescript` | 6.x | Tip güvenliği, strict mode |
| `vite` | 8.x | Build tool, HMR, dev server |
| `tailwindcss` | 3.x | Utility-first styling + CSS variable tema |
| `@monaco-editor/react` | latest | Kod editörü (Ana sayfa + Sınav) |
| `zustand` | 5.x | Global state (auth, editor, tema, i18n, toast) |
| `@tanstack/react-query` | v5 | Server state, caching, loading/error state |
| `react-router-dom` | v7 | Routing, korumalı rotalar, lazy loading |
| `axios` | latest | HTTP client, interceptor |
| `@microsoft/signalr` | latest | WebSocket / SignalR realtime |
| `i18next` | latest | i18n çekirdek |
| `react-i18next` | latest | React hook entegrasyonu (`useTranslation`) |
| `i18next-browser-languagedetector` | latest | Tarayıcı dilini otomatik algıla |
| `recharts` | latest | Sonuç grafiği (başarı oranı çubuk) |

**Geliştirme araçları:**

| Paket | Kullanım |
|-------|---------|
| `eslint` + `@typescript-eslint` | Linting |
| `prettier` | Kod formatlama |
| `@types/react`, `@types/node` | Tip tanımları |

---

## 2. Klasör Yapısı

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # Uygulama entry point, i18n init
│   ├── App.tsx                     # BrowserRouter, lazy routes, DemoBanner, Toaster
│   │
│   ├── routes/
│   │   ├── PrivateRoute.tsx        # JWT korumalı rota wrapper (roles prop)
│   │   └── GuestRoute.tsx          # Giriş yapmış kullanıcıyı yönlendir
│   │
│   ├── pages/                      # ⚠️ Tüm sayfalar iskelet — return null, tasarım yorum satırları
│   │   ├── Home/index.tsx          # Ana sayfa: Monaco editör + kod çalıştırma
│   │   ├── Auth/
│   │   │   ├── Login.tsx           # Giriş formu
│   │   │   └── Register.tsx        # Kayıt formu
│   │   ├── Quiz/
│   │   │   ├── QuizLanding.tsx     # /q/:id – katılım formu (useQuizInfo, useJoinQuiz)
│   │   │   └── QuizTake.tsx        # /q/:id/take – fullscreen sınav ekranı
│   │   ├── Dashboard/
│   │   │   ├── index.tsx           # Quiz listesi + aksiyonlar (useMyQuizzes)
│   │   │   ├── NewQuiz.tsx         # Quiz oluşturma formu (useCreateQuiz)
│   │   │   ├── QuizSettings.tsx    # Quiz ayarları (useUpdateQuiz, usePublishQuiz)
│   │   │   ├── QuizQuestions.tsx   # Soru yönetimi (useQuestions, useCreateQuestion)
│   │   │   ├── QuizMonitor.tsx     # Canlı izleme (SignalR, useActiveSessions)
│   │   │   ├── QuizResults.tsx     # Sonuçlar + grafik (useQuizResults)
│   │   │   └── SubmissionReplay.tsx # Replay oynatıcı (useReplay)
│   │   ├── Profile/index.tsx       # Profil + şifre değiştirme (useAuthStore)
│   │   ├── Admin/
│   │   │   ├── index.tsx           # Route container (Routes/Route gerçek implementasyon)
│   │   │   ├── AdminStats.tsx      # KPI dashboard (useAdminStats)
│   │   │   ├── AdminUsers.tsx      # Kullanıcı yönetimi (useAdminUsers)
│   │   │   ├── AdminQuizzes.tsx    # Tüm quizler (useAdminQuizzes)
│   │   │   ├── AdminSessions.tsx   # Tüm sessionlar (useAdminSessions)
│   │   │   └── AdminSystem.tsx     # Sistem logları (useAdminSystemLogs)
│   │   └── Error/
│   │       ├── NotFound.tsx        # 404
│   │       └── Forbidden.tsx       # 403
│   │
│   ├── components/
│   │   ├── layouts/                # ✅ Gerçek implementasyon + tasarım yorum satırları
│   │   │   ├── AppLayout.tsx       # Header (logo, dil, tema, auth nav) + children
│   │   │   ├── DashboardLayout.tsx # Sol sidebar (nav) + sağ içerik
│   │   │   ├── AdminLayout.tsx     # Sol sidebar (admin nav) + sağ içerik
│   │   │   └── ExamLayout.tsx      # h-screen: header + sidebar + editor + footer
│   │   └── ui/                     # ✅ Gerçek implementasyon + tasarım yorum satırları
│   │       ├── Button.tsx          # variant: primary|secondary|danger|ghost, loading
│   │       ├── Input.tsx           # label, error, helper, forwardRef
│   │       ├── Select.tsx          # options[], placeholder, forwardRef
│   │       ├── Textarea.tsx        # label, error, helper, resize-y, forwardRef
│   │       ├── Badge.tsx           # variant: default|success|danger|warning|info|muted
│   │       ├── Card.tsx + CardHeader.tsx
│   │       ├── Modal.tsx           # createPortal, Escape, backdrop, footer
│   │       ├── ConfirmDialog.tsx   # Modal üzerine onay/iptal ikili buton
│   │       ├── Table.tsx           # Generic<T>, columns, loading, emptyText
│   │       ├── EmptyState.tsx      # icon, title, description, action buton
│   │       ├── PageHeader.tsx      # title, subtitle, breadcrumbs, action
│   │       ├── Spinner.tsx         # size: sm|md|lg, animate-spin
│   │       ├── Toaster.tsx         # useToastStore → fixed bottom-4 right-4
│   │       └── DemoBanner.tsx      # VITE_DEMO_MODE=true iken amber bant
│   │
│   ├── stores/
│   │   ├── authStore.ts            # user, accessToken, isAuthenticated, logout
│   │   ├── editorStore.ts          # language, code, output, isRunning, STARTERS
│   │   ├── examStore.ts            # sessionToken, answers, antiCheatEvents, isLocked
│   │   ├── themeStore.ts           # uiTheme, monacoTheme, persist
│   │   ├── i18nStore.ts            # locale (tr|en), persist
│   │   └── toastStore.ts           # toast queue, add/dismiss
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # useLogin, useRegister, useMe, useLogout
│   │   ├── useQuizzes.ts           # useMyQuizzes, useQuizInfo, CRUD, useQuestions, useActiveSessions
│   │   ├── useSessions.ts          # useJoinQuiz, useSubmit, useLogEvent, useReplay
│   │   ├── useExecute.ts           # useRunCode (polling 1s interval)
│   │   └── useAdmin.ts             # useAdminStats, useAdminUsers, useAdminQuizzes, useAdminSessions, useAdminSystemLogs
│   │
│   ├── api/
│   │   ├── client.ts               # Axios instance, JWT interceptor, DEMO adapter
│   │   ├── types.ts                # Tüm TypeScript interface'leri
│   │   ├── auth.ts                 # POST login/register/refresh, GET me
│   │   ├── quizzes.ts              # Quiz CRUD + publish + info
│   │   ├── questions.ts            # Soru ve test case yönetimi
│   │   ├── sessions.ts             # Join, submit, logEvent, sessions
│   │   ├── submissions.ts          # Results, replay, appendReplayDiff
│   │   ├── execute.ts              # POST /execute + GET /execute/:jobId
│   │   ├── admin.ts                # Stats, users, quizzes, sessions
│   │   └── mock/
│   │       ├── seed.ts             # Demo seed verisi
│   │       └── adapter.ts          # Axios custom adapter (tüm endpoint'ler)
│   │
│   ├── locales/
│   │   ├── tr.json                 # Türkçe i18n keyleri
│   │   └── en.json                 # İngilizce i18n keyleri
│   │
│   └── styles/
│       └── globals.css             # CSS variable tema tokens, Tailwind directives
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── .env.demo                       # VITE_DEMO_MODE=true
├── Dockerfile                      # Production: node:20 builder + nginx:alpine
└── package.json
```

---

## 3. Routing ve Sayfa Haritası

### Route Tanımları

| Path | Bileşen | Erişim | Durum |
|------|---------|--------|-------|
| `/` | `Home/index.tsx` | Public | ⬜ İskelet |
| `/login` | `Auth/Login.tsx` | Guest only | ⬜ İskelet |
| `/register` | `Auth/Register.tsx` | Guest only | ⬜ İskelet |
| `/q/:id` | `Quiz/QuizLanding.tsx` | Public | ⬜ İskelet |
| `/q/:id/take` | `Quiz/QuizTake.tsx` | Session token | ⬜ İskelet |
| `/dashboard` | `Dashboard/index.tsx` | User / Admin | ⬜ İskelet |
| `/dashboard/new` | `Dashboard/NewQuiz.tsx` | User / Admin | ⬜ İskelet |
| `/dashboard/quiz/:id/settings` | `Dashboard/QuizSettings.tsx` | Owner / Admin | ⬜ İskelet |
| `/dashboard/quiz/:id/questions` | `Dashboard/QuizQuestions.tsx` | Owner / Admin | ⬜ İskelet |
| `/dashboard/quiz/:id/monitor` | `Dashboard/QuizMonitor.tsx` | Owner / Admin | ⬜ İskelet |
| `/dashboard/quiz/:id/results` | `Dashboard/QuizResults.tsx` | Owner / Admin | ⬜ İskelet |
| `/dashboard/quiz/:id/replay/:sessionId` | `Dashboard/SubmissionReplay.tsx` | Owner / Admin | ⬜ İskelet |
| `/profile` | `Profile/index.tsx` | User / Admin | ⬜ İskelet |
| `/admin` | `Admin/index.tsx` → Route container | Admin | ✅ Route JSX |
| `/admin` (index) | `Admin/AdminStats.tsx` | Admin | ⬜ İskelet |
| `/admin/users` | `Admin/AdminUsers.tsx` | Admin | ⬜ İskelet |
| `/admin/quizzes` | `Admin/AdminQuizzes.tsx` | Admin | ⬜ İskelet |
| `/admin/sessions` | `Admin/AdminSessions.tsx` | Admin | ⬜ İskelet |
| `/admin/system` | `Admin/AdminSystem.tsx` | Admin | ⬜ İskelet |
| `*` | `Error/NotFound.tsx` | Public | ⬜ İskelet |
| `/403` | `Error/Forbidden.tsx` | Public | ⬜ İskelet |

> **⬜ İskelet:** Sayfa dosyası mevcut, bağlantı noktaları (hook, store, SignalR) ve UI tasarımı (ASCII layout) yorum satırları ile belgelenmiş, `return null` placeholder ile bitiyor. UI implementasyonu Emir (designer) tarafından yapılacak.

### PrivateRoute Kullanımı

```tsx
// Sadece User veya Admin
<PrivateRoute roles={["User", "Admin"]}>
  <Dashboard />
</PrivateRoute>

// Sadece Admin
<PrivateRoute roles={["Admin"]}>
  <AdminPanel />
</PrivateRoute>
```

`PrivateRoute`: token yoksa `/login`'e yönlendirir; rol uyumsuzluğunda `/403`'e yönlendirir.

`GuestRoute`: giriş yapılmışsa rolüne göre `/dashboard` veya `/admin`'e yönlendirir.

---

## 4. Zustand Store Mimarisi

### 4.1 `authStore`

```ts
interface AuthState {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "Admin" | "User";
  } | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: AuthState["user"]) => void;
}
```

- Token `localStorage`'da saklanır (key: `codexam_token`)
- Zustand `persist` middleware ile hydrate edilir
- `logout()`: localStorage temizler, `/login`'e yönlendirir

### 4.2 `editorStore`

```ts
interface EditorState {
  language: "python" | "javascript" | "cpp";
  code: string;
  output: {
    stdout: string;
    stderr: string;
    status: ExecutionStatus;
    timeMs: number | null;
    memKb: number | null;
  } | null;
  isRunning: boolean;

  setLanguage: (lang: EditorState["language"]) => void;
  setCode: (code: string) => void;
  setOutput: (output: EditorState["output"]) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
}
```

- `language` değişince Monaco modeli güncellenir ve starter snippet set edilir
- `output` null iken çıktı paneli "Hazır" durumunda gösterilir

### 4.3 `examStore`

```ts
interface ExamState {
  sessionToken: string | null;
  sessionId: string | null;
  quizId: string | null;
  endsAt: string | null;             // ISO timestamp
  activeQuestionIndex: number;
  answers: Record<string, AnswerDraft>;  // questionId → draft
  antiCheatEvents: AntiCheatEvent[];
  isLocked: boolean;                 // monitor.terminate geldiğinde true

  setSession: (data: SessionData) => void;
  setActiveQuestion: (index: number) => void;
  updateAnswer: (questionId: string, draft: AnswerDraft) => void;
  addAntiCheatEvent: (event: AntiCheatEvent) => void;
  lock: () => void;
  clear: () => void;
}
```

- `sessionToken` localStorage'da saklanır (key: `codexam_session_<quizId>`)
- `endsAt` sunucudan gelir; `useExamTimer` hook'u bu değerden geri sayım hesaplar
- `isLocked = true` olduğunda submit butonları disabled edilir

### 4.4 `themeStore`

```ts
interface ThemeState {
  uiTheme: "light" | "dark";
  monacoTheme: "vs" | "vs-dark";

  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}
```

- Zustand `persist` middleware, localStorage key: `codexam_theme`
- `toggleTheme()` çağrıldığında:
  1. `uiTheme` güncellenir
  2. `document.documentElement.classList` toggle edilir (`dark`)
  3. `monacoTheme` senkronize edilir

### 4.5 `i18nStore`

```ts
interface I18nState {
  locale: "tr" | "en";
  setLocale: (locale: "tr" | "en") => void;
}
```

- Zustand `persist`, localStorage key: `codexam_locale`
- `setLocale()` çağrıldığında `i18next.changeLanguage()` tetiklenir
- İlk yüklemede `i18next-browser-languagedetector` çalışır; sonuç `i18nStore` ile senkronize edilir

---

## 5. Tema Sistemi

### CSS Variable Tanımları (`globals.css`)

```css
:root {
  --color-bg:          #ffffff;
  --color-surface:     #f8fafc;
  --color-surface-2:   #f1f5f9;
  --color-border:      #e2e8f0;
  --color-primary:     #6366f1;   /* indigo-500 */
  --color-primary-hover: #4f46e5;
  --color-text:        #0f172a;
  --color-text-muted:  #64748b;
  --color-danger:      #ef4444;
  --color-success:     #22c55e;
  --color-warning:     #f59e0b;
}

.dark {
  --color-bg:          #0f172a;
  --color-surface:     #1e293b;
  --color-surface-2:   #334155;
  --color-border:      #475569;
  --color-text:        #f8fafc;
  --color-text-muted:  #94a3b8;
}
```

### Tailwind Konfigürasyonu (`tailwind.config.ts`)

```ts
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:       "var(--color-bg)",
        surface:  "var(--color-surface)",
        surface2: "var(--color-surface-2)",
        border:   "var(--color-border)",
        primary:  "var(--color-primary)",
        text:     "var(--color-text)",
        muted:    "var(--color-text-muted)",
      },
    },
  },
}
```

Kullanım: `bg-bg`, `text-text`, `border-border`, `bg-primary` gibi kısayollar.

### Monaco ↔ UI Tema Senkronizasyonu

`themeStore` tetiklendiğinde Monaco editör instance'ına `editor.setTheme()` çağrılır.
`monacoTheme` değerleri: `"vs"` (light) ve `"vs-dark"` (dark).

---

## 6. i18n Sistemi

### Kurulum (`src/main.tsx`)

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { tr: { translation: tr }, en: { translation: en } },
    fallbackLng: "tr",
    interpolation: { escapeValue: false },
  });
```

### Locale Dosya Yapısı (`locales/tr.json`)

```json
{
  "common": {
    "run": "Çalıştır",
    "submit": "Gönder",
    "save": "Kaydet",
    "cancel": "İptal",
    "delete": "Sil",
    "edit": "Düzenle",
    "loading": "Yükleniyor...",
    "error": "Hata oluştu",
    "success": "Başarılı"
  },
  "nav": {
    "login": "Giriş Yap",
    "logout": "Çıkış",
    "dashboard": "Panel",
    "admin": "Admin"
  },
  "home": {
    "title": "Kod Editörü",
    "language": "Dil seçin",
    "output": "Çıktı",
    "execTime": "Süre",
    "memory": "Bellek"
  },
  "quiz": { ... },
  "exam": { ... },
  "dashboard": { ... },
  "admin": { ... },
  "error": { ... }
}
```

### Kullanım

```tsx
import { useTranslation } from "react-i18next";
const { t } = useTranslation();
<button>{t("common.run")}</button>
```

---

## 7. API Katmanı

### Axios Instance (`api/client.ts`)

```ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 15_000,
});

// Request interceptor: JWT token ekle
client.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Session token gerektiğinde
  const sessionToken = examStore.getState().sessionToken;
  if (sessionToken) config.headers["X-Session-Token"] = sessionToken;

  return config;
});

// Response interceptor: 401 → refresh → retry
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await authStore.getState().refreshToken();
      return client(error.config);
    }
    return Promise.reject(error);
  }
);
```

### TanStack Query Kullanımı

```ts
// api/quiz.ts
export const useQuizzes = () =>
  useQuery({
    queryKey: ["quizzes"],
    queryFn: () => client.get<Quiz[]>("/quizzes").then((r) => r.data),
    staleTime: 30_000,
  });

export const useCreateQuiz = () =>
  useMutation({
    mutationFn: (data: CreateQuizDto) => client.post("/quizzes", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });
```

### Kod Çalıştırma (Polling)

```ts
// 1. Job enqueue
const { jobId } = await client.post("/execute", { language, code }).then(r => r.data);

// 2. Poll until done (500ms interval, max 30s)
const result = await pollExecution(jobId);
```

---

## 8. SignalR Client

### Bağlantı Kurulumu (`hooks/useSignalR.ts`)

```ts
const connection = new HubConnectionBuilder()
  .withUrl("/hubs/monitor", {
    accessTokenFactory: () => authStore.getState().accessToken ?? "",
    // Anonim katılımcı için query param
    // .withUrl(`/hubs/monitor?token=${sessionToken}`)
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .configureLogging(LogLevel.Warning)
  .build();
```

### Sınav Ekranı (`QuizTake`) Event'leri

| Yön | Event | Veri | Açıklama |
|-----|-------|------|---------|
| Client → Server | `session.codeChanged` | `{ questionId, code }` | Monaco onChange, 2sn debounce |
| Client → Server | `session.heartbeat` | `{ sessionId }` | 10sn interval |
| Server → Client | `monitor.warn` | `{ message }` | Quiz sahibinden uyarı |
| Server → Client | `monitor.terminate` | — | Sınavdan düşür |

### Monitor Ekranı (`QuizMonitor`) Event'leri

| Yön | Event | Veri | Açıklama |
|-----|-------|------|---------|
| Server → Client | `session.codeChanged` | `{ sessionId, questionId, code }` | Katılımcı kodu güncelledi |
| Server → Client | `session.heartbeat` | `{ sessionId, timestamp }` | Katılımcı aktif |
| Server → Client | `session.event` | `{ sessionId, eventType, severity }` | Anti-cheat event |
| Server → Client | `session.joined` | `{ sessionId, formData }` | Yeni katılımcı |
| Client → Server | `monitor.warn` | `{ sessionId, message }` | Katılımcıya uyarı gönder |
| Client → Server | `monitor.terminate` | `{ sessionId }` | Katılımcıyı düşür |

---

## 9. Monaco Editör Entegrasyonu

### CodeEditor Bileşeni

```tsx
<Editor
  height="100%"
  language={monacoLanguage}   // "python" | "javascript" | "cpp"
  value={code}
  theme={monacoTheme}         // themeStore'dan "vs" | "vs-dark"
  options={{
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
  }}
  onChange={(value) => editorStore.getState().setCode(value ?? "")}
  onMount={(editor) => {
    editorRef.current = editor;
  }}
/>
```

### Dil → Monaco Language Mapping

| Seçenek | Monaco dili |
|---------|------------|
| `python` | `python` |
| `javascript` | `javascript` |
| `cpp` | `cpp` |

### Starter Snippet'ler

```ts
const STARTERS: Record<Language, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
};
```

### Replay Modu

Replay ekranında Monaco `readOnly: true` olarak açılır. Diff animasyonu için `editor.executeEdits()` kullanılır:

```ts
editor.executeEdits("replay", [
  { range: editor.getModel()!.getFullModelRange(), text: newCode }
]);
```

---

## 10. Sayfa Detayları

> **Not:** Tüm sayfa dosyaları şu anda iskelet (`return null`) aşamasındadır. Her sayfa dosyasının başında; bağlantı noktaları (hook'lar, store'lar, SignalR event'leri), local state, action flow ve ASCII layout diyagramı yorum satırları olarak belgelenmiştir. Bu bölümdeki ASCII şemaları ve akış açıklamaları, sayfaların **hedeflenen** davranışını tanımlamaktadır.

### 10.1 Ana Sayfa (`/`)

```
┌──────────────────────────────────────────────────────────────────┐
│  CodExam  [🌐 TR▾]  [☀️▾]  [Python▾]  [▶ Çalıştır]  [Giriş]  │
├───────────────────────────┬──────────────────────────────────────┤
│                           │  Çıktı                               │
│   Monaco Editor           │  ─────────────────────────────────── │
│   (editorStore.code)      │  > Hello, World!                     │
│                           │                                       │
│                           │  Execution Bilgisi                   │
│                           │  Süre: 42ms · Bellek: 8 MB           │
└───────────────────────────┴──────────────────────────────────────┘
```

- Dil değiştirildiğinde editör içeriği starter snippet ile güncellenir
- Run tıklandığında: spinner göster → `POST /api/execute` → polling → sonuç
- Stderr varsa kırmızı panel; TLE için özel mesaj

### 10.2 Quiz Katılım Sayfası (`/q/:id`)

- `GET /api/quizzes/:id/info` ile quiz bilgisi yükle
- Quiz `status !== "Active"` ise "Quiz henüz yayınlanmadı" göster
- `form_schema` JSONB'den dinamik form render:
  - `type: "text"` → `<input type="text" />`
  - `type: "number"` → `<input type="number" />`
  - `required: true` → submit öncesi validasyon
- Submit → `POST /api/quizzes/:id/join` → `sessionToken` localStorage'a → `/q/:id/take`

### 10.3 Sınav Ekranı (`/q/:id/take`)

- localStorage'da sessionToken yoksa `/q/:id`'ye yönlendir
- Sayfa yüklenince `requestFullscreen()` çağır
- `useExamTimer(endsAt)`: sunucu saatiyle senkron geri sayım, `endsAt` geçince kilitle
- `useAntiCheat()`: tab switch, fullscreen exit, clipboard paste → `POST /api/quizzes/:id/event`
- `beforeunload` event'i ile "Sayfadan çıkmak istediğinize emin misiniz?" uyarısı
- Soru tiplerine göre render:
  - `Coding`: Monaco editörü + Çalıştır + Gönder butonları
  - `MultipleChoice`: Radio/Checkbox listesi
  - `OutputPrediction`: Readonly kod bloğu + text input
  - `BugFix`: Monaco editörü (başlangıç hatalı kod ile)
  - `ShortAnswer`: Tek satır text input

### 10.4 Canlı Monitor (`/dashboard/quizzes/:id/monitor`)

- Sayfa ilk yüklenince `GET /api/quizzes/:id/sessions/active` → katılımcı listesi
- SignalR `quiz:{quizId}` grubuna bağlan
- `session.joined` → yeni kart ekle
- `session.codeChanged` → kartı güncelle, son kod snapshot'ı sakla
- `session.event` → badge sayacını artır; `severity === "High"` → kart kırmızıya döner
- Karta tıklama → yan panel açılır → readonly Monaco ile anlık kod gösterilir
- [Uyarı Gönder] modal → metin gir → `monitor.warn` gönder
- [Sınavdan Düşür] confirm dialog → `monitor.terminate` gönder

### 10.5 Replay Ekranı

- `GET /api/sessions/:sessionId/replay` → diff array yükle
- Timeline: `0` → `toplam_süre_ms`
- Play: 100ms interval, her adımda bir diff uygula
- Hız: 0.5x / 1x / 2x
- Anti-cheat event'leri timeline üzerinde renkli nokta olarak gösterilir (kırmızı = High)

---

## 11. Bileşen Kütüphanesi

### Ortak UI Bileşenleri

Tüm bileşenler `src/components/ui/` altında gerçek implementasyona sahiptir. Her dosyanın başına designer için tasarım yorum satırları eklenmiştir.

| Bileşen | Ana Props | Açıklama |
|---------|-----------|---------|
| `Button` | `variant`, `size`, `loading`, `leftIcon` | primary/secondary/danger/ghost varyantlar |
| `Input` | `label`, `error`, `helper`, forwardRef | Form input, hata/helper mesajı |
| `Select` | `options[]`, `placeholder`, `error`, forwardRef | Dropdown |
| `Textarea` | `label`, `error`, `helper`, forwardRef | Çok satırlı, resize-y |
| `Badge` | `variant` | default/success/danger/warning/info/muted |
| `Card` + `CardHeader` | `padding`, `title`, `action` | İçerik kutusu + başlık satırı |
| `Modal` | `open`, `onClose`, `title`, `size`, `footer` | createPortal, Escape, backdrop |
| `ConfirmDialog` | `onConfirm`, `danger`, `loading` | Modal üzerine onay ikili buton |
| `Table<T>` | `columns`, `data`, `keyExtractor`, `loading`, `emptyText` | Generic veri tablosu |
| `EmptyState` | `icon`, `title`, `description`, `action` | Boş liste durumu |
| `PageHeader` | `title`, `subtitle`, `breadcrumbs`, `action` | Sayfa üst başlık |
| `Spinner` | `size` (sm/md/lg) | animate-spin, role="status" |
| `Toaster` | — | useToastStore'dan otomatik, fixed bottom-4 right-4 |
| `DemoBanner` | — | VITE_DEMO_MODE=true iken görünür, App.tsx'te global |

### Toast Kullanımı

```ts
import { useToastStore } from "@/stores/toastStore";
const { add } = useToastStore();
add({ type: "success", message: "Quiz başarıyla oluşturuldu" });
add({ type: "error",   message: "Bir hata oluştu" });
add({ type: "warning", message: "Sınav süresi dolmak üzere" });
add({ type: "info",    message: "Bağlantı yeniden kuruldu" });
```

Toast'lar `fixed bottom-4 right-4`, stacking, `dismiss(id)` ile manuel kapat.

### EmptyState Kullanımı

```tsx
<EmptyState
  icon="📋"
  title={t("dashboard.noQuizzes")}
  description={t("dashboard.noQuizzesDesc")}
  action={{ label: t("dashboard.createFirst"), onClick: () => navigate("/dashboard/new") }}
/>
```

---

## 12. Demo Modu

Backend olmadan, seed verisi üzerinden çalışan tam demo ortamı. Sunum, geliştirme ve UI testi için kullanılır.

### Başlatma

```bash
cd frontend

# Demo mod (seed data ile)
npm run dev:demo

# Normal mod (backend gerektirir)
npm run dev

# Demo build (statik dosya)
npm run build:demo
```

Ortam değişkeni olarak da verilebilir:
```bash
VITE_DEMO_MODE=true npm run dev
```

### Demo Kimlik Bilgileri

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | `admin@demo.com` | `demo1234` |
| Kullanıcı | `user@demo.com` | `demo1234` |

### Seed Verisi

| Veri | Adet | Açıklama |
|------|------|---------|
| Kullanıcı | 8 | 1 Admin + 7 User |
| Quiz | 3 | Draft / Active / Ended |
| Soru | 8 | Coding, MultipleChoice, ShortAnswer, OutputPrediction, BugFix tipleri |
| Session | 8 | 3 aktif (Active quizde) + 5 bitmiş (Ended quizde) |
| Sonuç | 5 | Ended quiz için katılımcı puanları |
| Replay | 1 | sess-ended-1 için diff array |

### Mimari

```
VITE_DEMO_MODE=true
       │
       ▼
src/api/client.ts
  → adapter: mockAdapter   (src/api/mock/adapter.ts)
       │
       ├── Tüm GET/POST/PUT/DELETE/PATCH isteklerini karşılar
       ├── In-memory mutable state (quiz/soru/kullanıcı CRUD çalışır)
       ├── 120ms yapay gecikme (yükleme state'leri görünür)
       └── Seed verisi: src/api/mock/seed.ts
```

### Nasıl Çalışır

`VITE_DEMO_MODE=true` olduğunda Axios, gerçek HTTP isteği atmak yerine `mockAdapter` fonksiyonunu çağırır. Adapter, URL pattern'ini (`RegExp`) ve HTTP metodunu eşleştirerek uygun handler'ı çalıştırır ve sahte bir `AxiosResponse` döndürür.

Mutasyonlar (quiz oluştur, kullanıcı sil, vb.) sayfa reload'a kadar in-memory state üzerinde gerçekten uygulanır.

Kod execution mock'u: `POST /execute` → anında `{ jobId }` döner; `GET /execute/:jobId` 800ms sonra `"Passed"` döner (useExecute polling hook'u ile uyumlu).

### Dosyalar

| Dosya | Açıklama |
|-------|---------|
| `src/api/mock/seed.ts` | Tüm statik seed verisi |
| `src/api/mock/adapter.ts` | Axios adapter + tüm route handler'ları |
| `src/components/ui/DemoBanner.tsx` | Ekranın altındaki amber renkli demo bildirimi |
| `.env.demo` | `VITE_DEMO_MODE=true` (Vite `--mode demo` ile okunur) |
