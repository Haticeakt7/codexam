# CodExam – Project Brief

## Proje Tanımı

**CodExam**, Docker tabanlı online coding sınav platformudur. Kullanıcılar hem giriş yapmadan (anonim) kod yazıp çalıştırabilir, hem de kimlik doğrulaması sonrasında sınavlara katılabilir veya yönetici olarak sınav oluşturabilir.

## Temel Hedefler

- Güvenli Docker sandbox içinde kod çalıştırma
- Esnek sınav oluşturma ve yönetim
- Anti-cheat mekanizmaları (tab switch, fullscreen, clipboard)
- SignalR üzerinden gerçek zamanlı izleme
- Otomatik değerlendirme (test case)
- Submission replay (diff-based)
- Analitik raporlama

## Kapsam Dışı (Şimdilik)

- Ücretli/premium kullanıcı katmanları
- LMS entegrasyonu
- Mobil uygulama

## Proje Adı

`codeexam` (monorepo: `frontend`, `api`, `worker`, `infra`)

## Repo Yapısı (Planlanan)

```
/
├── frontend/          # React + TypeScript
├── api/               # ASP.NET Core Web API
├── worker/            # Hangfire background jobs (ayrı host)
├── infra/             # Docker, Nginx, docker-compose dosyaları
├── runners/           # Dil bazlı Docker imajları
│   ├── python-runner/
│   ├── node-runner/
│   └── cpp-runner/
├── memory-bank/       # Proje bağlamı ve kararlar
├── docker-compose.yml
└── docker-compose.prod.yml
```
