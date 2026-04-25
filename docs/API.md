# CodExam – API Dokümanı

> ASP.NET Core 8 · REST + SignalR · JWT + SessionToken · OpenAPI / Swagger

---

## İçindekiler

1. [Genel Kurallar](#1-genel-kurallar)
2. [Kimlik Doğrulama](#2-kimlik-doğrulama)
3. [Auth Endpointleri](#3-auth-endpointleri)
4. [Kod Çalıştırma](#4-kod-çalıştırma)
5. [Quiz Yönetimi](#5-quiz-yönetimi)
6. [Soru Yönetimi](#6-soru-yönetimi)
7. [Quiz Katılımı](#7-quiz-katılımı)
8. [Session ve Replay](#8-session-ve-replay)
9. [Admin Endpointleri](#9-admin-endpointleri)
10. [SignalR Hub](#10-signalr-hub)
11. [Hata Kodları](#11-hata-kodları)
12. [Pagination](#12-pagination)
13. [Rate Limit Özeti](#13-rate-limit-özeti)

---

## 1. Genel Kurallar

### Base URL

```
Geliştirme:  http://localhost:5000/api
Production:  https://<domain>/api
```

### İstek/Yanıt Formatı

- Content-Type: `application/json`
- Zaman damgaları: ISO 8601, UTC (`2025-05-10T14:30:00Z`)
- UUID formatı: standart (`3fa85f64-5717-4562-b3fc-2c963f66afa6`)

### Erişim Seviyeleri

| Seviye | Açıklama | Nasıl gönderilir |
|--------|---------|-----------------|
| Public | Kimlik doğrulama gerekmez | — |
| User | Kayıtlı kullanıcı (User veya Admin rolü) | `Authorization: Bearer <jwt>` |
| Admin | Yalnızca Admin rolü | `Authorization: Bearer <jwt>` |
| SessionToken | Anonim quiz katılımcısı | `X-Session-Token: <uuid>` |
| Owner | Quiz sahibi veya Admin | `Authorization: Bearer <jwt>` |

---

## 2. Kimlik Doğrulama

### JWT Bearer

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Session Token (Anonim Katılımcı)

```http
X-Session-Token: 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

Session token geçerlilik koşulları:
- `quiz_sessions.is_active = true`
- `quiz_sessions.is_locked = false`
- `quiz_sessions.ends_at > now()`

---

## 3. Auth Endpointleri

### `POST /api/auth/register`

**Erişim:** Public

**İstek:**
```json
{
  "displayName": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "Guclu@2025!",
  "passwordConfirm": "Guclu@2025!"
}
```

**Validasyon:**
- `displayName`: 2–100 karakter, zorunlu
- `email`: geçerli format, benzersiz, zorunlu
- `password`: min 8 karakter, büyük/küçük harf + rakam + özel karakter
- `passwordConfirm`: `password` ile aynı

**Başarı (201 Created):**
```json
{
  "id": "uuid",
  "email": "ahmet@example.com",
  "displayName": "Ahmet Yılmaz",
  "role": "User"
}
```

---

### `POST /api/auth/login`

**Erişim:** Public

**İstek:**
```json
{
  "email": "ahmet@example.com",
  "password": "Guclu@2025!"
}
```

**Başarı (200 OK):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "d9f3e2...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "ahmet@example.com",
    "displayName": "Ahmet Yılmaz",
    "role": "User"
  }
}
```

**Hata (401):** Hatalı kimlik bilgisi

---

### `POST /api/auth/refresh`

**Erişim:** Public

**İstek:**
```json
{ "refreshToken": "d9f3e2..." }
```

**Başarı (200 OK):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a7b1c3...",
  "expiresIn": 900
}
```

**Hata (401):** Geçersiz veya süresi dolmuş refresh token

---

### `GET /api/auth/me`

**Erişim:** User / Admin

**Başarı (200 OK):**
```json
{
  "id": "uuid",
  "email": "ahmet@example.com",
  "displayName": "Ahmet Yılmaz",
  "role": "User",
  "createdAt": "2025-04-27T10:00:00Z"
}
```

---

## 4. Kod Çalıştırma

### `POST /api/execute`

**Erişim:** Public (IP bazlı rate limit: 10/dk)

**İstek:**
```json
{
  "language": "python",
  "code": "print('Hello, World!')",
  "stdin": ""
}
```

`language` değerleri: `"python"` | `"javascript"` | `"cpp"`

**Başarı (202 Accepted):**
```json
{
  "jobId": "uuid"
}
```

Job kuyruğa alındı; `GET /api/execute/:jobId` ile sonuç polling yapılır.

---

### `GET /api/execute/:jobId`

**Erişim:** Public

**Başarı (200 OK) – Tamamlandı:**
```json
{
  "jobId": "uuid",
  "status": "Passed",
  "stdout": "Hello, World!\n",
  "stderr": "",
  "executionTimeMs": 42,
  "memoryUsedKb": 8192
}
```

**Başarı (200 OK) – Devam ediyor:**
```json
{
  "jobId": "uuid",
  "status": "Running"
}
```

**status değerleri:** `Pending` | `Running` | `Passed` | `Failed` | `Error` | `TLE`

**Polling Stratejisi (Frontend):**
- 500ms interval
- Max 30 saniye (60 deneme)
- `status` ∈ { `Passed`, `Failed`, `Error`, `TLE` } → dur

---

## 5. Quiz Yönetimi

### `GET /api/quizzes`

**Erişim:** User (kendi quizleri) / Admin (tüm quizler)

**Query Params:**
- `status`: `Draft` | `Active` | `Ended`
- `page`: sayfa (default 1)
- `pageSize`: kayıt sayısı (default 20)

**Başarı (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Python Temelleri",
      "description": "...",
      "durationMinutes": 60,
      "mode": "RealTime",
      "status": "Active",
      "participantCount": 12,
      "questionCount": 5,
      "createdAt": "2025-05-01T10:00:00Z",
      "publishedAt": "2025-05-02T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 }
}
```

---

### `POST /api/quizzes`

**Erişim:** User / Admin

**İstek:**
```json
{
  "title": "Python Temelleri Sınavı",
  "description": "Opsiyonel açıklama",
  "durationMinutes": 60,
  "mode": "RealTime",
  "antiCheatOptions": {
    "tabSwitch": true,
    "fullscreen": true,
    "clipboard": false
  },
  "formSchema": [
    { "key": "name",      "label": "Ad Soyad",         "type": "text", "required": true },
    { "key": "studentId", "label": "Öğrenci Numarası", "type": "text", "required": true }
  ],
  "accessCode": null
}
```

**Başarı (201 Created):**
```json
{
  "id": "uuid",
  "title": "Python Temelleri Sınavı",
  "status": "Draft",
  ...
}
```

---

### `GET /api/quizzes/:id`

**Erişim:** Owner / Admin

**Başarı (200 OK):** Quiz detayı (tüm alanlar, soru sayısı dahil)

---

### `PUT /api/quizzes/:id`

**Erişim:** Owner / Admin  
**Not:** `status: "Active"` quizde yalnızca `description` ve `antiCheatOptions` güncellenebilir.

**İstek:** `POST /api/quizzes` ile aynı şema.

**Başarı (200 OK):** Güncellenmiş quiz

---

### `DELETE /api/quizzes/:id`

**Erişim:** Owner / Admin  
**Not:** `status: "Active"` quiz silinemez (409 Conflict).

**Başarı (204 No Content)**

---

### `POST /api/quizzes/:id/publish`

**Erişim:** Owner / Admin

**Koşullar:**
- Quiz `Draft` durumunda olmalı
- En az 1 soru eklenmiş olmalı

**Başarı (200 OK):**
```json
{
  "id": "uuid",
  "status": "Active",
  "publishedAt": "2025-05-02T08:00:00Z",
  "quizUrl": "/q/uuid"
}
```

---

### `POST /api/quizzes/:id/end`

**Erişim:** Owner / Admin

**Başarı (200 OK):** `status: "Ended"`, tüm aktif session'lar kilitlenir.

---

## 6. Soru Yönetimi

### `GET /api/quizzes/:id/questions`

**Erişim:** Owner / Admin

**Başarı (200 OK):**
```json
[
  {
    "id": "uuid",
    "type": "Coding",
    "title": "Fibonacci",
    "body": "n. Fibonacci sayısını döndüren fonksiyonu yazın.",
    "points": 20,
    "orderNo": 1,
    "options": { "starterCode": "def fib(n):\n    pass", "supportedLanguages": ["python"] },
    "testCaseCount": 5,
    "visibleTestCaseCount": 2
  }
]
```

---

### `POST /api/quizzes/:id/questions`

**Erişim:** Owner / Admin

**İstek (Coding sorusu):**
```json
{
  "type": "Coding",
  "title": "Fibonacci",
  "body": "n. Fibonacci sayısını döndüren fonksiyonu yazın.",
  "points": 20,
  "options": {
    "starterCode": "def fib(n):\n    pass",
    "supportedLanguages": ["python", "javascript"]
  },
  "testCases": [
    { "input": "5",  "expectedOutput": "5",  "isVisible": true },
    { "input": "10", "expectedOutput": "55", "isVisible": true },
    { "input": "20", "expectedOutput": "6765", "isVisible": false }
  ]
}
```

**İstek (Multiple Choice sorusu):**
```json
{
  "type": "MultipleChoice",
  "title": "Python list slice",
  "body": "x = [0,1,2,3,4] → x[1:3] sonucu nedir?",
  "points": 5,
  "options": {
    "choices": ["[1, 2]", "[1, 2, 3]", "[0, 1, 2]", "[2, 3]"],
    "correctIndices": [0],
    "multiSelect": false
  }
}
```

**Başarı (201 Created):** Oluşturulan soru

---

### `PUT /api/questions/:id`

**Erişim:** Owner / Admin

**İstek:** Güncellenecek alanlar (partial update desteklenir)

**Başarı (200 OK):** Güncellenmiş soru

---

### `DELETE /api/questions/:id`

**Erişim:** Owner / Admin

**Başarı (204 No Content)**

---

### `PATCH /api/questions/:id/order`

**Erişim:** Owner / Admin

**İstek:**
```json
{ "orderNo": 3 }
```

**Başarı (200 OK)**

---

### `POST /api/questions/:id/test-cases`

**Erişim:** Owner / Admin

**İstek:**
```json
{
  "testCases": [
    { "input": "0", "expectedOutput": "0", "isVisible": false },
    { "input": "1", "expectedOutput": "1", "isVisible": false }
  ]
}
```

**Başarı (201 Created):** Oluşturulan test case'ler

---

## 7. Quiz Katılımı

### `GET /api/quizzes/:id/info`

**Erişim:** Public

**Başarı (200 OK):**
```json
{
  "id": "uuid",
  "title": "Python Temelleri Sınavı",
  "description": "...",
  "durationMinutes": 60,
  "questionCount": 5,
  "status": "Active",
  "antiCheatOptions": {
    "tabSwitch": true,
    "fullscreen": true,
    "clipboard": false
  },
  "formSchema": [
    { "key": "name",      "label": "Ad Soyad",         "type": "text", "required": true },
    { "key": "studentId", "label": "Öğrenci Numarası", "type": "text", "required": true }
  ]
}
```

**Hata (404):** Quiz bulunamadı  
**Hata (409):** Quiz `Draft` veya `Ended` durumunda → `"Quiz aktif değil"`

---

### `POST /api/quizzes/:id/join`

**Erişim:** Public (IP bazlı rate limit: 5/dk)

**İstek:**
```json
{
  "formData": {
    "name": "Ayşe Demir",
    "studentId": "20230099"
  }
}
```

**Backend işlemleri:**
1. Quiz `Active` mi kontrol et
2. `formData`'yı `formSchema`'ya göre doğrula (required alanlar, tip uyumu)
3. UUID `sessionToken` üret
4. `QuizSession` oluştur: `ends_at = now() + duration_minutes`
5. Response dön

**Başarı (200 OK):**
```json
{
  "sessionToken": "uuid",
  "sessionId": "uuid",
  "quizId": "uuid",
  "endsAt": "2025-05-10T15:30:00Z",
  "questions": [
    {
      "id": "uuid",
      "type": "Coding",
      "title": "Fibonacci",
      "body": "...",
      "points": 20,
      "orderNo": 1,
      "options": { "starterCode": "...", "supportedLanguages": ["python"] },
      "testCases": [
        { "id": "uuid", "input": "5",  "expectedOutput": "5" },
        { "id": "uuid", "input": "10", "expectedOutput": "55" }
      ]
    }
  ]
}
```

**Not:** Yalnızca `isVisible: true` test case'ler döner. Hidden test case'ler gizlenir.

---

### `POST /api/quizzes/:id/submit`

**Erişim:** SessionToken

**İstek:**
```json
{
  "questionId": "uuid",
  "language": "python",
  "code": "def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)"
}
```

**Backend işlemleri:**
1. Session geçerli ve kilitli değil mi kontrol et
2. `ends_at > now()` kontrol et
3. Aynı soruya önceki submission varsa `version++`
4. Coding sorusu → execution job enqueue, diğer tipler → anında değerlendir
5. Submission kaydı oluştur

**Başarı (202 Accepted) – Coding:**
```json
{
  "submissionId": "uuid",
  "jobId": "uuid",
  "status": "Pending"
}
```

**Başarı (200 OK) – Diğer tipler:**
```json
{
  "submissionId": "uuid",
  "status": "Passed",
  "score": 10,
  "feedback": null
}
```

---

### `GET /api/quizzes/:id/submissions/:submissionId`

**Erişim:** SessionToken

**Başarı (200 OK):**
```json
{
  "submissionId": "uuid",
  "status": "Passed",
  "executionTimeMs": 87,
  "memoryUsedKb": 4096,
  "score": 20,
  "testCaseResults": [
    { "input": "5",  "expectedOutput": "5",  "actualOutput": "5",  "passed": true  },
    { "input": "10", "expectedOutput": "55", "actualOutput": "55", "passed": true  }
  ]
}
```

---

### `POST /api/quizzes/:id/event`

**Erişim:** SessionToken (rate limit: 60/dk)

**İstek:**
```json
{
  "eventType": "TabSwitch",
  "metadata": {
    "fromTitle": "CodExam",
    "toTitle": "Google"
  }
}
```

**Başarı (204 No Content)**

**Otomatik severity mapping:**
| eventType | severity |
|-----------|---------|
| `TabSwitch` | `High` |
| `FullscreenExit` | `High` |
| `ClipboardAttempt` | `Medium` |
| `Keydown` | `Low` |

---

### `POST /api/quizzes/:id/finish`

**Erişim:** SessionToken

**Başarı (200 OK):**
```json
{
  "sessionId": "uuid",
  "finishedAt": "2025-05-10T15:25:00Z",
  "totalScore": 45,
  "maxScore": 60,
  "completedQuestions": 4,
  "totalQuestions": 5
}
```

---

## 8. Session ve Replay

### `GET /api/quizzes/:id/sessions`

**Erişim:** Owner / Admin

**Query Params:** `page`, `pageSize`, `active` (bool)

**Başarı (200 OK):**
```json
{
  "data": [
    {
      "sessionId": "uuid",
      "formData": { "name": "Ayşe Demir", "studentId": "20230099" },
      "startedAt": "2025-05-10T14:00:00Z",
      "endsAt": "2025-05-10T15:00:00Z",
      "finishedAt": "2025-05-10T14:45:00Z",
      "isActive": false,
      "totalScore": 45,
      "eventCount": 2
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/quizzes/:id/sessions/active`

**Erişim:** Owner / Admin  
**Kullanım:** Monitor sayfası ilk yüklendiğinde

**Başarı (200 OK):** Aktif session listesi (yukarıdaki format)

---

### `GET /api/quizzes/:id/results`

**Erişim:** Owner / Admin

**Başarı (200 OK):**
```json
{
  "quizId": "uuid",
  "totalParticipants": 15,
  "averageScore": 38.5,
  "maxScore": 58,
  "minScore": 10,
  "sessions": [
    {
      "sessionId": "uuid",
      "participantName": "Ayşe Demir",
      "formData": { ... },
      "totalScore": 45,
      "maxPossibleScore": 60,
      "completedQuestions": 4,
      "submittedAt": "2025-05-10T14:45:00Z",
      "durationSeconds": 2700,
      "eventCount": 2
    }
  ],
  "questionStats": [
    {
      "questionId": "uuid",
      "title": "Fibonacci",
      "successRate": 0.73,
      "averageScore": 14.6
    }
  ]
}
```

---

### `GET /api/sessions/:sessionId`

**Erişim:** Owner / Admin

**Başarı (200 OK):** Session detayı + submission listesi + anti-cheat event listesi

```json
{
  "sessionId": "uuid",
  "formData": { ... },
  "submissions": [
    {
      "questionId": "uuid",
      "questionTitle": "Fibonacci",
      "language": "python",
      "code": "def fib(n): ...",
      "status": "Passed",
      "score": 20,
      "executionTimeMs": 87,
      "version": 2,
      "submittedAt": "..."
    }
  ],
  "examEvents": [
    {
      "eventType": "TabSwitch",
      "severity": "High",
      "timestamp": "2025-05-10T14:22:00Z",
      "metadata": { ... }
    }
  ]
}
```

---

### `GET /api/sessions/:sessionId/replay`

**Erişim:** Owner / Admin

**Başarı (200 OK):**
```json
{
  "sessionId": "uuid",
  "questionReplays": [
    {
      "questionId": "uuid",
      "questionTitle": "Fibonacci",
      "submissionId": "uuid",
      "startedAt": "2025-05-10T14:05:00Z",
      "diffs": [
        { "time_ms": 0,    "type": "snapshot", "code": "def fib(n):\n    pass" },
        { "time_ms": 1200, "type": "delta",    "diff": "..." },
        { "time_ms": 5000, "type": "snapshot", "code": "..." }
      ],
      "examEvents": [
        { "eventType": "TabSwitch", "timestamp": "...", "timeMsFromStart": 12000 }
      ]
    }
  ]
}
```

---

### `PATCH /api/submissions/:id/replay`

**Erişim:** SessionToken  
**Kullanım:** Frontend her 5 saniyede toplu diff gönderir

**İstek:**
```json
{
  "diffs": [
    { "time_ms": 1200, "type": "delta",    "diff": "..." },
    { "time_ms": 2400, "type": "delta",    "diff": "..." }
  ]
}
```

**Başarı (204 No Content)**

---

## 9. Admin Endpointleri

### `GET /api/admin/stats`

**Erişim:** Admin

**Başarı (200 OK):**
```json
{
  "totalUsers": 42,
  "activeQuizzes": 3,
  "dailyExecutions": 156,
  "errorsLast24h": 2,
  "activeSessions": 7
}
```

---

### `GET /api/admin/users`

**Erişim:** Admin

**Query Params:** `q` (arama), `role`, `status`, `page`, `pageSize`

**Başarı (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "...",
      "role": "User",
      "status": "active",
      "createdAt": "...",
      "lastLoginAt": "..."
    }
  ],
  "pagination": { ... }
}
```

---

### `PUT /api/admin/users/:id`

**Erişim:** Admin

**İstek:**
```json
{
  "role": "Admin",
  "status": "inactive"
}
```

**Başarı (200 OK):** Güncellenmiş kullanıcı

---

### `DELETE /api/admin/users/:id`

**Erişim:** Admin (soft delete → `deleted_at` set edilir)

**Başarı (204 No Content)**

---

### `GET /api/admin/quizzes`

**Erişim:** Admin

**Query Params:** `status`, `ownerId`, `page`, `pageSize`

**Başarı (200 OK):** Tüm quizler, sahip bilgisi ve katılımcı sayısıyla

---

### `DELETE /api/admin/quizzes/:id`

**Erişim:** Admin

**Başarı (204 No Content)**

---

### `GET /api/admin/sessions`

**Erişim:** Admin

**Query Params:** `active` (bool), `quizId`, `page`, `pageSize`

**Başarı (200 OK):** Tüm session'lar

---

### `DELETE /api/admin/sessions/:id`

**Erişim:** Admin  
**Etki:** `is_locked = true`, `is_active = false` → SignalR ile katılımcıya `monitor.terminate` gönderilir

**Başarı (204 No Content)**

---

### `GET /api/admin/logs`

**Erişim:** Admin

**Query Params:** `source` (`API` | `Worker` | `Nginx`), `from`, `to`, `page`, `pageSize`

**Başarı (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "sourceService": "API",
      "errorTitle": "NullReferenceException",
      "errorMessage": "...",
      "createdAt": "..."
    }
  ],
  "pagination": { ... }
}
```

---

## 10. SignalR Hub

**URL:** `/hubs/monitor`

### Bağlantı Kimlik Doğrulama

| Kullanıcı | Yöntem | Parametre |
|-----------|--------|----------|
| Kayıtlı kullanıcı (User/Admin) | JWT Bearer | `access_token` query param veya `Authorization` header |
| Anonim katılımcı | Session Token | `token` query param (session UUID) |

```js
// Kayıtlı kullanıcı
new HubConnectionBuilder()
  .withUrl("/hubs/monitor?access_token=" + jwtToken)

// Anonim katılımcı
new HubConnectionBuilder()
  .withUrl("/hubs/monitor?token=" + sessionToken)
```

### Client → Server Metodları

| Metod | Parametreler | Erişim | Açıklama |
|-------|-------------|--------|---------|
| `CodeChanged` | `questionId: string, code: string` | SessionToken | Kod değişikliği |
| `Heartbeat` | — | SessionToken | Canlılık sinyali (10sn) |
| `WarnParticipant` | `targetSessionId: string, message: string` | Owner/Admin | Katılımcıya uyarı |
| `TerminateParticipant` | `targetSessionId: string` | Owner/Admin | Katılımcıyı düşür |

### Server → Client Eventleri

| Event | Alıcı | Veri | Açıklama |
|-------|-------|------|---------|
| `session.joined` | Monitor | `{ sessionId, formData }` | Yeni katılımcı bağlandı |
| `session.codeChanged` | Monitor | `{ sessionId, questionId, code }` | Kod güncellendi |
| `session.heartbeat` | Monitor | `{ sessionId, timestamp }` | Canlılık |
| `session.event` | Monitor | `{ sessionId, eventType, severity, timestamp }` | Anti-cheat event |
| `session.disconnected` | Monitor | `{ sessionId }` | Bağlantı kesildi |
| `monitor.warn` | Katılımcı | `{ message }` | Quiz sahibinden uyarı |
| `monitor.terminate` | Katılımcı | — | Sınavdan düşürme |

### SignalR Grup Yapısı

| Grup Adı | Üyeler | Alınan Eventler |
|----------|--------|----------------|
| `quiz:{quizId}:monitor` | Quiz sahibi, Admin | session.* |
| `session:{sessionId}` | Katılımcı | monitor.* |

---

## 11. Hata Kodları

| HTTP | Kod | Açıklama |
|------|-----|---------|
| 400 | `validation_error` | İstek validasyonu başarısız |
| 401 | `unauthorized` | Token yok veya geçersiz |
| 403 | `forbidden` | Yetkisiz işlem |
| 404 | `not_found` | Kaynak bulunamadı |
| 409 | `conflict` | İşlem mevcut durumla çakışıyor |
| 410 | `session_expired` | Session süresi dolmuş |
| 423 | `session_locked` | Session kilitlenmiş (terminate) |
| 429 | `rate_limit_exceeded` | Çok fazla istek |
| 500 | `internal_error` | Sunucu hatası |

**Hata Yanıt Formatı:**

```json
{
  "type": "validation_error",
  "title": "Doğrulama hatası",
  "status": 400,
  "errors": {
    "title": ["Başlık zorunludur."],
    "durationMinutes": ["Süre 0'dan büyük olmalıdır."]
  },
  "traceId": "0HMVD6CPCE1IT:00000001"
}
```

---

## 12. Pagination

Tüm liste endpoint'leri aynı sayfalama yapısını kullanır:

**Query Params:**
- `page`: sayfa numarası (default: `1`, min: `1`)
- `pageSize`: sayfa başına kayıt (default: `20`, min: `1`, max: `100`)

**Response Şablonu:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 87,
    "totalPages": 5
  }
}
```

---

## 13. Rate Limit Özeti

| Endpoint | Limit | Pencere | 429 Yanıtı |
|----------|-------|--------|-----------|
| `POST /api/auth/login` | 10 istek | 1 dk | `Retry-After: 60` |
| `POST /api/auth/register` | 5 istek | 1 dk | `Retry-After: 60` |
| `POST /api/execute` | 10 istek | 1 dk | `Retry-After: 60` |
| `POST /api/quizzes/:id/join` | 5 istek | 1 dk | `Retry-After: 60` |
| `POST /api/quizzes/:id/submit` | 30 istek | 1 dk | `Retry-After: 60` |
| `POST /api/quizzes/:id/event` | 60 istek | 1 dk | `Retry-After: 60` |

Limit aşıldığında:
```json
{
  "type": "rate_limit_exceeded",
  "message": "Çok fazla istek gönderildi. 1 dakika bekleyin.",
  "retryAfter": 60
}
```
