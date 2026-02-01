# 08 — Uruchomienie i konfiguracja

## Uruchomienie przez Docker Compose (compose/dev)

**Lokalizacja:** `compose/dev/docker-compose.yml`, plik `.env` w tym samym katalogu.

**Kroki:**

1. Przejdź do katalogu: `cd compose/dev`.
2. Utwórz plik `.env` (skopiuj z `.env.example` i ustaw wartości, zwłaszcza `JWT_SECRET`).
3. Uruchom: `docker compose up --build`.

**Serwisy:**

| Serwis | Port (host) | Opis |
|--------|-------------|------|
| **frontend** | 5173 | Vue (Vite dev server). Volumy: kod frontendu, node_modules anonymous. Zależy od backend (condition: service_healthy). |
| **backend** | 3000 | Node.js (npm run dev, tsx watch). Volumy: kod backendu, node_modules. Zależy od postgres (healthy). Healthcheck: curl -f http://backend:3000. env_file: .env. |
| **postgres** | 5432 | Obraz postgres. Volume: ../../db/initdb → /docker-entrypoint-initdb.d (skrypty SQL przy pierwszym starcie). env_file: .env. Healthcheck: pg_isready. |
| **nginx** | 80 | Reverse proxy. Volume: ../../proxy/nginx.conf → /etc/nginx/nginx.conf:ro. Zależy od backend, frontend. |

**Sieci:** database (backend, postgres), proxy (frontend, backend, postgres, nginx).

**Dostęp po uruchomieniu:**

- Aplikacja (przez Nginx): http://localhost  
- API: http://localhost/api  
- Health: http://localhost/api/health  
- Frontend bezpośrednio (dev): http://localhost:5173 (jeśli port wystawiony)  
- Backend bezpośrednio: http://localhost:3000  

---

## Konfiguracja Nginx — proxy/nginx.conf

**Lokalizacja:** `proxy/nginx.conf`.

**Kluczowe dyrektywy:**

- **location /api/:** `proxy_pass http://backend:3000/;` — żądania do /api/* są przekierowywane na backend; ścieżka traci prefiks /api (np. /api/auth/login → backend otrzymuje /auth/login). Nagłówki: Host, X-Real-IP, X-Forwarded-For.
- **location /:** `proxy_pass http://frontend:5173/;` — reszta ruchu idzie do Vite. Nagłówki jak wyżej; `proxy_http_version 1.1`, Upgrade, Connection — dla WebSocket (HMR).

**Uwaga:** W Docker Compose frontend ma port 5173:5173; przy dostępie przez Nginx (port 80) użytkownik nie łączy się bezpośrednio z 5173, tylko z Nginx.

---

## Zmienne środowiskowe

**Backend (database.ts, passport.ts, authController):**

| Zmienna | Opis | Domyślnie (w kodzie) |
|---------|------|----------------------|
| POSTGRES_USER | Użytkownik PostgreSQL | postgres |
| POSTGRES_HOST | Host bazy | localhost |
| POSTGRES_NAME | Nazwa bazy | musicweb |
| POSTGRES_PASSWORD | Hasło do bazy | password |
| POSTGRES_PORT | Port PostgreSQL | 5432 |
| JWT_SECRET | Klucz do podpisu JWT | — (wymagane) |
| JWT_EXPIRES_IN | Czas życia tokenu (np. '24h') | używane przy registerUser |
| PORT | Port serwera Express | 3000 |
| NODE_ENV | Środowisko (np. development) | — |

**Uwaga:** W `backend/src/config/database.ts` używana jest zmienna **POSTGRES_NAME** (nie POSTGRES_DB). W pliku `.env.example` w compose/dev może być POSTGRES_DB — w takim przypadku backend nie odczyta nazwy bazy z .env, chyba że w .env ustawisz POSTGRES_NAME=musicweb lub zmienisz kod na POSTGRES_DB.

**Postgres (Docker):** POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB (standardowa zmienna obrazu postgres). Przy inicjalizacji tworzona jest baza o nazwie POSTGRES_DB; backend łączy się z bazą o nazwie POSTGRES_NAME — upewnij się, że wartość jest taka sama (np. musicweb).

**Frontend:** W `frontend/src/config/axios.ts` baseURL jest na sztywno `http://localhost/api`. Przy uruchomieniu bez Nginx (np. tylko frontend + backend lokalnie) trzeba zmienić baseURL na np. `http://localhost:3000` (backend bez prefiksu /api). Zmienna VITE_API_URL w .env.example nie jest używana w axios — można dodać w vite.config lub env.d i użyć w axios.

---

## Uruchomienie lokalne (bez Dockera)

1. **PostgreSQL:** Uruchom lokalnie (np. port 5432). Utwórz bazę `musicweb`. Wykonaj skrypty z `db/initdb/` w kolejności alfabetycznej (1_create_schema.sql, 2_permissions.sql, 3_admin_user.sql, 4_seed_music.sql, 5_update_user_permissions.sql, 6_add_youtube_url.sql).
2. **Backend:**  
   `cd backend` → `npm install`.  
   Utwórz plik `.env` w katalogu backend (lub ustaw zmienne w systemie): POSTGRES_USER, POSTGRES_HOST, POSTGRES_NAME, POSTGRES_PASSWORD, POSTGRES_PORT, JWT_SECRET, JWT_EXPIRES_IN (opcjonalnie), PORT.  
   W `index.ts` można dodać na początku: `import 'dotenv/config';` (lub `require('dotenv').config();`), żeby ładować .env przy lokalnym uruchomieniu.  
   `npm run dev` — serwer na http://localhost:3000.
3. **Frontend:**  
   `cd frontend` → `npm install`.  
   W `src/config/axios.ts` ustaw `baseURL: 'http://localhost:3000'` (bez /api, bo Nginx nie jest używany).  
   `npm run dev` — aplikacja na http://localhost:5173.
4. **Nginx (opcjonalnie):** Jeśli chcesz jedną domenę i prefiks /api, skonfiguruj Nginx lokalnie (np. proxy_pass do localhost:3000 dla /api i do localhost:5173 dla /) i w axios ustaw baseURL na http://localhost/api (lub odpowiedni host).

---

## Typowe problemy i diagnoza

| Problem | Możliwa przyczyna | Co zrobić |
|---------|-------------------|-----------|
| **401 Unauthorized** przy chronionych endpointach | Brak tokena, wygasły lub nieprawidłowy JWT, błędny JWT_SECRET. | Sprawdź, czy frontend wysyła nagłówek Authorization: Bearer &lt;token&gt;. Sprawdź, czy JWT_SECRET jest taki sam przy generowaniu i weryfikacji. Sprawdź datę wygaśnięcia tokenu (login: 3600 s). |
| **403 Forbidden** | Użytkownik zalogowany, ale bez wymaganego uprawnienia lub bez roli ADMIN (na /users). | Sprawdź role_permissions i user_permissions w bazie. ADMIN omija checkPermission. |
| **CORS** | Przeglądarka blokuje żądania cross-origin. | Backend ma `app.use(cors())` — bez ograniczeń. Przy proxy przez Nginx (ta sama domena) CORS zwykle nie jest problemem. Jeśli frontend na innym porcie/host — sprawdź, czy backend zwraca nagłówki Access-Control-Allow-Origin. |
| **Brak JWT_SECRET** | Nie ustawiono JWT_SECRET w .env lub w zmiennych Dockera. | Ustaw JWT_SECRET w compose/dev/.env (dla backendu). Przy lokalnym uruchomieniu — w .env w backendzie lub w zmiennych środowiskowych. Bez tego weryfikacja JWT się nie uda. |
| **Błąd połączenia z bazą** | Backend nie może połączyć się z PostgreSQL (host, port, user, password, database). | W Dockerze: backend łączy się z hostem `postgres` (nazwa serwisu). Lokalnie: POSTGRES_HOST=localhost. Sprawdź POSTGRES_NAME vs POSTGRES_DB — nazwa bazy musi się zgadzać. |
| **404 na /api/*** | Nginx nie przekierowuje lub backend nie nasłuchuje. | Sprawdź nginx.conf: location /api/ → proxy_pass http://backend:3000/;. Sprawdź, czy backend działa (healthcheck, curl localhost:3000/health wewnątrz sieci). |
| **Frontend przekierowuje do /login po zalogowaniu (np. na /music)** | Błąd w routerze beforeEach: gałąź else przy requiresAdmin przekierowuje do /login dla tras nie-/users. | Sprawdź `frontend/src/router/index.ts`: warunek `(to.path === '/users' \|\| to.meta.requiresAdmin) && isLoggedIn` — gdy false (np. trasa /music), wykonywany jest else i next({ path: '/login' }). Poprawka: admin check tylko gdy `to.path === '/users'` (lub to.meta.requiresAdmin), bez else przekierowującego do login. |
| **Skrypty initdb nie wykonane** | Volume initdb montowany po pierwszym utworzeniu wolumenu danych Postgresa. | Przy pierwszym uruchomieniu kontenera Postgres skrypty z docker-entrypoint-initdb.d są wykonywane tylko jeśli katalog danych jest pusty. Usunięcie wolumenu danych i ponowne `docker compose up` uruchomi initdb od zera (utrata danych). |
| **Healthcheck backendu fails** | Backend nie odpowiada na GET / (root) lub nie startuje. | Backend nasłuchuje na GET / (index) i GET /health. Sprawdź logi kontenera backendu. Upewnij się, że baza jest dostępna (backend zależy od postgres healthy). |

---

## Checklist przed uruchomieniem

- [ ] Plik `compose/dev/.env` istnieje i zawiera JWT_SECRET, POSTGRES_* (lub POSTGRES_NAME=musicweb jeśli backend czyta POSTGRES_NAME).
- [ ] W Dockerze: nazwa bazy w .env dla postgres (POSTGRES_DB) i dla backendu (POSTGRES_NAME) jest taka sama.
- [ ] Backend ma dostęp do sieci `database` (postgres) i `proxy` (nginx).
- [ ] Frontend w axios ma baseURL wskazujący na API (http://localhost/api przy Nginx, http://localhost:3000 przy samym backendzie).
