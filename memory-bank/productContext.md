# CodExam – Product Context

## Neden Bu Platform?

Standart coding platformlarından (LeetCode, HackerRank) farkı:
- **Kendi sunucunda barındırılabilir** (self-hosted)
- **Sınav kuralları özelleştirilebilir** (süre, anti-cheat seçenekleri)
- **Dinamik form sistemi** (katılımcıdan özel veri toplanabilir)
- **Admin canlı izleyebilir** (SignalR)
- **Replay** ile gönderim yeniden oynatılabilir

## Yetki Modeli Özeti

| Rol | Kim? | Ne yapabilir? |
|-----|------|---------------|
| `Admin` | Kök yönetici (sistem) | Her şeyi görür, yönetir, siler |
| `User` | Kayıtlı kullanıcı | Quiz oluşturur, kendi quizini yönetir |
| Anonim | Kayıtsız ziyaretçi | Ana sayfa editörünü kullanır, quiz'e form doldurup katılır |

## Sayfa / Rota Mimarisi (Frontend)

### Public (Giriş Gerektirmeyen)

| Rota | Açıklama |
|------|----------|
| `/` | **Ana Sayfa** – Monaco editörü + code runner. Anonim kullanılabilir. |
| `/login` | Giriş ekranı |
| `/register` | Kayıt ekranı |
| `/q/:id` | Quiz katılım sayfası – form doldur, sınava gir (kayıt gerekmez) |
| `/q/:id/take` | Sınav alma ekranı (fullscreen, anti-cheat, session token ile) |

### User Dashboard (Giriş Gerekli – Rol: User veya Admin)

| Rota | Açıklama |
|------|----------|
| `/dashboard` | Kullanıcının kendi quizlerinin listesi |
| `/dashboard/quizzes/new` | Yeni quiz oluşturma |
| `/dashboard/quizzes/:id` | Quiz detayı / ayarlar |
| `/dashboard/quizzes/:id/questions` | Soru yönetimi |
| `/dashboard/quizzes/:id/monitor` | Canlı izleme (sadece quiz sahibi + Admin) |
| `/dashboard/quizzes/:id/results` | Sonuçlar + replay |
| `/profile` | Hesap ayarları |

### Admin Panel (Giriş Gerekli – Rol: Admin)

| Rota | Açıklama |
|------|----------|
| `/admin` | Sistem dashboard (kullanıcı, quiz, session sayıları, KPI) |
| `/admin/users` | Tüm kullanıcılar – görüntüle, düzenle, sil, rol değiştir |
| `/admin/quizzes` | Tüm quizler – görüntüle, düzenle, sil |
| `/admin/sessions` | Tüm aktif/geçmiş sessionlar |
| `/admin/system` | Sistem ayarları |

## Ana Sayfa Detayı (UX)

```
┌───────────────────────────────────────────────────────────┐
│  CodExam  [🌐 TR▾] [☀️▾]  [Python▾]  [Run▶]  [Giriş]  │
├──────────────────────┬────────────────────────────────────┤
│                      │                                    │
│   Monaco Editor      │        Output / Console            │
│   (tema: ui ile sync)│                                    │
│                      │  ── Çalışma Sonucu ──              │
│                      │  > Hello, World!                   │
│                      │  ── Execution Info ──              │
│                      │  Time: 42ms  Mem: 8MB              │
└──────────────────────┴────────────────────────────────────┘
```

## i18n (Çoklu Dil Desteği)

- Kütüphane: `react-i18next` + `i18next`
- Başlangıç dilleri: **Türkçe (tr)**, **İngilizce (en)**
- Dil dosyaları: `frontend/src/locales/tr.json`, `frontend/src/locales/en.json`
- Dil tercihi localStorage'da saklanır
- Header'da dil değiştirici dropdown

## Tema Sistemi

### UI Temaları
- Kütüphane: TailwindCSS CSS variables + class-based dark mode
- Temalar: `light`, `dark` (başlangıç), genişletilebilir
- Tema tercihi localStorage'da saklanır
- `themeStore` (Zustand) ile yönetilir

### Monaco Temaları
- Monaco'nun built-in teması UI temasıyla sync edilir:
  - UI `light` → Monaco `vs`
  - UI `dark` → Monaco `vs-dark`
- Ek Monaco temalar eklenebilir (`night-owl`, `github-light`, vs.)
- Editor ayrıca kendi tema seçicisine sahip olabilir (advanced)

## Quiz Katılım Akışı (Anonim)

```
1. Kullanıcı /q/:id adresine gider
2. Quiz bilgileri gösterilir (başlık, süre, kurallar)
3. Quiz sahibinin belirlediği form doldurulur (örn: ad, numara)
4. Submit → backend sessionToken döner
5. /q/:id/take sayfasına yönlendirilir (sessionToken localStorage'da)
6. Sınav fullscreen + anti-cheat modunda başlar
```

## Temel UX Kararları

- Sınav sayfası (`/q/:id/take`) fullscreen + anti-cheat ile açılır
- Dashboard rotaları `/dashboard` prefix'i altında (quiz sahipleri)
- Admin rotaları `/admin` prefix'i altında (sistem admin)
- Header kullanıcı durumuna göre: anonim / User / Admin
- Sınav sırasında header/nav tamamen gizlenir (distraction-free)
- Tema ve dil seçimi header'dan her sayfada erişilebilir
