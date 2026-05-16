.PHONY: up down build build-runners logs ps migrate seed clean

## Tüm servisleri dev modda başlat
up:
	docker compose -f docker-compose.yml up

## Arka planda başlat
up-d:
	docker compose -f docker-compose.yml up -d --build

## Durdur
down:
	docker compose down

## Yeniden build et
build:
	docker compose -f docker-compose.yml build

## Runner image'larını build et
build-runners:
	docker build -t codexam-runner-python     ./runners/python
	docker build -t codexam-runner-c          ./runners/c
	docker build -t codexam-runner-cpp        ./runners/cpp
	docker build -t codexam-runner-javascript ./runners/javascript
	docker build -t codexam-runner-java       ./runners/java
	docker build -t codexam-runner-go         ./runners/go

## Logları canlı izle
logs:
	docker compose logs -f api worker

## Servis durumlarını göster
ps:
	docker compose ps

## EF Core migration uygula
migrate:
	docker exec codexam-api dotnet ef database update \
	  --project CodExam.Infrastructure \
	  --startup-project CodExam.Api

## Seed data yükle
seed:
	docker exec codexam-api dotnet run --project CodExam.Api -- seed

## Geçici dosyaları temizle
clean:
	docker compose down -v
	find . -name "bin" -type d | xargs rm -rf
	find . -name "obj" -type d | xargs rm -rf
	rm -rf frontend/node_modules frontend/dist

## .env dosyasını oluştur (yoksa)
init:
	@test -f .env || cp .env.example .env && echo ".env created from .env.example"
