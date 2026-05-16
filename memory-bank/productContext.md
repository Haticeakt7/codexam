# CodExam – Product Context

## Neden Bu Platform?

Standart coding platformlarından (LeetCode, HackerRank) farkı:
- **Kendi sunucunda barındırılabilir** (self-hosted, Docker Compose ile)
- **Sınav kuralları özelleştirilebilir** (süre, mod, anti-cheat seçenekleri)
- **Tarih/saat tabanlı sınav zamanlama** (StartsAt/EndsAt; RealTime ve FreeStyle modlar)
- **Benzersiz katılım linki** (ParticipationToken — her quiz için UUID, hiç değişmez)
- **Dinamik form sistemi** (katılımcıdan özel veri toplanabilir)
- **Admin canlı izleyebilir** (SignalR)
- **Replay** ile gönderim yeniden oynatılabilir
- **Kişiselleştirilebilir editör** (font boyutu, Monaco teması, yeniden boyutlandırılabilir paneller)

## Yetki Modeli Özeti

| Rol | Kim? | Ne yapabilir? |
|-----|------|---------------|
| `Admin` | Kök yönetici (sistem) | Her şeyi görür, yönetir, siler |
| `User` | Kayıtlı kullanıcı | Quiz oluşturur, kendi quizini yönetir, tercihlerini kaydeder |
| Anonim | Kayıtsız ziyaretçi | Ana sayfa editörünü kullanır, quiz'e form doldurup katılır |

## Sayfa / Rota Mimarisi (Frontend)

### Public (Giriş Gerektirmeyen)

| Rota | Açıklama |
|------|----------|
| `/` | **Ana Sayfa** – Monaco editörü + code runner. Anonim kullanılabilir. Dinamik dil listesi, font/tema kontrolü, her zaman görünür stdin. |
| `/login` | Giriş ekranı |
| `/register` | Kayıt ekranı |
| `/q/:id` | Quiz katılım sayfası – form doldur, sınava gir (kayıt gerekmez) |
| `/q/join/:token` | **YENİ** – Benzersiz katılım token linki ile quiz sayfası. `/q/:id`'den ÖNCE tanımlanmalı. |
| `/q/:id/take` | Sınav alma ekranı (fullscreen, anti-cheat, session token ile, yeniden boyutlandırılabilir paneller) |

### User Dashboard (Giriş Gerekli – Rol: User veya Admin)

| Rota | Açıklama |
|------|----------|
| `/dashboard` | Kullanıcının kendi quizlerinin listesi |
| `/dashboard/new` | Yeni quiz oluşturma (sadeleştirildi: başlık/açıklama/mod/süre) |
| `/dashboard/quiz/:id/settings` | Quiz ayarları — katılım linki, tarih/saat, kilitleme, yayınlama |
| `/dashboard/quiz/:id/questions` | Soru yönetimi (tüm tipler) |
| `/dashboard/quiz/:id/monitor` | Canlı izleme (SignalR) |
| `/dashboard/quiz/:id/results` | Sonuçlar + replay linki |
| `/dashboard/quiz/:id/replay/:sessionId` | Submission replay oynatıcı |
| `/profile` | Hesap ayarları + şifre değiştirme |

### Admin Panel (Giriş Gerekli – Rol: Admin)

| Rota | Açıklama |
|------|----------|
| `/admin` | Sistem dashboard (KPI kartları, son hatalar) |
| `/admin/users` | Tüm kullanıcılar – görüntüle, düzenle, aktif/pasif, sil |
| `/admin/quizzes` | Tüm quizler – görüntüle, sil |
| `/admin/sessions` | Tüm aktif/geçmiş sessionlar |
| `/admin/logs` | Sistem hata logları |

---

## Quiz Katılım Akışı

### Token Linki ile (YENİ — /q/join/:token)

```
1. Quiz sahibi katılım linkini paylaşır (token içeriyor)
2. Kullanıcı /q/join/:token adresine gider
3. Frontend GET /api/quizzes/join/{token} ile quiz'i bulur
4. QuizLandingView bileşeni duruma göre içeriği gösterir:
   - Draft: "Yayınlanmamış"
   - Published: "Başlangıç saati: ..."
   - Active: Katılım formu
   - Ended/Archived: "Sona erdi"
5. Katılım formu doldurulur → POST /api/quizzes/:id/join
6. sessionToken ile /q/:id/take'e yönlendirilir
```

### ID ile (/q/:id)

```
1. Kullanıcı /q/:id adresine gider
2. GET /api/quizzes/:id/info ile quiz bilgisi alınır
3. Aynı QuizLandingView akışı
```

---

## Ana Sayfa Detayı (UX)

```
┌─────────────────────────────────────────────────────────────────┐
│  CodExam  [🌐 TR▾] [☀️▾]  [Python▾] [−][14][+] [🎨]  [▶Run]  │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                 │
│   Monaco Editor                │     OUTPUT                      │
│   (tema seçilebilir)           │                                 │
│   (font boyutu ayarlanabilir)  │  ── Çalışma Sonucu ──          │
│   (yeniden boyutlandırılabilir)│  > Hello, World!                │
│                                │  ── Info ──                     │
│                                │  Time: 42ms  Mem: 8MB           │
├────────────────────────────────┴────────────────────────────────┤
│  STDIN (her zaman görünür, toggle yok)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Sınav Alma Detayı (UX)

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Soru 1/5]  [−][14][+]  [🎨]  [▶Run]  [⬆Submit]  [⏱ 43:21]       │
├──────────────────────────────────────────┬────────────────────────────┤
│                                          │  OUTPUT                    │
│   Monaco Editor                          │  (yeniden boyutlandırılır) │
│   (genişliği sürükleyerek ayarlanabilir) ├────────────────────────────┤
│                                          │  STDIN                     │
│                                          │  (her zaman görünür)       │
└──────────────────────────────────────────┴────────────────────────────┘
```

---

## i18n (Çoklu Dil Desteği)

- Kütüphane: `react-i18next` + `i18next`
- Başlangıç dilleri: **Türkçe (tr)**, **İngilizce (en)**
- Dil dosyaları: `frontend/src/locales/tr.json`, `frontend/src/locales/en.json`
- Dil tercihi localStorage'da saklanır (i18nStore)
- Header'da dil değiştirici dropdown

---

## Tema Sistemi

### UI Temaları (themeStore)
- Kütüphane: TailwindCSS CSS variables + class-based dark mode
- Temalar: `light`, `dark` (başlangıç)
- Tercih localStorage'da saklanır

### Monaco Editör Temaları (preferencesStore)
- Temalar: `vs-dark` (default), `vs` (light), `hc-black` (high contrast)
- `EDITOR_THEMES` sabiti `preferencesStore.ts`'den export edilir
- Tercih localStorage'da saklanır + auth kullanıcılar için server'a sync edilir

---

## Kullanıcı Tercihleri (preferencesStore)

```
Auth kullanıcı tercihleri:
- editorTheme: "vs-dark" | "vs" | "hc-black"
- fontSize: 8–32 (default 14)
- layoutJson: { leftWidth: number, rightTopHeight: number } (panel %)

Yaşam döngüsü:
  1. Sayfa açılış → localStorage'dan yüklenir (anında)
  2. Giriş → usePreferencesSync → GET /api/users/me/preferences → server kazanır
  3. Değişiklik → localStorage anında, server 1200ms/2000ms debounce ile
```
