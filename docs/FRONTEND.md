# CodExam – Frontend Dokümanı

> React 18 + TypeScript 5 + Vite 5 · TailwindCSS 3 · Monaco Editor · Zustand · TanStack Query v5

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

---

## 1. Tech Stack

| Paket | Versiyon | Kullanım |
|-------|----------|---------|
| `react` | 18.x | UI framework |
| `typescript` | 5.x | Tip güvenliği, strict mode |
| `vite` | 5.x | Build tool, HMR, dev server |
| `tailwindcss` | 3.x | Utility-first styling + CSS variable tema |
| `@monaco-editor/react` | latest | Kod editörü (Ana sayfa + Sınav) |
| `zustand` | latest | Global state (auth, editor, tema, i18n) |
| `@tanstack/react-query` | v5 | Server state, caching, loading/error state |
| `react-router-dom` | v6 | Routing, korumalı rotalar, lazy loading |
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
│   ├── main.tsx                    # Uygulama entry point
│   ├── App.tsx                     # Router, QueryClientProvider, i18n, tema
│   │
│   ├── routes/
│   │   ├── index.tsx               # Tüm route tanımları
│   │   ├── PrivateRoute.tsx        # JWT korumalı rota wrapper
│   │   └── GuestRoute.tsx          # Giriş yapmış kullanıcıyı yönlendir
│   │
│   ├── pages/
│   │   ├── Home/
│   │   │   └── index.tsx           # Ana sayfa: kod editörü
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Quiz/
│   │   │   ├── QuizLanding.tsx     # /q/:id – katılım formu
│   │   │   └── QuizTake.tsx        # /q/:id/take – sınav ekranı
│   │   ├── Dashboard/
│   │   │   ├── index.tsx           # Dashboard ana
│   │   │   ├── QuizList.tsx        # Quiz listesi
│   │   │   ├── QuizCreate.tsx      # Yeni quiz oluştur
│   │   │   ├── QuizEdit.tsx        # Quiz düzenle
│   │   │   ├── QuizQuestions.tsx   # Soru yönetimi
│   │   │   ├── QuizMonitor.tsx     # Canlı izleme
│   │   │   ├── QuizResults.tsx     # Sonuçlar tablosu
│   │   │   ├── SessionDetail.tsx   # Tek katılımcı detayı
│   │   │   ├── Replay.tsx          # Submission replay ekranı
│   │   │   └── Profile.tsx
│   │   ├── Admin/
│   │   │   ├── index.tsx           # Admin dashboard
│   │   │   ├── Users.tsx
│   │   │   ├── Quizzes.tsx
│   │   │   ├── Sessions.tsx
│   │   │   └── SystemLogs.tsx
│   │   └── Error/
│   │       ├── NotFound.tsx        # 404
│   │       ├── Forbidden.tsx       # 403
│   │       └── ServerError.tsx     # 500
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx         # Dashboard/Admin sol menü
│   │   │   └── PageWrapper.tsx
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx      # Monaco wrapper
│   │   │   ├── OutputPanel.tsx     # Stdout/stderr/stats
│   │   │   └── LanguageSelect.tsx
│   │   ├── quiz/
│   │   │   ├── QuestionForm/
│   │   │   │   ├── CodingForm.tsx
│   │   │   │   ├── MultipleChoiceForm.tsx
│   │   │   │   ├── OutputPredictionForm.tsx
│   │   │   │   ├── BugFixForm.tsx
│   │   │   │   └── ShortAnswerForm.tsx
│   │   │   ├── TestCaseList.tsx
│   │   │   ├── FormSchemaEditor.tsx  # Katılımcı form şema editörü
│   │   │   ├── AntiCheatOptions.tsx
│   │   │   └── QuizStatusBadge.tsx
│   │   ├── monitor/
│   │   │   ├── ParticipantCard.tsx
│   │   │   ├── ParticipantGrid.tsx
│   │   │   └── LiveCodePanel.tsx
│   │   ├── replay/
│   │   │   ├── ReplayPlayer.tsx
│   │   │   └── TimelineSlider.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Spinner.tsx
│   │       ├── Badge.tsx
│   │       ├── Table.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── editorStore.ts
│   │   ├── examStore.ts
│   │   ├── themeStore.ts
│   │   └── i18nStore.ts
│   │
│   ├── hooks/
│   │   ├── useAntiCheat.ts         # Tab/fullscreen/clipboard izleme
│   │   ├── useExamTimer.ts         # Sunucu senkronlu geri sayım
│   │   ├── useSignalR.ts           # SignalR bağlantı yönetimi
│   │   └── useToast.ts
│   │
│   ├── api/
│   │   ├── client.ts               # Axios instance + interceptor
│   │   ├── auth.ts                 # Auth endpoint'leri
│   │   ├── execute.ts              # Kod çalıştırma
│   │   ├── quiz.ts                 # Quiz CRUD
│   │   ├── questions.ts            # Soru yönetimi
│   │   ├── sessions.ts             # Session yönetimi
│   │   ├── admin.ts                # Admin endpoint'leri
│   │   └── types.ts                # API DTO tipleri
│   │
│   ├── locales/
│   │   ├── tr.json
│   │   └── en.json
│   │
│   ├── styles/
│   │   ├── globals.css             # CSS variable tanımları, Tailwind directives
│   │   └── monaco-themes.ts        # Monaco tema konfigürasyonu
│   │
│   └── utils/
│       ├── diff.ts                 # Diff hesaplama (replay için)
│       ├── format.ts               # Tarih, süre formatlama
│       └── validation.ts           # Client-side yardımcı validasyon
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

---

## 3. Routing ve Sayfa Haritası

### Route Tanımları

| Path | Bileşen | Erişim | Açıklama |
|------|---------|--------|---------|
| `/` | `Home` | Public | Ana sayfa – anonim kod editörü |
| `/login` | `Login` | Guest only | Giriş ekranı |
| `/register` | `Register` | Guest only | Kayıt ekranı |
| `/q/:id` | `QuizLanding` | Public | Quiz katılım sayfası |
| `/q/:id/take` | `QuizTake` | Session token | Sınav ekranı |
| `/dashboard` | `Dashboard` | User / Admin | Dashboard ana |
| `/dashboard/quizzes` | `QuizList` | User / Admin | Quiz listesi |
| `/dashboard/quizzes/new` | `QuizCreate` | User / Admin | Yeni quiz |
| `/dashboard/quizzes/:id` | `QuizEdit` | Owner / Admin | Quiz düzenle |
| `/dashboard/quizzes/:id/questions` | `QuizQuestions` | Owner / Admin | Soru yönetimi |
| `/dashboard/quizzes/:id/monitor` | `QuizMonitor` | Owner / Admin | Canlı izleme |
| `/dashboard/quizzes/:id/results` | `QuizResults` | Owner / Admin | Sonuçlar |
| `/dashboard/quizzes/:id/results/:sessionId` | `SessionDetail` | Owner / Admin | Katılımcı detayı |
| `/dashboard/quizzes/:id/results/:sessionId/replay` | `Replay` | Owner / Admin | Replay izle |
| `/profile` | `Profile` | User / Admin | Profil |
| `/admin` | `AdminDashboard` | Admin | Admin panel |
| `/admin/users` | `AdminUsers` | Admin | Kullanıcı yönetimi |
| `/admin/quizzes` | `AdminQuizzes` | Admin | Tüm quizler |
| `/admin/sessions` | `AdminSessions` | Admin | Tüm sessionlar |
| `/admin/system` | `AdminSystemLogs` | Admin | Sistem logları |
| `*` | `NotFound` | Public | 404 |

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

| Bileşen | Props | Açıklama |
|---------|-------|---------|
| `Button` | `variant`, `size`, `loading`, `disabled` | Primary / secondary / danger |
| `Input` | `label`, `error`, `hint` | Form input, hata gösterimi |
| `Select` | `options`, `value`, `onChange` | Dropdown |
| `Modal` | `open`, `onClose`, `title` | Overlay modal |
| `Toast` | `type`, `message`, `duration` | Başarı / hata / uyarı |
| `Spinner` | `size` | Loading indicator |
| `Badge` | `color` | Durum badge (Aktif/Taslak/Bitti) |
| `Table` | `columns`, `data`, `pagination` | Veri tablosu |
| `EmptyState` | `icon`, `title`, `description`, `action` | Boş liste durumu |
| `ErrorBoundary` | `fallback` | React hata sınırı |

### Toast Sistemi

```ts
const { toast } = useToast();
toast.success("Quiz başarıyla oluşturuldu");
toast.error("Bir hata oluştu");
toast.warning("Sınav süresi dolmak üzere");
```

Toastlar `fixed bottom-4 right-4` konumunda, auto-dismiss (3sn), stacking destekler.

### EmptyState Kullanımı

```tsx
<EmptyState
  icon={<ClipboardListIcon />}
  title={t("dashboard.noQuizzes")}
  description={t("dashboard.noQuizzesDesc")}
  action={<Button onClick={handleCreate}>{t("dashboard.createFirst")}</Button>}
/>
```
