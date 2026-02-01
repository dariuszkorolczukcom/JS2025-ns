# 01 — Struktura projektu

## Drzewo katalogów

```
JS2025-ns/
├── backend/                    # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts            # Punkt wejścia serwera
│   │   ├── config/
│   │   │   ├── database.ts     # Pool PostgreSQL
│   │   │   └── passport.ts     # Strategia JWT, isAuthenticated
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts   # checkPermission, requireAdmin
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── index.ts        # Montowanie /users, /music, /reviews, /auth, /health, /
│   │   │   ├── auth.ts
│   │   │   ├── music.ts
│   │   │   ├── reviews.ts
│   │   │   └── users.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── commonController.ts
│   │   │   ├── musicController.ts
│   │   │   ├── reviewController.ts
│   │   │   └── userController.ts
│   │   ├── models/
│   │   │   ├── authUser.ts
│   │   │   ├── music.ts
│   │   │   ├── review.ts
│   │   │   └── user.ts
│   │   └── types/
│   │       └── express.d.ts    # Rozszerzenie Express.User
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Frontend SPA (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── main.ts             # createApp, router, mount
│   │   ├── App.vue             # Layout: Navbar, router-view, Footer; stan logowania
│   │   ├── config/
│   │   │   └── axios.ts        # apiClient, interceptory (token, 401)
│   │   ├── router/
│   │   │   └── index.ts        # Trasy, beforeEach (requiresAuth, requiresAdmin, requiresGuest)
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── musicService.ts
│   │   │   ├── reviewsService.ts
│   │   │   └── usersService.ts
│   │   ├── views/              # Widoki (strony)
│   │   ├── components/         # Navbar, Footer, StarRating, WalkmanLogo
│   │   ├── validators/         # authValidators, musicValidators, reviewValidators, userValidators
│   │   ├── utils/              # dateUtils, debounce, userUtils
│   │   └── assets/             # main.css, themes.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── Dockerfile
│
├── db/
│   └── initdb/                 # Skrypty inicjalizacyjne PostgreSQL (kolejność alfabetyczna)
│       ├── 1_create_schema.sql # Tabele: users, permissions, user_permissions, role_permissions, music, reviews, genres, artists
│       ├── 2_permissions.sql   # INSERT permissions, role_permissions
│       ├── 3_admin_user.sql    # Admin (admin@example.com)
│       ├── 4_seed_music.sql    # Gatunki + 20 utworów
│       ├── 5_update_user_permissions.sql
│       └── 6_add_youtube_url.sql
│
├── compose/
│   └── dev/
│       ├── docker-compose.yml  # frontend, backend, postgres, nginx
│       └── .env.example
│
├── proxy/
│   └── nginx.conf              # location /api/ → backend:3000/, location / → frontend:5173/
│
└── docs/                       # Ta dokumentacja (ten zestaw plików)
```

---

## Rola folderów

| Folder / plik | Rola |
|---------------|------|
| **backend/** | Serwer API: Express, routing, kontrolery, połączenie z PostgreSQL, JWT (Passport), RBAC. |
| **backend/src/config/** | Konfiguracja: `database.ts` — pool pg; `passport.ts` — JWT strategy, `isAuthenticated`. |
| **backend/src/middleware/** | `checkPermission(permission)`, `requireAdmin` — ochrona tras. |
| **backend/src/routes/** | Montowanie tras: `/users`, `/music`, `/reviews`, `/auth`, `/health`, `/`. Nginx wystawia je jako `/api/*`. |
| **backend/src/controllers/** | Logika biznesowa: zapytania SQL, walidacja, odpowiedzi JSON. |
| **backend/src/models/** | Interfejsy TypeScript (User, Music, Review, AuthUser). |
| **backend/src/types/** | `express.d.ts` — rozszerzenie `Express.User` o pola z `AuthUser`. |
| **frontend/** | Aplikacja Vue 3: router, serwisy API, widoki, komponenty. |
| **frontend/src/config/axios.ts** | Jedna instancja Axios z `baseURL`, request (Bearer token), response (401 → login). |
| **frontend/src/router/** | Trasy i guardy: `requiresAuth`, `requiresAdmin`, `requiresGuest`. |
| **frontend/src/services/** | Wywołania API (auth, music, reviews, users); mapowanie nagłówków paginacji. |
| **db/initdb/** | Skrypty uruchamiane przy pierwszym starcie kontenera PostgreSQL (Docker `docker-entrypoint-initdb.d`). |
| **compose/dev/** | Definicja serwisów Docker (frontend, backend, postgres, nginx) i sieci. |
| **proxy/** | Konfiguracja Nginx: jeden wejściowy port 80, rozdzielenie `/api` i `/`. |

---

## Jak dane „płyną” między warstwami

```
[Przeglądarka]
      │
      │  HTTP (np. GET /api/music?page=1&limit=20)
      ▼
[Nginx]  /api/* → backend:3000/
      │
      │  GET /music?page=1&limit=20  (bez prefiksu /api)
      ▼
[Express]  router.use('/music', musicRoutes)
      │
      │  Middleware: (opcjonalnie) isAuthenticated → passport JWT → req.user
      │              (opcjonalnie) checkPermission('music:create')
      ▼
[Kontroler]  musicController.getAllMusic(req, res)
      │
      │  pool.query(...) — parametry z req.query, req.params, req.body
      ▼
[PostgreSQL]
      │
      │  Wynik: rows + nagłówki (X-Total-Count itd.)
      ▼
[Response]  res.json(result.rows), res.set('X-Total-Count', ...)
      │
      ▼
[Frontend]  apiClient.get('/music', { params }) → response.data, response.headers['x-total-count']
      │
      ▼
[Widok Vue]  musicService.fetchMusic() → dane do szablonu
```

- **Request:** użytkownik → Nginx (jeden host/port) → backend (Express) → middleware → kontroler → baza.
- **Response:** baza → kontroler (JSON + nagłówki) → Nginx → przeglądarka → axios → serwis → komponent.
- **Token:** frontend zapisuje JWT w `localStorage`; axios dodaje `Authorization: Bearer <token>` do żądań (oprócz publicznych ścieżek).

Szczegółowe przepływy (logowanie, autoryzacja, lista muzyki, dodawanie opinii) są w [05-auth-i-uprawnienia.md](05-auth-i-uprawnienia.md) oraz w sekcjach „Przepływ” w dokumentach backend/frontend.
