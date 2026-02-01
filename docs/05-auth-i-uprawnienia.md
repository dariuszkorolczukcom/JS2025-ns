# 05 — Auth i uprawnienia

## JWT: payload, czas życia, gdzie sprawdzany

**Generowanie tokena (authController):**

- **loginUser:** payload = `{ user: { id, role, username, permissions } }`. `permissions` — lista z tabeli `user_permissions` dla danego user_id. `expiresIn: 3600` (1 godzina w sekundach).
- **registerUser:** ten sam kształt payloadu; `expiresIn` z `process.env.JWT_EXPIRES_IN` lub `'24h'`.

**Struktura payload JWT (po zdekodowaniu):**

```json
{
  "user": {
    "id": "uuid",
    "role": "ADMIN",
    "username": "admin",
    "permissions": ["users:read", "users:create", ...]
  },
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Gdzie sprawdzany:** middleware Passport (`passport.authenticate('jwt', { session: false })`). Wyciąga token z nagłówka `Authorization: Bearer <token>`, weryfikuje podpis (`JWT_SECRET`) i datę wygaśnięcia. Następnie callback strategii pobiera użytkownika z bazy po `jwt_payload.user.id` i ustawia `req.user` (obiekt z bazy: id, role, email, username, first_name, last_name, phone — **bez** tablicy permissions w req.user, bo Passport ładuje tylko SELECT z users). Permissions są w tokenie, ale w kontrolerach backend zwykle używa się `checkPermission`, które sprawdza uprawnienia w bazie (user_permissions + role_permissions).

**Zmienne:** `JWT_SECRET` (wymagane), `JWT_EXPIRES_IN` (opcjonalne, np. '24h').

---

## RBAC: role, permissions, checkPermission, requireAdmin

**Role (enum user_role):** ADMIN, EDITOR, USER.

**Uprawnienia (nazwy):** users:read/create/update/delete, music:create/read/update/delete, reviews:create/read/update/delete, artists:*, genres:* (pełna lista w `2_permissions.sql`). Backend używa głównie: users:*, music:create/update/delete, reviews:read/create/update/delete.

**checkPermission(requiredPermission):**

1. Sprawdza, czy użytkownik jest zalogowany (`req.user`, `req.user.id`) — jeśli nie → 401.
2. Jeśli `req.user.role === 'ADMIN'` → od razu `next()`.
3. W przeciwnym razie: zapytanie do bazy — suma uprawnień z `user_permissions` (dla user_id) i `role_permissions` (dla role). Jeśli w wyniku jest `requiredPermission` → `next()`, w przeciwnym razie → 403.

**requireAdmin:** Sprawdza `req.user` i `req.user.role === 'ADMIN'`. Brak usera → 401, inna rola → 403. Używany na trasach `/users`.

**Przykłady kto może co:**

| Akcja | Kto |
|-------|-----|
| Rejestracja, logowanie | Wszyscy (brak auth). |
| GET /api/auth/profile, PUT /api/auth/profile, change-password | Każdy zalogowany. |
| GET /api/music, /api/music/genres, /api/music/:id, /api/music/:id/reviews | Wszyscy (publiczne). |
| POST/PUT/PATCH/DELETE /api/music | Zalogowani z uprawnieniem music:create/update/delete (ADMIN, EDITOR z roli). |
| GET /api/reviews, GET /api/reviews/:id | Zalogowani z reviews:read (ADMIN, EDITOR). |
| POST /api/reviews | Każdy zalogowany (bez checkPermission). |
| PUT/PATCH/DELETE /api/reviews | Zalogowani z reviews:update/delete (ADMIN, EDITOR; USER ma te uprawnienia w roli — może edytować/usuwać dowolne opinie według backendu). |
| GET/POST/PUT/PATCH/DELETE /api/users | Tylko ADMIN (requireAdmin). |

---

## Przepływy (flow)

### 1. Logowanie (frontend → backend → JWT → localStorage → profile)

```
[LoginView.vue]  użytkownik wypełnia email, hasło → handleSubmit()
       │
       ▼
[authService.login({ email, password })]  →  apiClient.post('/auth/login', data)
       │
       ▼
[axios]  baseURL + '/auth/login'  →  http://localhost/api/auth/login
       │  (dla nie-publicznego URL byłby dodany Bearer — tu nie, bo /auth/login jest chroniony dopiero po stronie backendu; frontend nie dodaje tokenu do /auth/login)
       ▼
[Nginx]  /api/*  →  backend:3000/auth/login
       │
       ▼
[backend routes/auth.ts]  POST /login  →  authController.loginUser (bez isAuthenticated)
       │
       ▼
[authController.loginUser]  SELECT users WHERE email; bcrypt.compare(password, password_hash);
       │  SELECT user_permissions WHERE user_id; payload = { user: { id, role, username, permissions } };
       │  jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 })  →  res.json({ token })
       ▼
[Frontend]  response.data.token  →  localStorage.setItem('token', token)
       │  authService.getProfile()  →  GET /api/auth/profile z Bearer  →  res.json(req.user)
       │  localStorage.setItem('user', JSON.stringify(user))
       │  router.push(redirect || '/')
       ▼
[App.vue]  checkLoginStatus()  →  odczyt token + user z localStorage  →  isLoggedIn = true
```

### 2. Autoryzacja (Bearer token → passport-jwt → req.user → checkPermission)

```
[Komponent Vue]  np. musicService.createMusic(data)  →  apiClient.post('/music', payload)
       │
       ▼
[axios request interceptor]  URL nie jest publiczny  →  Authorization: Bearer <localStorage.token>
       │
       ▼
[Backend routes/music.ts]  POST '/'  →  isAuthenticated, checkPermission('music:create'), musicController.createMusic
       │
       ▼
[isAuthenticated]  passport.authenticate('jwt'):
       │  ExtractJwt.fromAuthHeaderAsBearerToken()  →  token
       │  jwt.verify(token, JWT_SECRET)  →  payload
       │  pool.query('SELECT ... FROM users WHERE id = $1', [payload.user.id])  →  req.user = row
       ▼
[checkPermission('music:create')]  req.user.role === 'ADMIN'  →  next();  lub zapytanie user_permissions + role_permissions  →  next() lub 403
       │
       ▼
[musicController.createMusic]  req.body, INSERT music  →  res.status(201).json(...)
```

### 3. Pobranie listy muzyki z filtrami i paginacją (query params → SQL → nagłówki X-Total-Count)

```
[MusicListView.vue]  musicService.fetchMusic({ page: 1, limit: 20, genre: 'rock', search: 'Queen' })
       │
       ▼
[musicService]  apiClient.get('/music', { params: { page, limit, genre, search } })
       │  URL: /music?page=1&limit=20&genre=rock&search=Queen
       ▼
[Backend]  GET /music  →  musicController.getAllMusic (bez auth)
       │  req.query.page, limit, sortBy, sortOrder, search, genre, year
       │  WHERE (title ILIKE ... OR artist ILIKE ... OR album ILIKE ...) AND genre_slug = $2
       │  SELECT COUNT(*)  →  totalCount, totalPages
       │  SELECT ... FROM music ... ORDER BY ... LIMIT $n OFFSET $n+1
       │  res.set('X-Total-Count', totalCount); res.set('X-Total-Pages', totalPages); res.set('X-Current-Page', page); res.set('X-Per-Page', limit);
       │  res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page');
       │  res.json(result.rows)
       ▼
[musicService]  return { data: response.data, totalCount: response.headers['x-total-count'], totalPages: response.headers['x-total-pages'] }
       │
       ▼
[MusicListView.vue]  lista + paginacja w UI
```

### 4. Dodawanie opinii (frontend formularz → /reviews → zapis → odświeżenie listy)

```
[MusicDetailsView.vue]  formularz: musicId (z route), rating, title, comment  →  submit
       │
       ▼
[reviewsService.createReview({ musicId, rating, title, comment })]  →  apiClient.post('/reviews', { musicId, rating, title, comment })
       │  Authorization: Bearer <token> (interceptor)
       ▼
[Backend routes/reviews.ts]  POST '/'  →  isAuthenticated, reviewController.createReview (bez checkPermission)
       │
       ▼
[reviewController.createReview]  userId = req.user.id; walidacja musicId, rating 1–5; INSERT reviews  →  res.status(201).json(review)
       ▼
[Frontend]  response.data  →  np. dodanie opinii do lokalnej listy lub ponowne fetchReviewsByMusicId(musicId)  →  odświeżenie listy opinii i averageRating
```

---

## Diagram przepływu requestu z auth (ASCII)

```
  Browser                    Nginx                 Backend
     │                         │                       │
     │  GET /api/music (no token)                      │
     │  or POST /api/music + Authorization: Bearer T   │
     ├────────────────────────►│                       │
     │                         │  forward /music       │
     │                         ├──────────────────────►│
     │                         │                       │ passport JWT → req.user
     │                         │                       │ checkPermission → 403 or next
     │                         │                       │ controller → SQL → JSON
     │                         │◄──────────────────────┤
     │◄────────────────────────┤  response + headers   │
     │                         │                       │
```

---

## Najważniejsze do zapamiętania

- Token JWT zawiera `user.id`, `user.role`, `user.permissions`; czas życia: login 3600s, register z env lub 24h.
- Passport po weryfikacji JWT ładuje użytkownika z bazy i ustawia `req.user` (kolumny z users, bez tablicy permissions w tym obiekcie).
- checkPermission(permission) — ADMIN omija sprawdzanie; inni: suma user_permissions + role_permissions w bazie.
- requireAdmin — tylko rola ADMIN; używany na /api/users.
- Publiczne endpointy (bez Bearer): GET /api/music, /api/music/genres, /api/music/:id, /api/music/:id/reviews. Reszta wymaga tokenu (i ewentualnie permission lub ADMIN).
