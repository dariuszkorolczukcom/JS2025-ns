# 03 — Backend: endpointy

Ścieżki podane z perspektywy klienta (prefiks `/api` przez Nginx). Backend nasłuchuje na `/auth`, `/music` itd.

---

## Tabela endpointów

| Metoda | Ścieżka (klient) | Auth | Permission / warunek | Opis |
|--------|-------------------|------|----------------------|-----|
| GET | /api/ | nie | — | Welcome, lista endpointów (zależna od req.user) |
| GET | /api/health | nie | — | Health check (baza + uptime) |
| POST | /api/auth/register | nie | — | Rejestracja |
| POST | /api/auth/login | nie | — | Logowanie |
| GET | /api/auth/profile | Bearer | — | Profil zalogowanego |
| PUT | /api/auth/profile | Bearer | — | Aktualizacja profilu |
| PATCH | /api/auth/profile | Bearer | — | Aktualizacja profilu (partial) |
| POST | /api/auth/change-password | Bearer | — | Zmiana hasła |
| GET | /api/music | nie | — | Lista muzyki (paginacja, filtry) |
| GET | /api/music/genres | nie | — | Lista gatunków |
| GET | /api/music/:id | nie | — | Szczegóły utworu |
| GET | /api/music/:id/reviews | nie | — | Opinie dla utworu + averageRating, reviewCount |
| POST | /api/music | Bearer | music:create | Dodanie utworu |
| PUT | /api/music/:id | Bearer | music:update | Edycja utworu |
| PATCH | /api/music/:id | Bearer | music:update | Edycja utworu (partial) |
| DELETE | /api/music/:id | Bearer | music:delete | Usunięcie utworu |
| GET | /api/reviews | Bearer | reviews:read | Lista opinii (paginacja, filtry) |
| GET | /api/reviews/:id | Bearer | reviews:read | Szczegóły opinii |
| POST | /api/reviews | Bearer | — | Dodanie opinii (każdy zalogowany) |
| PUT | /api/reviews/:id | Bearer | reviews:update | Edycja opinii |
| PATCH | /api/reviews/:id | Bearer | reviews:update | Edycja opinii (partial) |
| DELETE | /api/reviews/:id | Bearer | reviews:delete | Usunięcie opinii |
| GET | /api/users | Bearer | ADMIN | Lista użytkowników |
| GET | /api/users/:id | Bearer | ADMIN | Szczegóły użytkownika |
| POST | /api/users | Bearer | ADMIN | Utworzenie użytkownika |
| PUT | /api/users/:id | Bearer | ADMIN | Edycja użytkownika |
| PATCH | /api/users/:id | Bearer | ADMIN | Edycja użytkownika (partial) |
| DELETE | /api/users/:id | Bearer | ADMIN | Usunięcie użytkownika |

---

## Paginacja i nagłówki

Endpointy z listą (GET /api/music, GET /api/reviews) zwracają:

- **Body:** tablica obiektów (np. `Music[]`, `Review[]`).
- **Nagłówki:**
  - `X-Total-Count` — łączna liczba rekordów (przed paginacją).
  - `X-Total-Pages` — liczba stron.
  - `X-Current-Page` — aktualna strona (np. 1).
  - `X-Per-Page` — limit na stronę (np. 20).
  - `Access-Control-Expose-Headers`: `X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page` — żeby przeglądarka mogła odczytać te nagłówki w CORS.

**Query params:**

- **GET /api/music:** `page`, `limit`, `sortBy` (title, artist, album, year, created_at), `sortOrder` (asc, desc), `search` (ILIKE title/artist/album), `genre`, `year`. Domyślnie: page=1, limit=20, sortBy=created_at, sortOrder=desc.
- **GET /api/reviews:** `page`, `limit`, `sortBy` (created_at, updated_at, rating, title), `sortOrder`, `musicId`, `userId`, `minRating`, `maxRating`, `search` (title/comment). Domyślnie: page=1, limit=20, sortBy=created_at, sortOrder=desc.

---

## Przykładowe request/response (skrót)

### POST /api/auth/login

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 400:** `{ "msg": "Invalid credentials" }`

---

### GET /api/auth/profile (nagłówek: Authorization: Bearer &lt;token&gt;)

**Response 200:** obiekt użytkownika z bazy (id, role, email, username, first_name, last_name, phone) — tak zwraca Passport + kontroler `profile` (res.json(req.user)).

---

### GET /api/music?page=1&limit=10&genre=rock

**Response 200:** tablica obiektów, np.:

```json
[
  {
    "id": "uuid",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "year": 1975,
    "genre": "rock",
    "youtube_url": "https://...",
    "created_at": "2025-01-01T12:00:00.000Z"
  }
]
```

**Nagłówki:** X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page.

---

### GET /api/music/:id/reviews

**Response 200:**

```json
{
  "reviews": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "music_id": "uuid",
      "rating": 5,
      "title": "Great",
      "comment": "...",
      "created_at": "...",
      "updated_at": "...",
      "username": "jan"
    }
  ],
  "averageRating": 4.5,
  "reviewCount": 10
}
```

---

### POST /api/reviews

**Request (Bearer wymagany):**

```json
{
  "musicId": "uuid-muzyki",
  "rating": 5,
  "title": "Super",
  "comment": "Polecam"
}
```

**Response 201:** obiekt utworzonej opinii (id, user_id, music_id, rating, title, comment, created_at, updated_at).

**Błędy:** 400 — brak musicId/rating lub rating poza 1–5; 401 — brak tokena; 404 — brak muzyki.

---

### POST /api/music (Bearer + music:create)

**Request:**

```json
{
  "title": "New Song",
  "artist": "Artist",
  "album": "Album",
  "year": 2024,
  "genre": "pop",
  "youtube_url": "https://www.youtube.com/..."
}
```

**Response 201:** utworzony obiekt (id, title, artist, album, year, genre, youtube_url, created_at). Wymagane: title, artist.

---

## Błędy wspólne

- **401 Unauthorized:** brak tokena lub nieprawidłowy/wygasły JWT. Często: `{ error: 'Unauthorized' }` lub odpowiedź Passport.
- **403 Forbidden:** brak uprawnienia (checkPermission) lub brak roli ADMIN (requireAdmin). `{ error: 'Forbidden: Insufficient permissions' }` lub `{ error: 'Forbidden', message: 'This endpoint requires ADMIN role' }`.
- **404:** brak zasobu (np. Music entry not found, User not found, Review not found).
- **409:** konflikt (np. email/username już istnieje).
- **500:** błąd serwera (message w body).
