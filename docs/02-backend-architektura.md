# 02 — Backend: architektura

## Punkt wejścia — `backend/src/index.ts`

**Po co:** Główny plik serwera; bez niego backend się nie uruchomi.

**Kluczowe elementy:**

- `express()` — aplikacja Express.
- `cors()` — włączenie CORS (bez ograniczeń origin).
- `express.json()`, `express.urlencoded({ extended: true })` — parsowanie body.
- `passport.initialize()` — inicjalizacja Passport (strategia JWT).
- `app.use('/', router)` — montowanie głównego routera pod ścieżką `/` (Nginx wystawia jako `/api/*`).
- **Kolejność middleware:** CORS → JSON/urlencoded → Passport → router → error handler → 404.
- **Start:** `pool.connect()` → przy sukcesie `app.listen(PORT)` (domyślnie 3000). Przy błędzie połączenia z bazą — `process.exit(1)`.

**Błędy:**

- Błąd w middleware/kontrolerze → `(err, req, res, next)` → `res.status(500).json({ error: 'Something went wrong!', message: err.message })`.
- Nieznana ścieżka → `res.status(404).json({ error: 'Route not found', path: req.path })`.

---

## Konfiguracja bazy — `backend/src/config/database.ts`

**Po co:** Jeden connection pool do PostgreSQL używany w całym backendzie.

**Kluczowe elementy:**

- `new Pool({ user, host, database, password, port })`.
- Zmienne środowiskowe: `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_NAME`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`.
- Domyśły: `user: 'postgres'`, `host: 'localhost'`, `database: 'musicweb'`, `password: 'password'`, `port: 5432`.
- Eksport: `pool` — używany w kontrolerach i w `passport.ts` (pobieranie użytkownika po JWT).

---

## Konfiguracja Passport (JWT) — `backend/src/config/passport.ts`

**Po co:** Weryfikacja tokenu JWT i ustawienie `req.user` dla chronionych tras.

**Kluczowe elementy:**

- **Strategia:** `passport-jwt`, `ExtractJwt.fromAuthHeaderAsBearerToken()` — token z nagłówka `Authorization: Bearer <token>`.
- **Secret:** `process.env.JWT_SECRET` — do weryfikacji podpisu.
- **Callback:** po weryfikacji JWT wywoływany z `jwt_payload`. Pobierany użytkownik: `SELECT id, role, email, username, first_name, last_name, phone FROM users WHERE id = $1` z `jwt_payload.user.id`. Wynik ustawiany jako `req.user` (bez `permissions` — te są w payloadzie JWT, ale Passport ładuje użytkownika z bazy, więc `req.user` ma tylko kolumny z zapytania).
- **Eksport:** `isAuthenticated` = `passport.authenticate('jwt', { session: false })` — middleware do ochrony tras.

**Połączenie z resztą:** Każda chroniona trasa używa `isAuthenticated` przed kontrolerem (lub przed `checkPermission`). Bez poprawnego tokenu Passport zwraca 401.

---

## Middleware autoryzacji — `backend/src/middleware/authMiddleware.ts`

**Po co:** Kontrola dostępu: sprawdzanie uprawnień (RBAC) i wymóg roli ADMIN.

**checkPermission(requiredPermission: string)**

- Sprawdza, czy `req.user` istnieje i ma `id` — jeśli nie → 401.
- Jeśli `req.user.role === 'ADMIN'` → od razu `next()`.
- W przeciwnym razie: zapytanie do bazy — suma uprawnień z `user_permissions` (dla `user_id`) i `role_permissions` (dla `role`). Sprawdzenie, czy w wyniku jest `requiredPermission`.
- Zapytanie: `SELECT 1 FROM (SELECT permission_name FROM user_permissions WHERE user_id = $1 UNION SELECT permission_name FROM role_permissions WHERE role = $2::user_role) AS combined_permissions WHERE permission_name = $3`.
- Jeśli brak uprawnienia → 403 `{ error: 'Forbidden: Insufficient permissions' }`. W razie błędu zapytania → 500.

**requireAdmin**

- Sprawdza `req.user` i `req.user.id` — brak → 401.
- Sprawdza `req.user.role === 'ADMIN'` — jeśli nie → 403 `{ error: 'Forbidden', message: 'This endpoint requires ADMIN role' }`.
- Używany na trasach `/users` (tylko ADMIN).

**Eksport:** `middleware/index.ts` reeksportuje `authMiddleware`.

---

## Routing — `backend/src/routes/index.ts`

**Po co:** Centralne montowanie tras API.

**Struktura:**

- `router.use('/users', usersRoutes)` → `/users`
- `router.use('/music', musicRoutes)` → `/music`
- `router.use('/reviews', reviewsRoutes)` → `/reviews`
- `router.use('/auth', authRoutes)` → `/auth`
- `router.get('/health', healthCheck)` → `/health`
- `router.get('/', index)` → `/`

Dla klienta (przez Nginx) ścieżki są pod prefiksem `/api`, np. `/api/auth/login`, `/api/music`, `/api/health`.

---

## Modele TypeScript — `backend/src/models/`

**Po co:** Typy dla odpowiedzi API i dla zapytań; używane w kontrolerach i w typach Express.

| Plik | Zawartość |
|------|-----------|
| **authUser.ts** | `AuthUser`: `id`, `role`, `username?`, `permissions: string[]`. Używany w `express.d.ts` jako `Express.User`. |
| **user.ts** | `UserRole`: 'ADMIN' \| 'EDITOR' \| 'USER'. `User`, `UserWithPassword`, `UserDTO` (bez hasła, bez phone w DTO). |
| **music.ts** | `Genre`, `Artist`, `Music`, `MusicDTO` (z polem `genre` zmapowanym z `genre_slug`). |
| **review.ts** | `Review`: id, user_id, music_id, rating, title, comment, created_at, updated_at. |

**express.d.ts:** `declare global { namespace Express { interface User extends AuthUser {} } }` — dzięki temu `req.user` w middleware i kontrolerach ma typ `AuthUser`. W praktyce obiekt z bazy (passport) ma też np. `email`, `first_name`, `last_name`, `phone`, ale nie `permissions` (chyba że dodane w innym miejscu).

---

## Kontrolery — co robią, parametry, błędy

### authController.ts

| Funkcja | Wejście | Wyjście / błędy |
|---------|---------|------------------|
| **loginUser** | `req.body`: `email`, `password` | 200: `{ token }`. 400: `{ msg: 'Invalid credentials' }`. 500: `'Server error'`. Pobiera użytkownika po email, porównuje hasło (bcrypt), pobiera uprawnienia z `user_permissions`, generuje JWT (payload: `user: { id, role, username, permissions }`, `expiresIn: 3600`). |
| **registerUser** | `req.body`: `email`, `password`, `username`, `first_name?`, `last_name?` | 201: `{ token, user }`. 400: brak pól, zły email, hasło &lt; 6 znaków. 409: użytkownik z tym emailem/username. Hash hasła (bcrypt), INSERT users (role USER), INSERT do `user_permissions` z roli, JWT jak przy loginie (expiresIn z `JWT_EXPIRES_IN` lub '24h'). |
| **profile** | `req.user` (po isAuthenticated) | 200: `req.user` (JSON). |
| **updateProfile** | `req.user.id`, `req.body`: `username?`, `email?`, `first_name?`, `last_name?` | 200: zaktualizowany user (z permissions). 400: brak pól do aktualizacji. 409: email/username już istnieje. 401: brak usera. |
| **changePassword** | `req.user.id`, `req.body`: `oldPassword`, `newPassword` | 200: `{ message: 'Password changed successfully' }`. 400: brak pól, nowe hasło &lt; 6 znaków, stare hasło błędne, nowe = stare. 404: user nie znaleziony. |

### commonController.ts

| Funkcja | Wejście | Wyjście |
|---------|---------|---------|
| **index** | `req` (opcjonalnie `req.user`) | 200: `{ message, version: '1.0.0', endpoints }`. `endpoints` zawiera `/api/auth`, `/api/music`; jeśli `req.user.permissions` zawiera `users:read` — dodaje `/api/users`; jeśli `reviews:read` — `/api/reviews`. |
| **healthCheck** | — | 200: `{ status: 'ok', timestamp, database: { status, responseTime }, uptime }`. 503 przy błędzie bazy: `database: { status: 'disconnected', error }`. Sprawdza połączenie: `pool.query('SELECT NOW() as current_time')`. |

### musicController.ts

| Funkcja | Wejście | Wyjście / błędy |
|---------|---------|------------------|
| **getAllMusic** | `req.query`: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `genre`, `year` | 200: tablica obiektów muzyki. Nagłówki: `X-Total-Count`, `X-Total-Pages`, `X-Current-Page`, `X-Per-Page`, `Access-Control-Expose-Headers`. Domyślnie page=1, limit=20, sortBy=created_at, sortOrder=desc. Dozwolone sortBy: title, artist, album, year, created_at. Filtry: ILIKE na title/artist/album, genre_slug, year. 500 przy błędzie. |
| **getMusicById** | `req.params.id` | 200: jeden obiekt. 404: `{ error: 'Music entry not found' }`. |
| **createMusic** | `req.body`: `title`, `artist`, `album?`, `year?`, `genre?`, `youtube_url?` | 201: utworzony obiekt. 400: brak title/artist, zły typ, zły year. Genre normalizowane do slug; INSERT genres ON CONFLICT DO NOTHING; INSERT music. |
| **updateMusic** | `req.params.id`, `req.body`: `title?`, `artist?`, `album?`, `year?`, `genre?`, `youtube_url?` | 200: zaktualizowany obiekt. 400: brak pól do aktualizacji, złe typy. 404: brak utworu. |
| **deleteMusic** | `req.params.id` | 200: `{ message: 'Music entry deleted successfully' }`. 404: brak utworu. CASCADE usuwa powiązane reviews. |
| **getGenres** | — | 200: `[{ slug, name }]` posortowane po name. |

### reviewController.ts

| Funkcja | Wejście | Wyjście / błędy |
|---------|---------|------------------|
| **getAllReviews** | `req.query`: `page`, `limit`, `sortBy`, `sortOrder`, `musicId`, `userId`, `minRating`, `maxRating`, `search` | 200: tablica reviews. Nagłówki paginacji jak w music. Dozwolone sortBy: created_at, updated_at, rating, title. 500 przy błędzie. |
| **getReviewById** | `req.params.id` | 200: jeden review. 404: `{ error: 'Review not found' }`. |
| **createReview** | `req.user.id`, `req.body`: `musicId`, `rating`, `title?`, `comment?` | 201: utworzony review. 400: brak musicId/rating, rating poza 1–5. 401: brak usera. 404: brak muzyki. |
| **updateReview** | `req.params.id`, `req.body`: `rating?`, `title?`, `comment?` | 200: zaktualizowany review. 400/404 jak wyżej. |
| **deleteReview** | `req.params.id` | 200: `{ message: 'Review deleted successfully' }`. 404: brak review. |
| **getReviewsByMusicId** | `req.params.id` (music id) | 200: `{ reviews, averageRating, reviewCount }`. reviews z JOIN users (username). 404: brak muzyki. |

### userController.ts

| Funkcja | Wejście | Wyjście / błędy |
|---------|---------|------------------|
| **getAllUsers** | — | 200: tablica userów (id, email, username, first_name, last_name, role, created_at). |
| **getUserById** | `req.params.id` | 200: jeden user. 404: `{ error: 'User not found' }`. |
| **createUser** | `req.body`: `username`, `email`, `password`, `first_name?`, `last_name?`, `role?` | 201: utworzony user. 400: brak wymaganych pól. 409: email/username zajęty. Role domyślnie USER. |
| **updateUser** | `req.params.id`, `req.body`: username, email, first_name, last_name, role, is_active, phone | 200: zaktualizowany user. 400/409/404 jak wyżej. |
| **deleteUser** | `req.params.id` | 200: `{ message: 'User deleted successfully' }`. 404: brak usera. CASCADE w bazie. |

Wszystkie trasy users są chronione przez `isAuthenticated` + `requireAdmin`.

---

## Typy Express — `backend/src/types/express.d.ts`

**Po co:** Aby `req.user` w kontrolerach i middleware miał typ (np. `AuthUser`).

**Zawartość:** `declare global { namespace Express { interface User extends AuthUser {} } }`. Import `AuthUser` z `../models/authUser`. Dzięki temu TypeScript rozumie `req.user?.id`, `req.user?.role` itd.
