# MusicWeb — dokumentacja projektu

## Krótki opis projektu

**MusicWeb** to aplikacja webowa do przeglądania katalogu utworów muzycznych i dodawania opinii. Składa się z:

- **Backend** — API REST (Node.js, Express 5, TypeScript), autentykacja JWT, RBAC (role i uprawnienia), PostgreSQL
- **Frontend** — SPA w Vue 3 + TypeScript, Bootstrap 5, Axios
- **Baza danych** — PostgreSQL (użytkownicy, muzyka, opinie, gatunki, uprawnienia)
- **Proxy** — Nginx jako reverse proxy (jedna domena, /api → backend, / → frontend)

Funkcje: rejestracja/logowanie, lista muzyki z filtrami i paginacją, szczegóły utworu z linkiem YouTube, opinie (rating 1–5), profil użytkownika, panel użytkowników (tylko ADMIN), zarządzanie muzyką (ADMIN/EDITOR).

---

## Szybki start

### Uruchomienie przez Docker Compose (zalecane)

```bash
cd compose/dev
# Utwórz plik .env (skopiuj z .env.example i ustaw JWT_SECRET, POSTGRES_*)
cp .env.example .env
docker compose up --build
```

- **Aplikacja (przez Nginx):** http://localhost  
- **API:** http://localhost/api  
- **Health:** http://localhost/api/health  

Dane logowania admina (po inicjalizacji DB): `admin@example.com` / `password`.

### Uruchomienie lokalne (bez Dockera)

1. **PostgreSQL** — uruchom lokalnie, utwórz bazę `musicweb`, wykonaj skrypty z `db/initdb/` w kolejności.
2. **Backend:**  
   `cd backend` → `npm install` → ustaw w `.env`: `POSTGRES_*`, `JWT_SECRET` → `npm run dev` (port 3000).
3. **Frontend:**  
   `cd frontend` → `npm install` → `npm run dev` (port 5173).  
   W `frontend/src/config/axios.ts` ustaw `baseURL` na `http://localhost:3000` (bez Nginx) lub zostaw `http://localhost/api` jeśli Nginx działa.
4. **Nginx (opcjonalnie):** skopiuj `proxy/nginx.conf`, skonfiguruj proxy na backend i frontend.

Szczegóły w [08-uruchomienie-i-konfiguracja.md](08-uruchomienie-i-konfiguracja.md).

---

## Architektura (schemat)

```
                    ┌─────────────┐
                    │   Klient    │
                    │ (przegląd.) │
                    └──────┬──────┘
                           │
                    http://localhost
                           │
                    ┌─────▼─────┐
                    │   Nginx   │  port 80
                    │  (proxy)  │
                    └─────┬─────┘
              ┌──────────┼──────────┐
              │          │          │
         /api/*          /         ...
              │          │
       ┌──────▼──────┐   │
       │   Backend   │   │
       │ Express:3000│   │
       └──────┬──────┘   │
              │          │
              │   ┌──────▼──────┐
              │   │  Frontend   │  Vite :5173
              │   │  Vue 3 SPA  │
              │   └─────────────┘
              │
       ┌──────▼──────┐
       │  PostgreSQL │  :5432
       └─────────────┘
```

- **Nginx:** `/api/` → `http://backend:3000/` (ścieżka bez prefiksu), `/` → `http://frontend:5173/`.
- **Backend:** nasłuchuje na `/auth`, `/music`, `/reviews`, `/users`, `/health`, `/`. Dla klienta są to odpowiednio `/api/auth`, `/api/music` itd.

---

## Linki do dokumentacji

| Dokument | Zawartość |
|----------|-----------|
| [01-struktura-projektu.md](01-struktura-projektu.md) | Drzewo katalogów, rola folderów, przepływ danych między warstwami |
| [02-backend-architektura.md](02-backend-architektura.md) | Entrypoint, konfiguracje, middleware, routing, modele, kontrolery |
| [03-backend-endpointy.md](03-backend-endpointy.md) | Tabela endpointów (metoda, ścieżka, auth, permission, request/response, paginacja) |
| [04-baza-danych.md](04-baza-danych.md) | Tabele, relacje, klucze, CASCADE, skrypty initdb |
| [05-auth-i-uprawnienia.md](05-auth-i-uprawnienia.md) | JWT (payload, TTL), RBAC, checkPermission, requireAdmin, przykłady |
| [06-frontend-architektura.md](06-frontend-architektura.md) | main.ts, App.vue, router, axios, widoki, token i user |
| [07-frontend-serwisy-i-utilsy.md](07-frontend-serwisy-i-utilsy.md) | authService, musicService, reviewsService, usersService, utils |
| [08-uruchomienie-i-konfiguracja.md](08-uruchomienie-i-konfiguracja.md) | Docker Compose, env, proxy, typowe problemy (401, CORS, JWT_SECRET) |
| [09-checklista-zrozumienia.md](09-checklista-zrozumienia.md) | Pytania kontrolne i najważniejsze rzeczy do zapamiętania |

---

## Mapa endpointów (skrót)

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT/PATCH /api/auth/profile`, `POST /api/auth/change-password`
- **Music:** `GET /api/music` (lista + paginacja), `GET /api/music/genres`, `GET /api/music/:id`, `GET /api/music/:id/reviews`, `POST/PUT/PATCH/DELETE /api/music` (chronione)
- **Reviews:** `GET /api/reviews`, `GET /api/reviews/:id`, `POST /api/reviews`, `PUT/PATCH/DELETE /api/reviews` (chronione)
- **Users:** `GET/POST/PUT/PATCH/DELETE /api/users` (tylko ADMIN)
- **Common:** `GET /api/health`, `GET /api/`

Pełna tabela w [03-backend-endpointy.md](03-backend-endpointy.md).
