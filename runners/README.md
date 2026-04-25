# CodExam – Runner Images

Kod çalıştırma işlemi izole Docker container'larında gerçekleşir. Her dil için ayrı bir imaj mevcuttur. Worker servisi `Docker.DotNet` SDK'sı aracılığıyla bu imajlardan geçici container'lar oluşturur, çalıştırır ve siler.

---

## Runner'lar

| Dizin | İmaj Adı | Dil | Durum |
|-------|----------|-----|-------|
| `python/` | `codexam-python-runner` | Python | `[ ]` Dockerfile yazılacak |
| `c/` | `codexam-c-runner` | C | `[ ]` Dockerfile yazılacak |
| `cpp/` | `codexam-cpp-runner` | C++ | `[ ]` Dockerfile yazılacak |
| `javascript/` | `codexam-javascript-runner` | JavaScript (Node) | `[ ]` Dockerfile yazılacak |
| `java/` | `codexam-java-runner` | Java | `[ ]` Dockerfile yazılacak |
| `go/` | `codexam-go-runner` | Go | `[ ]` Dockerfile yazılacak |

---

## Çalışma Akışı

```
API  →  POST /api/execute
          │
          │  Hangfire enqueue
          ▼
       Worker (DockerRunnerService)
          │
          ├── Kod dosyasını geçici dizine yaz  (/tmp/runner-jobs/<jobId>/)
          │     solution.py / solution.js / solution.cpp
          │
          ├── docker run  (Docker.DotNet SDK)
          │     --rm
          │     --network none          ← internet yok
          │     --read-only             ← filesystem salt-okunur
          │     --cpus 0.5             ← 0.5 CPU
          │     --memory 256m          ← 256 MB RAM limiti
          │     --pids-limit 64        ← fork bomb koruması
          │     --user 1000            ← non-root (uid=1000, runner)
          │     -v /tmp/runner-jobs/<jobId>:/runner:ro
          │     codexam-<lang>-runner
          │
          ├── stdout / stderr yakala
          ├── Timeout aşılırsa → container kill → status: TLE
          └── Sonucu DB'ye yaz  (CodeExecution kaydı güncellenir)
```

---

## Güvenlik Modeli

| Kısıtlama | Değer | Amaç |
|-----------|-------|------|
| `--network none` | — | İnternete ve iç ağa sıfır erişim |
| `--read-only` | — | Filesystem'e yazma yasak (`/tmp` hariç) |
| `--cpus` | 0.5 | CPU kullanımını yarıya sınırla |
| `--memory` | 256m | Bellek sınırı – aşılırsa OOM kill |
| `--pids-limit` | 64 | Fork bomb saldırısını engelle |
| `--user 1000` | runner | Root olmayan kullanıcı |
| Temel imaj | slim/alpine | Minimum saldırı yüzeyi |

---

## Dizin Yapısı

```
runners/
├── python/
│   └── Dockerfile          # python:3.12-slim, ENTRYPOINT: python3 solution.py
├── node/
│   └── Dockerfile          # node:20-alpine, ENTRYPOINT: node solution.js
├── cpp/
│   ├── Dockerfile          # alpine:3.19 + g++, ENTRYPOINT: compile.sh
│   └── compile.sh          # g++ -O2 -o /tmp/solution solution.cpp && exec /tmp/solution
└── README.md
```

---

## İmaj Build

```bash
# Tüm runner imajlarını build et (Makefile)
make build-runners

# Tek tek build
docker build -t codexam-python-runner ./runners/python
docker build -t codexam-node-runner   ./runners/node
docker build -t codexam-cpp-runner    ./runners/cpp
```

> Runner imajları `docker-compose.yml`'de tanımlı değildir — önceden build edilmiş olmaları gerekir.

---

## Manuel Test

```bash
# Python
echo 'print("hello")' > /tmp/solution.py
docker run --rm --network none --memory 256m --cpus 0.5 \
  -v /tmp/solution.py:/runner/solution.py:ro \
  codexam-python-runner

# Node
echo 'console.log("hello")' > /tmp/solution.js
docker run --rm --network none --memory 256m --cpus 0.5 \
  -v /tmp/solution.js:/runner/solution.js:ro \
  codexam-node-runner

# C++
echo '#include<iostream>
int main(){std::cout<<"hello";}' > /tmp/solution.cpp
docker run --rm --network none --memory 256m --cpus 0.5 \
  -v /tmp/solution.cpp:/runner/solution.cpp:ro \
  codexam-cpp-runner
```

---

## Yapılacaklar

### Zorunlu (Phase 1.0 – Execute endpoint)

- [ ] `DockerRunnerService` implementasyonu (`worker/Services/DockerRunnerService.cs`)
  - `Docker.DotNet` ile container oluşturma, başlatma, bekleme, silme
  - stdout / stderr okuma (`GetContainerLogsAsync`)
  - Timeout enforcement (`CancellationTokenSource` + `KillContainerAsync`)
  - `execution_time_ms` ve `memory_used_kb` hesaplama
- [ ] `CodeExecution` kaydını Pending → Running → Passed/Failed/Error/TLE güncellemesi
- [ ] Job geçici dizin yönetimi: `/tmp/runner-jobs/<jobId>/` oluştur → dosyaları yaz → container çalıştır → dizini temizle
- [ ] Stdin desteği: `solution.py` dosyasına stdin pipe edilmesi
- [ ] Hangfire job kaydı ve worker tarafında tüketimi

### Güvenlik / Dayanıklılık

- [ ] `--pids-limit 64` tüm runner Dockerfile'larına veya `docker run` komutuna ekle
- [ ] OOM senaryosu testi (bellek bomba kodu çalıştır)
- [ ] TLE senaryosu testi (`while True: pass`)
- [ ] Fork bomb testi (`import os; [os.fork() for _ in range(100)]`)
- [ ] Compilation error → stderr'i yakala → status: `Error`
- [ ] Container temizliği: başarısız job'lardan kalan container'ların silinmesi (`--rm` + explicit cleanup)

### Gelecek (Phase 1+ sonrası)

- [ ] Java runner (`eclipse-temurin:21-jre-alpine`)
- [ ] Go runner (`golang:1.22-alpine`)
- [ ] Rust runner (`rust:1.77-slim`)
- [ ] Test case bazlı çalıştırma: her test case için ayrı container spawn yerine stdin/stdout pipe
- [ ] Runner image versiyonlama ve CI'da otomatik build
- [ ] `docker stats` ile gerçek bellek ölçümü (istatistik bazlı)
