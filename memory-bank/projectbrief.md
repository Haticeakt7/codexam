# CodExam – Project Brief

## Proje Tanımı

**CodExam**, Docker tabanlı online coding sınav platformudur. Kullanıcılar hem giriş yapmadan (anonim) kod yazıp çalıştırabilir, hem de kimlik doğrulaması sonrasında sınavlara katılabilir veya yönetici olarak sınav oluşturabilir.

## Temel Özellikler (Gerçekleşen)

- Güvenli Docker sandbox içinde kod çalıştırma (Python, JavaScript, C++, C, Java, Go desteği)
- Esnek sınav oluşturma ve yönetim (5 soru tipi)
- Anti-cheat mekanizmaları (tab switch, fullscreen, clipboard izleme)
- SignalR üzerinden gerçek zamanlı izleme (MonitorHub)
- Tarih/saat tabanlı sınav zamanlama (RealTime + FreeStyle modlar)
- Benzersiz katılım token linki (ParticipationToken)
- Otomatik değerlendirme (test case)
- Submission replay (diff-based)
- Kişiselleştirilebilir editör (font boyutu, Monaco tema, yeniden boyutlandırılabilir paneller)
- Kullanıcı tercihleri DB'de persist (server sync)
- i18n desteği: Türkçe + İngilizce

## Kapsam Dışı (Şimdilik)

- Ücretli/premium kullanıcı katmanları
- LMS entegrasyonu
- Mobil uygulama

## Proje Adı

`codeexam` / `CodExam` (monorepo: `frontend`, `api`, `worker`, `infra`, `runners`)

## Repo Yapısı (Gerçek)

```
/
├── frontend/          # React 19 + TypeScript 6 + Vite 8
├── api/               # ASP.NET Core 8 Web API (Clean Architecture)
│   ├── CodExam.Api/
│   ├── CodExam.Application/
│   ├── CodExam.Domain/
│   └── CodExam.Infrastructure/
├── worker/            # .NET 8 Worker Service (Hangfire + Docker.DotNet)
├── infra/             # Nginx konfigürasyonu
├── runners/           # Dil bazlı Docker imajları
│   ├── python/
│   ├── javascript/
│   └── cpp/
├── memory-bank/       # Proje bağlamı ve kararlar
├── docs/              # Teknik dokümantasyon
├── docker-compose.yml
├── Makefile
└── README.md
```

## Kritik Teknik Kararlar

- **EnsureCreatedAsync**: Runtime'da migration çalışmaz; şema değişikliği için `docker-compose down -v`
- **snake_case**: EFCore.NamingConventions ile otomatik
- **ParticipationToken**: Oluşturma anında atanır, asla değişmez, URL-safe
- **Preferences**: localStorage (hızlı) + server DB (güvenilir), debounced sync
- **Resizable panels**: Harici kütüphane kullanılmadan custom mouse event hooks
